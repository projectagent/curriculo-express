import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/pages/LandingPage';
import { buildWhatsAppUrl, formatWhatsAppMessage } from '../../src/services/whatsappService';
import { getWhatsAppTargetPhone } from '../../src/config/env';
import { validateLeadForm, isValidUrl } from '../../src/utils/validators';
import { normalizeUrl } from '../../src/utils/formatters';
import { LocalStorageRepository } from '../../src/services/storage/LocalStorageRepository';
import { setStorageRepositoryForTesting, getStorageRepository } from '../../src/services/storage/storageFactory';

describe('Tier 5: Adversarial Stress & Hardening Test Suite (Milestone M1)', () => {
  beforeEach(() => {
    localStorage.clear();
    setStorageRepositoryForTesting(new LocalStorageRepository());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    setStorageRepositoryForTesting(null);
  });

  // =========================================================================
  // 1. WhatsApp URL Builder Adversarial Stress Testing
  // =========================================================================
  describe('5.1 WhatsApp URL Builder & Encoding Robustness', () => {
    it('5.1.1 thoroughly encodes all Portuguese accents and diacritics (lowercase and uppercase)', () => {
      const accentsLower = 'á à â ã é ê í ó ô õ ú ü ç';
      const accentsUpper = 'Á À Â Ã É Ê Í Ó Ô Õ Ú Ü Ç';
      const name = `Candidato ${accentsUpper}`;
      const role = `Especialista em ${accentsLower}`;

      const url = buildWhatsAppUrl(name, role);
      const urlObj = new URL(url);

      // Verify no malformed URL and parameter matches exact format
      expect(url.startsWith('https://wa.me/')).toBe(true);
      expect(urlObj.searchParams.has('text')).toBe(true);

      const text = urlObj.searchParams.get('text');
      expect(text).toContain(name);
      expect(text).toContain(role);

      // Verify percent encoding of Portuguese diacritics in the raw query string
      expect(url).toContain('%C3%A1'); // á
      expect(url).toContain('%C3%A0'); // à
      expect(url).toContain('%C3%A2'); // â
      expect(url).toContain('%C3%A3'); // ã
      expect(url).toContain('%C3%A9'); // é
      expect(url).toContain('%C3%AA'); // ê
      expect(url).toContain('%C3%AD'); // í
      expect(url).toContain('%C3%B3'); // ó
      expect(url).toContain('%C3%B4'); // ô
      expect(url).toContain('%C3%B5'); // õ
      expect(url).toContain('%C3%BA'); // ú
      expect(url).toContain('%C3%BC'); // ü
      expect(url).toContain('%C3%A7'); // ç

      // Verify bidirectional round-trip decoding
      const expectedMessage = formatWhatsAppMessage(name, role);
      expect(text).toBe(expectedMessage);
      const manualDecoded = decodeURIComponent(url.split('?text=')[1]);
      expect(manualDecoded).toBe(expectedMessage);
    });

    it('5.1.2 prevents query string parameter injection via &, #, ?, and = symbols', () => {
      // If & or # are not encoded properly, URL parsers interpret them as multiple params or hash fragments
      const name = 'João & Maria #Tech = Top ? Winner';
      const role = 'Backend & Cloud / DevOps #1 & QA';

      const url = buildWhatsAppUrl(name, role);
      const urlObj = new URL(url);

      // 1. Must NOT split into additional query parameters
      const params = Array.from(urlObj.searchParams.keys());
      expect(params.length).toBe(1);
      expect(params[0]).toBe('text');

      // 2. Must NOT create a hash fragment
      expect(urlObj.hash).toBe('');

      // 3. Raw URL must contain percent-encoded representations
      expect(url).toContain('%26'); // &
      expect(url).toContain('%23'); // #
      expect(url).toContain('%3D'); // =
      expect(url).toContain('%3F'); // ?

      // 4. Decoded text must faithfully retain the characters
      const text = urlObj.searchParams.get('text');
      expect(text).toContain('João & Maria #Tech = Top ? Winner');
      expect(text).toContain('Backend & Cloud / DevOps #1 & QA');
    });

    it('5.1.3 preserves plus signs (+) and at-symbols (@) without space conversion or corruption', () => {
      const name = 'C++ Developer @ BigTech + Startups';
      const role = 'Senior C++ & C# Architect (@aws + @gcp)';

      const url = buildWhatsAppUrl(name, role);
      const urlObj = new URL(url);

      // '+' in URLs can be misconstrued as spaces if not escaped (%2B)
      expect(url).toContain('%2B');
      expect(url).toContain('%40');

      const text = urlObj.searchParams.get('text');
      expect(text).toContain('C++ Developer @ BigTech + Startups');
      expect(text).toContain('Senior C++ & C# Architect (@aws + @gcp)');
    });

    it('5.1.4 handles long strings (1000+, 2500+, 5000+ characters) without parameter truncation or buffer crash', () => {
      const longName = 'A'.repeat(500) + ' & ' + 'B'.repeat(500); // 1003 chars
      const longRole = 'C'.repeat(1500) + ' / ' + 'D'.repeat(1500); // 3003 chars

      const url = buildWhatsAppUrl(longName, roleSample(longRole));
      expect(() => new URL(url)).not.toThrow();

      const urlObj = new URL(url);
      const text = urlObj.searchParams.get('text');
      expect(text).not.toBeNull();
      expect(text?.length).toBeGreaterThan(4000);
      expect(text).toContain('A'.repeat(500));
      expect(text).toContain('B'.repeat(500));
      expect(text).toContain('C'.repeat(1500));
      expect(text).toContain('D'.repeat(1500));

      function roleSample(r: string) { return r; }
    });

    it('5.1.5 handles empty inputs and pure whitespace without throwing exceptions', () => {
      const urlEmpty = buildWhatsAppUrl('', '');
      expect(() => new URL(urlEmpty)).not.toThrow();
      expect(urlEmpty.startsWith('https://wa.me/')).toBe(true);

      const urlWhitespace = buildWhatsAppUrl('   ', '   \t\n  ');
      expect(() => new URL(urlWhitespace)).not.toThrow();
      const decoded = decodeURIComponent(urlWhitespace.split('?text=')[1]);
      expect(decoded).toBe('Olá, acabei de preencher o formulário. Meu nome é , sou da área de  e quero a revisão express.');
    });

    it('5.1.6 handles diverse international characters, Unicode symbols, and emojis', () => {
      const name = 'René Müller-Nakamura 👩‍💻 (🇧🇷)';
      const role = 'AI & Data Science 🚀✨ [NLP / LLM]';

      const url = buildWhatsAppUrl(name, role);
      const urlObj = new URL(url);
      const text = urlObj.searchParams.get('text');

      expect(text).toContain(name);
      expect(text).toContain(role);
      expect(text).toContain('👩‍💻');
      expect(text).toContain('🚀✨');

      // Round-trip verification
      const manualDecoded = decodeURIComponent(url.split('?text=')[1]);
      expect(manualDecoded).toBe(formatWhatsAppMessage(name, role));
    });

    it('5.1.7 normalizes phone numbers containing spaces, hyphens, parentheses, and country codes', () => {
      const url1 = buildWhatsAppUrl('Teste', 'Dev', '+55 (11) 98765-4321');
      expect(url1.startsWith('https://wa.me/5511987654321?text=')).toBe(true);

      const url2 = buildWhatsAppUrl('Teste', 'Dev', '55 11 91234-5678');
      expect(url2.startsWith('https://wa.me/5511912345678?text=')).toBe(true);

      const url3 = buildWhatsAppUrl('Teste', 'Dev', '  55 (21) 99999.0000  ');
      expect(url3.startsWith('https://wa.me/5521999990000?text=')).toBe(true);
    });
  });

  // =========================================================================
  // 2. Form Validation Adversarial Testing
  // =========================================================================
  describe('5.2 Form Validation Edge Cases & Injection Defenses', () => {
    it('5.2.1 rejects whitespace-only inputs for all three mandatory fields', () => {
      const testCases = [
        { name: '   ', link: 'https://linkedin.com/in/ok', areaRole: 'Frontend' },
        { name: '\t\t\n', link: 'https://linkedin.com/in/ok', areaRole: 'Frontend' },
        { name: 'Carlos', link: '   ', areaRole: 'Frontend' },
        { name: 'Carlos', link: '\n  \t  \n', areaRole: 'Frontend' },
        { name: 'Carlos', link: 'https://linkedin.com/in/ok', areaRole: '   ' },
        { name: 'Carlos', link: 'https://linkedin.com/in/ok', areaRole: '\t\r\n' },
      ];

      for (const tc of testCases) {
        const result = validateLeadForm(tc);
        expect(result.isValid).toBe(false);
      }
    });

    it('5.2.2 strictly rejects names shorter than 3 non-whitespace characters', () => {
      const invalidNames = ['', 'a', 'ab', '  a  ', '  ab  ', ' 1 ', '..'];
      for (const name of invalidNames) {
        const result = validateLeadForm({
          name,
          link: 'https://linkedin.com/in/valid',
          areaRole: 'Developer',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeDefined();
      }

      const validNames = ['Ana', 'Leo', '  Bob  ', 'Edu', 'José da Silva'];
      for (const name of validNames) {
        const result = validateLeadForm({
          name,
          link: 'https://linkedin.com/in/valid',
          areaRole: 'Developer',
        });
        expect(result.isValid).toBe(true);
        expect(result.errors.name).toBeUndefined();
      }
    });

    it('5.2.3 strictly rejects areaRole shorter than 2 non-whitespace characters', () => {
      const invalidRoles = ['', 'x', '  x  ', ' 1 ', ' '];
      for (const areaRole of invalidRoles) {
        const result = validateLeadForm({
          name: 'João Silva',
          link: 'https://linkedin.com/in/valid',
          areaRole,
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.areaRole).toBeDefined();
      }

      const validRoles = ['QA', 'UX', 'AI', '  Dev  ', 'Engenheiro de Software'];
      for (const areaRole of validRoles) {
        const result = validateLeadForm({
          name: 'João Silva',
          link: 'https://linkedin.com/in/valid',
          areaRole,
        });
        expect(result.isValid).toBe(true);
        expect(result.errors.areaRole).toBeUndefined();
      }
    });

    it('5.2.4 rejects malformed URLs lacking domain or with invalid protocols', () => {
      const invalidUrls = [
        'plainword',
        'just_a_string',
        'http://',
        'https://',
        'https:///',
        'ftp://files.example.com',
        'file:///C:/Users/cv.pdf',
        'tel:+5511999999999',
        'data:text/html,<script>alert(1)</script>',
        'javascript:alert(1)',
        'https://linkedin .com/in/space',
        'https://linkedin.com/in/with spaces',
        'https://linkedin.com\n/in/newline',
      ];

      for (const url of invalidUrls) {
        expect(isValidUrl(url), `Expected "${url}" to be rejected`).toBe(false);
        const res = validateLeadForm({
          name: 'Valter Silva',
          link: url,
          areaRole: 'Backend',
        });
        expect(res.isValid).toBe(false);
        expect(res.errors.link).toBeDefined();
      }
    });

    it('5.2.5 accepts and normalizes missing protocol URLs with valid hostnames', () => {
      const urlsNeedingProtocol = [
        'linkedin.com/in/mariana-souza',
        'www.linkedin.com/in/mariana-souza',
        'br.linkedin.com/in/dev',
        'drive.google.com/file/d/12345/view',
        'github.com/candidato/curriculo',
        'onedrive.live.com/view?id=abc',
        'dropbox.com/s/12345/cv.pdf',
      ];

      for (const url of urlsNeedingProtocol) {
        expect(isValidUrl(url), `Expected "${url}" to be valid`).toBe(true);
        const normalized = normalizeUrl(url);
        expect(normalized.startsWith('https://')).toBe(true);

        const res = validateLeadForm({
          name: 'Mariana Souza',
          link: url,
          areaRole: 'Frontend',
        });
        expect(res.isValid).toBe(true);
        expect(res.errors.link).toBeUndefined();
      }
    });

    it('5.2.6 safely neutralizes XSS and HTML injection attempts without code execution or crashing', () => {
      const maliciousPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg/onload=alert(1)>',
        "javascript:alert('pwned')",
        "'; DROP TABLE Leads; --",
        '${7*7}',
        '{{7*7}}',
        '__proto__.polluted = true',
      ];

      for (const payload of maliciousPayloads) {
        // Validation must not crash
        expect(() => {
          validateLeadForm({
            name: payload,
            link: `https://linkedin.com/in/${encodeURIComponent(payload)}`,
            areaRole: payload,
          });
        }).not.toThrow();

        // Building WhatsApp URL must not crash and must encode tags
        const url = buildWhatsAppUrl(payload, payload);
        expect(url).not.toContain('<script>');
        expect(url).not.toContain('<img');
        if (payload.includes('<')) {
          expect(url).toContain('%3C'); // < escaped
        }
        if (payload.includes('>')) {
          expect(url).toContain('%3E'); // > escaped
        }

        // URL object parsing must succeed
        const parsed = new URL(url);
        expect(parsed.searchParams.get('text')).toContain(payload);
      }
    });

    it('5.2.7 verifies hardened edge-case boundary behavior on email, dot-only hostnames, and phone fallback', () => {
      // 1. Email input: normalizeUrl prefixes https:// to candidate@example.com,
      // which WHATWG parses with username "candidate", safely rejected by isValidUrl
      const emailAsUrl = 'candidate@example.com';
      expect(normalizeUrl(emailAsUrl)).toBe('https://candidate@example.com');
      expect(isValidUrl(emailAsUrl)).toBe(false);

      // 2. Dot-only input: "https://." has invalid hostname labels, safely rejected by isValidUrl
      const dotUrl = 'https://.';
      expect(isValidUrl(dotUrl)).toBe(false);

      // 3. Non-digit phone parameter in buildWhatsAppUrl defaults safely to target phone:
      const badPhoneUrl = buildWhatsAppUrl('João', 'Dev', 'abc');
      expect(badPhoneUrl.startsWith(`https://wa.me/${getWhatsAppTargetPhone()}?text=`)).toBe(true);
    });
  });

  // =========================================================================
  // 3. E2E UI Submissions with Adversarial Inputs
  // =========================================================================
  describe('5.3 Landing Page Form Adversarial Submissions & State Integrity', () => {
    it('5.3.1 prevents submission and shows inline errors when submitting malicious or malformed links', async () => {
      render(React.createElement(MemoryRouter, null, React.createElement(LandingPage)));

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      const roleInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      // Malicious link attempting javascript pseudo-protocol
      fireEvent.change(nameInput, { target: { value: 'Eduardo Hacker' } });
      fireEvent.change(linkInput, { target: { value: 'javascript:alert(1)' } });
      fireEvent.change(roleInput, { target: { value: 'Security Researcher' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Insira um link válido/i)).toBeInTheDocument();
      });

      // Confirm no lead was persisted with invalid URL
      const repo = getStorageRepository();
      const leads = await repo.getAll();
      expect(leads.find((l) => l.name === 'Eduardo Hacker')).toBeUndefined();
    });

    it('5.3.2 accepts candidate with accents and special characters and renders direct WhatsApp fallback', async () => {
      render(React.createElement(MemoryRouter, null, React.createElement(LandingPage)));

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      const roleInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      const testName = 'Lúcia d\'Ávila & Conceição';
      const testLink = 'linkedin.com/in/luciaconceicao';
      const testRole = 'C++ & C# Tech Lead (DevOps + Cloud)';

      fireEvent.change(nameInput, { target: { value: testName } });
      fireEvent.change(linkInput, { target: { value: testLink } });
      fireEvent.change(roleInput, { target: { value: testRole } });
      fireEvent.click(submitBtn);

      await waitFor(async () => {
        // Confirmation banner rendered
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
        const fallbackLink = screen.getByRole('link', { name: /Abrir Conversa no WhatsApp/i });
        expect(fallbackLink).toBeInTheDocument();

        const href = fallbackLink.getAttribute('href');
        expect(href).not.toBeNull();
        expect(href).toContain('https://wa.me/');
        expect(href).toContain('%26'); // &
        expect(href).toContain('%2B'); // +
        expect(href).toContain('%C3%BA'); // ú
        expect(href).toContain('%C3%81'); // Á
        expect(href).toContain('%C3%A3'); // ã
        expect(href).toContain('%C3%A7'); // ç

        // Verify lead was stored with normalized link
        const repo = getStorageRepository();
        const leads = await repo.getAll();
        const savedLead = leads.find((l) => l.name === testName);
        expect(savedLead).toBeDefined();
        expect(savedLead?.link).toBe('https://linkedin.com/in/luciaconceicao');
        expect(savedLead?.areaRole).toBe(testRole);
      });
    });
  });
});
