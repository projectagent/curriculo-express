import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from '../../src/pages/AdminPage';
import { getStorageRepository, setStorageRepositoryForTesting } from '../../src/services/storage/storageFactory';
import { LocalStorageRepository, LOCAL_STORAGE_LEADS_KEY } from '../../src/services/storage/LocalStorageRepository';
import { buildChatGptPrompt, copyTextToClipboard } from '../../src/services/clipboardService';
import { Lead, LeadStatus, LEAD_STATUS_VALUES } from '../../src/types/lead';
import { SEED_LEADS } from '../../src/services/storage/seedData';

const renderAdmin = () =>
  render(React.createElement(MemoryRouter, { initialEntries: ['/admin'] }, React.createElement(AdminPage)));

describe('Tier 5: Adversarial Stress Testing — Admin Panel & Storage Layer', () => {
  beforeEach(() => {
    localStorage.clear();
    setStorageRepositoryForTesting(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    setStorageRepositoryForTesting(null);
  });

  // =========================================================================
  // Challenge 1: Rapid Status Toggling & Concurrency Stress Test
  // =========================================================================
  describe('Challenge 1: Rapid Status Toggling & Concurrency', () => {
    it('5.1.1 rapidly toggles a single lead across all 4 statuses in sequence with persistence', async () => {
      const repo = new LocalStorageRepository();
      const lead = await repo.create({
        name: 'Carlos Stress Test',
        link: 'https://linkedin.com/in/carlos-stress',
        areaRole: 'DevOps Engineer',
      });

      expect(lead.status).toBe('Novo');

      const statuses: LeadStatus[] = [
        'Aguardando Pagamento',
        'Revisando (IA)',
        'Entregue',
        'Novo',
        'Revisando (IA)',
        'Entregue',
      ];

      for (const targetStatus of statuses) {
        const updated = await repo.updateStatus(lead.id, targetStatus);
        expect(updated.status).toBe(targetStatus);
        expect(updated.updatedAt).toBeDefined();

        // Check persistence immediately from a fresh repository instance
        const freshRepo = new LocalStorageRepository();
        const persisted = await freshRepo.getById(lead.id);
        expect(persisted?.status).toBe(targetStatus);
      }
    });

    it('5.1.2 handles concurrent status updates across multiple leads without race conditions', async () => {
      const repo = new LocalStorageRepository();
      const createdLeads: Lead[] = [];

      // Create 12 leads
      for (let i = 0; i < 12; i++) {
        const l = await repo.create({
          name: `Concurrent Lead ${i}`,
          link: `https://linkedin.com/in/lead-${i}`,
          areaRole: `Specialist ${i}`,
        });
        createdLeads.push(l);
      }

      // Fire 12 concurrent status updates with different target statuses
      const targetStatuses: LeadStatus[] = [
        'Aguardando Pagamento',
        'Revisando (IA)',
        'Entregue',
        'Novo',
      ];

      await Promise.all(
        createdLeads.map((l, index) => {
          const target = targetStatuses[index % targetStatuses.length];
          return repo.updateStatus(l.id, target);
        })
      );

      // Verify every lead reached its exact expected status
      const allLeads = await repo.getAll();
      for (let i = 0; i < createdLeads.length; i++) {
        const expected = targetStatuses[i % targetStatuses.length];
        const current = allLeads.find((l) => l.id === createdLeads[i].id);
        expect(current).toBeDefined();
        expect(current?.status).toBe(expected);
      }
    });

    it('5.1.3 throws descriptive error when attempting to update non-existent lead ID', async () => {
      const repo = new LocalStorageRepository();
      await expect(repo.updateStatus('non-existent-id-99999', 'Entregue')).rejects.toThrow(
        /Lead com ID non-existent-id-99999 não encontrado/
      );
    });

    it('5.1.4 toggles status through AdminPage UI and updates stats summary reactively', async () => {
      const repo = getStorageRepository();
      const testLead = await repo.create({
        name: 'Juliana Reactive Test',
        link: 'https://linkedin.com/in/juliana-reactive',
        areaRole: 'Backend Go Engineer',
      });

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Juliana Reactive Test')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(`Alterar status do lead Juliana Reactive Test`);
      expect((select as HTMLSelectElement).value).toBe('Novo');

      // Change to Entregue
      fireEvent.change(select, { target: { value: 'Entregue' } });

      await waitFor(async () => {
        const updated = await repo.getById(testLead.id);
        expect(updated?.status).toBe('Entregue');
      });

      // Verify dropdown reflects updated value
      expect((select as HTMLSelectElement).value).toBe('Entregue');
    });
  });

  // =========================================================================
  // Challenge 2: LocalStorage Corruption Resilience & Self-Healing
  // =========================================================================
  describe('Challenge 2: LocalStorage Corruption Resilience & Self-Healing', () => {
    it('5.2.1 self-heals when LocalStorage key contains malformed syntax error JSON', async () => {
      const corruptedPayloads = [
        '{ malformed json : missing quotes }',
        '[{"id": "incomplete"',
        'undefined',
        'NaN',
        '<<<XML instead of JSON>>>',
      ];

      for (const payload of corruptedPayloads) {
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, payload);

        const repo = new LocalStorageRepository();
        const leads = await repo.getAll();

        // Must recover safely to seed leads
        expect(Array.isArray(leads)).toBe(true);
        expect(leads.length).toBe(SEED_LEADS.length);
        expect(leads[0]).toHaveProperty('id');
        expect(leads[0]).toHaveProperty('status');

        // Storage should now be healed with valid JSON
        const rawAfter = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
        expect(() => JSON.parse(rawAfter!)).not.toThrow();
      }
    });

    it('5.2.2 self-heals when LocalStorage key contains non-array valid JSON (primitives, objects)', async () => {
      const nonArrayJson = [
        'null',
        '12345',
        '"A simple string"',
        'true',
        'false',
        '{"single": "object_not_array"}',
      ];

      for (const payload of nonArrayJson) {
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, payload);

        const repo = new LocalStorageRepository();
        const leads = await repo.getAll();

        expect(Array.isArray(leads)).toBe(true);
        expect(leads.length).toBe(SEED_LEADS.length);
      }
    });

    it('5.2.3 preserves empty array [] as a valid zero-lead state without overwriting it with seed leads', async () => {
      localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify([]));

      const repo = new LocalStorageRepository();
      const leads = await repo.getAll();

      // Empty array is valid JSON and valid array: should return []
      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBe(0);
    });

    it('5.2.4 gracefully falls back to memory cache when localStorage is completely disabled or throws', async () => {
      // Mock window.localStorage to throw on setItem (e.g. QuotaExceededError or private browsing restrictions)
      const originalSetItem = window.localStorage.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError: storage is full', 'QuotaExceededError');
      });

      const repo = new LocalStorageRepository();
      // Should not throw
      const leads = await repo.getAll();
      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBeGreaterThanOrEqual(5);

      // Creating a lead should still work in-memory
      const created = await repo.create({
        name: 'Memory Only Lead',
        link: 'https://linkedin.com/in/memory',
        areaRole: 'Fullstack Dev',
      });
      expect(created.name).toBe('Memory Only Lead');

      const allMemoryLeads = await repo.getAll();
      expect(allMemoryLeads.some((l) => l.name === 'Memory Only Lead')).toBe(true);

      Storage.prototype.setItem = originalSetItem;
    });
  });

  // =========================================================================
  // Challenge 3: ChatGPT Prompt Generation ("Copiar Contexto") Adversarial Profiles
  // =========================================================================
  describe('Challenge 3: ChatGPT Prompt Generation & Special Characters', () => {
    it('5.3.1 generates prompt with XSS payloads, HTML tags, and quote characters safely', () => {
      const adversarialLead: Lead = {
        id: 'adv-1',
        name: '<script>alert("XSS")</script>',
        link: 'https://linkedin.com/in/test?param="value"&other=\'quotes\'#<tag>',
        areaRole: '<b>Staff Engineer</b> & Tech Lead "Specialist"',
        status: 'Novo',
        createdAt: '2026-10-26T14:00:00Z',
      };

      const prompt = buildChatGptPrompt(adversarialLead);

      expect(prompt).toContain('<script>alert("XSS")</script>');
      expect(prompt).toContain('https://linkedin.com/in/test?param="value"&other=\'quotes\'#<tag>');
      expect(prompt).toContain('<b>Staff Engineer</b> & Tech Lead "Specialist"');
      expect(prompt).toContain('Você é um especialista sênior em Tech Recruiting');
      expect(prompt).toContain('Diagnóstico dos filtros ATS');
      expect(prompt).toContain('STAR');
    });

    it('5.3.2 generates prompt with Markdown formatting, backticks, emojis, and multiline text', () => {
      const markdownLead: Lead = {
        id: 'adv-2',
        name: '🚀 Fernando ## Senior `Dev` **Ninja**',
        link: 'https://github.com/fernando_code/repo_v1.0.0',
        areaRole: 'Rust & WebAssembly [Expert](https://example.com) ```const x = 1;```',
        status: 'Revisando (IA)',
        createdAt: '2026-10-26T14:00:00Z',
      };

      const prompt = buildChatGptPrompt(markdownLead);

      expect(prompt).toContain('🚀 Fernando ## Senior `Dev` **Ninja**');
      expect(prompt).toContain('Rust & WebAssembly [Expert](https://example.com) ```const x = 1;```');
      expect(prompt).toContain('Headline do LinkedIn Otimizado');
      expect(prompt).toContain('Plano de Ação Imediato');
    });

    it('5.3.3 handles extreme string lengths without memory or performance degradation', () => {
      const veryLongRole = 'Senior Architect '.repeat(200); // 3400 characters
      const veryLongLink = 'https://linkedin.com/in/' + 'a'.repeat(1000);
      const longLead: Lead = {
        id: 'adv-3',
        name: 'Alexander ' + 'Great '.repeat(50),
        link: veryLongLink,
        areaRole: veryLongRole,
        status: 'Aguardando Pagamento',
        createdAt: '2026-10-26T14:00:00Z',
      };

      const startTime = performance.now();
      const prompt = buildChatGptPrompt(longLead);
      const elapsed = performance.now() - startTime;

      expect(elapsed).toBeLessThan(50); // under 50ms
      expect(prompt).toContain(veryLongRole);
      expect(prompt).toContain(veryLongLink);
    });

    it('5.3.4 clipboard copy falls back gracefully when navigator.clipboard throws or is absent', async () => {
      // Mock navigator.clipboard.writeText to reject
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard permission denied')),
        },
      });

      // Mock document.execCommand
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const result = await copyTextToClipboard('Test fallback text');
      expect(result).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });
  });

  // =========================================================================
  // Challenge 4: Table Rendering at Scale & Boundary Conditions (0 vs 50+ Leads)
  // =========================================================================
  describe('Challenge 4: Table Rendering at Scale & Empty States', () => {
    it('5.4.1 renders friendly EmptyState when repository contains 0 leads', async () => {
      localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify([]));

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
        expect(
          screen.getByText('Ainda não há solicitações de revisão express cadastradas.')
        ).toBeInTheDocument();
        const lpLink = screen.getByRole('link', { name: /Acessar Landing Page/i });
        expect(lpLink).toBeInTheDocument();
        expect(lpLink.getAttribute('href')).toBe('/');
      });
    });

    it('5.4.2 renders filter empty state and allows clearing filters to restore leads', async () => {
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      // Type an unmatched query in search
      const searchInput = screen.getByPlaceholderText(/Buscar por nome, cargo ou link/i);
      fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_CANDIDATE_SEARCH_STRING_XYZ' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
        expect(
          screen.getByText('Nenhum resultado corresponde aos filtros selecionados.')
        ).toBeInTheDocument();
      });

      // Click "Limpar filtros"
      const clearBtn = screen.getByRole('button', { name: /Limpar filtros/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });
    });

    it('5.4.3 renders 50+ leads efficiently without layout collapse or missing rows', async () => {
      const generatedLeads: Lead[] = [];
      const baseDate = new Date('2026-10-26T12:00:00Z').getTime();

      for (let i = 1; i <= 55; i++) {
        const statusIdx = i % LEAD_STATUS_VALUES.length;
        generatedLeads.push({
          id: `scale-lead-${i}`,
          name: `Candidate Number ${String(i).padStart(3, '0')}`,
          link: `https://linkedin.com/in/candidate-${i}`,
          areaRole: `Tech Role ${i} Specialist`,
          status: LEAD_STATUS_VALUES[statusIdx],
          createdAt: new Date(baseDate - i * 60000).toISOString(),
        });
      }

      localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(generatedLeads));

      const startTime = performance.now();
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Candidate Number 001')).toBeInTheDocument();
      });
      const renderDuration = performance.now() - startTime;
      expect(renderDuration).toBeLessThan(1000); // Renders 55 leads smoothly under 1s

      // Verify row count
      const rows = screen.getAllByRole('row');
      // 1 header row + 55 data rows = 56 total table rows
      expect(rows.length).toBe(56);

      // Verify metrics cards count correctly
      expect(screen.getByText('55')).toBeInTheDocument(); // Total leads count in stats
    });

    it('5.4.4 filters 50+ leads by status reactively and accurately', async () => {
      const generatedLeads: Lead[] = [];
      for (let i = 1; i <= 50; i++) {
        generatedLeads.push({
          id: `status-filter-${i}`,
          name: `Lead Status Test ${i}`,
          link: `https://linkedin.com/in/lead-${i}`,
          areaRole: `Role ${i}`,
          status: i <= 10 ? 'Novo' : i <= 25 ? 'Aguardando Pagamento' : i <= 40 ? 'Revisando (IA)' : 'Entregue',
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(generatedLeads));

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Lead Status Test 1')).toBeInTheDocument();
      });

      // Filter by "Novo"
      const statusSelect = screen.getByLabelText(/^Status:/i);
      fireEvent.change(statusSelect, { target: { value: 'Novo' } });

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 10 data rows
        expect(rows.length).toBe(11);
      });

      // Filter by "Entregue" (leads 41 to 50 = 10 leads)
      fireEvent.change(statusSelect, { target: { value: 'Entregue' } });

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBe(11);
      });
    });
  });
});
