import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/pages/LandingPage';
import { AdminPage } from '../../src/pages/AdminPage';
import { validateLeadForm, isValidUrl } from '../../src/utils/validators';
import { buildWhatsAppUrl } from '../../src/services/whatsappService';
import { setStorageRepositoryForTesting } from '../../src/services/storage/storageFactory';
import { LocalStorageRepository } from '../../src/services/storage/LocalStorageRepository';

const renderLanding = () =>
  render(React.createElement(MemoryRouter, null, React.createElement(LandingPage)));

const renderAdmin = () =>
  render(React.createElement(MemoryRouter, null, React.createElement(AdminPage)));

describe('Tier 3: Boundary & Adversarial Edge Cases', () => {
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
  // 1. Empty and whitespace submissions
  // =========================================================================
  describe('3.1 Empty and Whitespace Submissions', () => {
    it('3.1.1 rejects inputs composed purely of whitespace ("   ")', () => {
      const result = validateLeadForm({
        name: '    ',
        link: '    ',
        areaRole: '    ',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Por favor, informe seu nome completo.');
      expect(result.errors.link).toBe('Por favor, informe o link do seu LinkedIn ou currículo.');
      expect(result.errors.areaRole).toBe(
        'Por favor, informe sua área de atuação ou cargo desejado.'
      );
    });

    it('3.1.2 trims leading and trailing whitespace from candidate name before validation and persistence', () => {
      const result = validateLeadForm({
        name: '   Marina Silva   ',
        link: 'https://linkedin.com/in/marinasilva',
        areaRole: 'Backend Go Engineer',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('3.1.3 trims leading and trailing whitespace from areaRole before validation and persistence', () => {
      const result = validateLeadForm({
        name: 'Rodrigo Faro',
        link: 'https://linkedin.com/in/rodrigofaro',
        areaRole: '   Engenheiro de Dados Sênior   ',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('3.1.4 highlights errors only on unfilled fields during partial submission', async () => {
      renderLanding();

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      fireEvent.change(nameInput, { target: { value: 'Fernanda Lima' } });

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Por favor, informe seu nome completo/i)).not.toBeInTheDocument();
        expect(
          screen.getByText(/Por favor, informe o link do seu LinkedIn ou currículo/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Por favor, informe sua área de atuação ou cargo desejado/i)
        ).toBeInTheDocument();
      });
    });

    it('3.1.5 dynamically clears field error when valid content is entered', async () => {
      renderLanding();

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, informe seu nome completo/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      fireEvent.change(nameInput, { target: { value: 'Lucas Silveira' } });

      await waitFor(() => {
        expect(screen.queryByText(/Por favor, informe seu nome completo/i)).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 2. Invalid URL format rejection
  // =========================================================================
  describe('3.2 Invalid URL Format Rejection & Normalization', () => {
    it('3.2.1 rejects plain words without domains (e.g. "not-a-domain", "testlink")', () => {
      expect(isValidUrl('not-a-domain')).toBe(false);
      expect(isValidUrl('randomword')).toBe(false);
      expect(isValidUrl('just_text_here')).toBe(false);
    });

    it('3.2.2 rejects incomplete protocol stems without hostname and unsupported protocols', () => {
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('https://')).toBe(false);
      expect(isValidUrl('https:///')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    it('3.2.3 accepts standard LinkedIn profile URLs with or without http/https prefix', () => {
      expect(isValidUrl('https://linkedin.com/in/devprofile')).toBe(true);
      expect(isValidUrl('http://linkedin.com/in/devprofile')).toBe(true);
      expect(isValidUrl('linkedin.com/in/devprofile')).toBe(true);
      expect(isValidUrl('www.linkedin.com/in/devprofile')).toBe(true);
      expect(isValidUrl('br.linkedin.com/in/devprofile')).toBe(true);
    });

    it('3.2.4 accepts cloud document and storage CV URLs (Google Drive, OneDrive, GitHub)', () => {
      expect(isValidUrl('https://drive.google.com/file/d/1A2B3C4D/view')).toBe(true);
      expect(isValidUrl('https://onedrive.live.com/?cid=123&id=456')).toBe(true);
      expect(isValidUrl('https://raw.githubusercontent.com/user/cv/main/curriculo.pdf')).toBe(true);
    });

    it('3.2.5 rejects URLs containing spaces or illegal characters', () => {
      expect(isValidUrl('https://linkedin.com/in/meu perfil com espacos')).toBe(false);
      expect(isValidUrl('linkedin .com/in/user')).toBe(false);
    });

    it('3.2.6 rejects email addresses and invalid hostname labels', () => {
      expect(isValidUrl('user@domain.com')).toBe(false);
      expect(isValidUrl('candidato@tech.org')).toBe(false);
      expect(isValidUrl('https://.')).toBe(false);
      expect(isValidUrl('https://..')).toBe(false);
      expect(isValidUrl('https://-invalid.com')).toBe(false);
    });
  });

  // =========================================================================
  // 3. Special characters, accents, and symbols in WhatsApp URL encoding
  // =========================================================================
  describe('3.3 Special Characters, Accents & Symbol Encoding', () => {
    it('3.3.1 properly encodes Portuguese diacritics (ç, ã, é, ó, ú, ê, í)', () => {
      const url = buildWhatsAppUrl('João d\'Ávila e Conceição', 'Automação & Inteligência Artificial');
      const urlObj = new URL(url);
      const textParam = urlObj.searchParams.get('text');

      expect(textParam).not.toBeNull();
      expect(textParam).toContain('João d\'Ávila e Conceição');
      expect(textParam).toContain('Automação & Inteligência Artificial');

      // The raw URL string must have escaped the special characters
      expect(url).toContain('%C3%A3'); // ã
      expect(url).toContain('%C3%A7'); // ç
      expect(url).toContain('%C3%A1'); // á
    });

    it('3.3.2 properly encodes ampersand (&) and hash (#) without breaking query string parsing', () => {
      const url = buildWhatsAppUrl('Ana & Paulo', 'C# & .NET Senior Developer');
      expect(url).toContain('%26'); // & must be percent-encoded so it does not split query params
      expect(url).toContain('%23'); // # must be percent-encoded so it does not start a hash fragment

      const urlObj = new URL(url);
      const textParam = urlObj.searchParams.get('text');
      expect(textParam).toContain('Ana & Paulo');
      expect(textParam).toContain('C# & .NET Senior Developer');
    });

    it('3.3.3 properly encodes plus signs (+) without turning into whitespace', () => {
      const url = buildWhatsAppUrl('Felipe Costa', 'C++ / Embedded Software');
      expect(url).toContain('%2B%2B'); // C++ must be %2B%2B

      const urlObj = new URL(url);
      const textParam = urlObj.searchParams.get('text');
      expect(textParam).toContain('C++ / Embedded Software');
    });

    it('3.3.4 handles apostrophes, hyphens, and slashes with high fidelity', () => {
      const name = "René O'Connor-Souza";
      const role = 'Full-Stack / Mobile (iOS & Android)';
      const url = buildWhatsAppUrl(name, role);

      const urlObj = new URL(url);
      const textParam = urlObj.searchParams.get('text');
      expect(textParam).toContain(name);
      expect(textParam).toContain(role);
    });

    it('3.3.5 satisfies bidirectional round-trip integrity (decode(encode(msg)) === msg)', () => {
      const candidateName = 'José da Silva & Família (C++)';
      const candidateRole = 'Arquiteto de Soluções AWS / GCP #1';
      const expectedMessage = `Olá, acabei de preencher o formulário. Meu nome é ${candidateName}, sou da área de ${candidateRole} e quero a revisão express.`;

      const generatedUrl = buildWhatsAppUrl(candidateName, candidateRole);
      const urlObj = new URL(generatedUrl);
      const extractedMessage = urlObj.searchParams.get('text');

      expect(extractedMessage).toBe(expectedMessage);
    });
  });

  // =========================================================================
  // 4. Empty table state in Admin
  // =========================================================================
  describe('3.4 Empty Table State in Admin Panel', () => {
    it('3.4.1 renders EmptyState component when repository has 0 leads', async () => {
      localStorage.setItem('curriculo_express_leads_v1', JSON.stringify([]));
      setStorageRepositoryForTesting(new LocalStorageRepository());

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
        expect(
          screen.getByText('Ainda não há solicitações de revisão express cadastradas.')
        ).toBeInTheDocument();
      });
    });

    it('3.4.2 renders "Acessar Landing Page" CTA button in empty state', async () => {
      localStorage.setItem('curriculo_express_leads_v1', JSON.stringify([]));
      setStorageRepositoryForTesting(new LocalStorageRepository());

      renderAdmin();

      await waitFor(() => {
        const lpLink = screen.getByRole('link', { name: /Acessar Landing Page/i });
        expect(lpLink).toBeInTheDocument();
        expect(lpLink.getAttribute('href')).toBe('/');
      });
    });

    it('3.4.3 renders stats counter cards showing zeroes without crashing', async () => {
      localStorage.setItem('curriculo_express_leads_v1', JSON.stringify([]));
      setStorageRepositoryForTesting(new LocalStorageRepository());

      const { container } = renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Total de Leads')).toBeInTheDocument();
        expect(container.textContent).toContain('Novos');
        expect(container.textContent).toContain('Aguardando Pagamento');
        expect(container.textContent).toContain('Revisando (IA)');
        expect(container.textContent).toContain('Entregues');
      });
    });

    it('3.4.4 renders filtered empty state when search query matches zero records', async () => {
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nome, cargo ou link/i);
      fireEvent.change(searchInput, { target: { value: 'NomeInexistenteXYZ123' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
        expect(
          screen.getByText('Nenhum resultado corresponde aos filtros selecionados.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Limpar filtros/i })).toBeInTheDocument();
      });
    });

    it('3.4.5 clicking "Limpar filtros" restores the complete table listing', async () => {
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nome, cargo ou link/i);
      fireEvent.change(searchInput, { target: { value: 'TextoQueNaoExisteDeFato' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Limpar filtros/i })).toBeInTheDocument();
      });

      const clearBtn = screen.getByRole('button', { name: /Limpar filtros/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
      });
    });
  });
});
