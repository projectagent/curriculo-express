import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/pages/LandingPage';
import { AdminPage } from '../../src/pages/AdminPage';
import { getStorageRepository, setStorageRepositoryForTesting } from '../../src/services/storage/storageFactory';
import { LocalStorageRepository } from '../../src/services/storage/LocalStorageRepository';
import { SEED_LEADS } from '../../src/services/storage/seedData';
import { buildChatGptPrompt } from '../../src/services/clipboardService';

const renderLanding = () =>
  render(React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(LandingPage)));

const renderAdmin = () =>
  render(React.createElement(MemoryRouter, { initialEntries: ['/admin'] }, React.createElement(AdminPage)));

describe('Tier 4: Real-World Scenarios & Offline Fallback Resilience', () => {
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
  // Scenario 1: Full End-to-End Lead Lifecycle
  // =========================================================================
  describe('Scenario 1: Complete Lead Lifecycle (LP Submission -> WhatsApp -> Admin -> Progression -> AI Copy)', () => {
    it('4.1 captures candidate form submission, registers lead in repository, and generates WhatsApp URL', async () => {
      renderLanding();

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      const areaInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      // Step 1: Candidate inputs info
      fireEvent.change(nameInput, { target: { value: 'Lucas Cavalcante' } });
      fireEvent.change(linkInput, { target: { value: 'https://linkedin.com/in/lucascavalcante' } });
      fireEvent.change(areaInput, { target: { value: 'Desenvolvedor Frontend React' } });

      // Step 2: Candidate submits
      fireEvent.click(submitBtn);

      // Step 3: Success banner appears with WhatsApp direct URL
      await waitFor(() => {
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
        const waLink = screen.getByRole('link', { name: /Abrir Conversa no WhatsApp/i });
        expect(waLink).toBeInTheDocument();
        const href = waLink.getAttribute('href') || '';
        expect(href).toContain('https://wa.me/');
        expect(href).toContain('Lucas%20Cavalcante');
        expect(href).toContain('Desenvolvedor%20Frontend%20React');
      });

      // Step 4: Verify lead is saved in storage
      const repo = getStorageRepository();
      const allLeads = await repo.getAll();
      const newLead = allLeads.find((l) => l.name === 'Lucas Cavalcante');
      expect(newLead).toBeDefined();
      expect(newLead?.status).toBe('Novo');
      expect(newLead?.areaRole).toBe('Desenvolvedor Frontend React');
    });

    it('4.2 newly created lead is visible in /admin table and progresses through all 4 statuses to completion', async () => {
      // Create lead directly through repo (simulating LP submission)
      const repo = getStorageRepository();
      const createdLead = await repo.create({
        name: 'Roberta Dias',
        link: 'https://linkedin.com/in/robertadias',
        areaRole: 'Product Owner & Scrum Master',
      });

      renderAdmin();

      // Verify row presence
      await waitFor(() => {
        expect(screen.getByText('Roberta Dias')).toBeInTheDocument();
        expect(screen.getByText('Product Owner & Scrum Master')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(`Alterar status do lead Roberta Dias`);
      expect((select as HTMLSelectElement).value).toBe('Novo');

      // Stage 1: Transition to "Aguardando Pagamento"
      fireEvent.change(select, { target: { value: 'Aguardando Pagamento' } });
      await waitFor(async () => {
        const lead = await repo.getById(createdLead.id);
        expect(lead?.status).toBe('Aguardando Pagamento');
      });

      // Stage 2: Transition to "Revisando (IA)"
      fireEvent.change(select, { target: { value: 'Revisando (IA)' } });
      await waitFor(async () => {
        const lead = await repo.getById(createdLead.id);
        expect(lead?.status).toBe('Revisando (IA)');
      });

      // Stage 3: Transition to "Entregue"
      fireEvent.change(select, { target: { value: 'Entregue' } });
      await waitFor(async () => {
        const lead = await repo.getById(createdLead.id);
        expect(lead?.status).toBe('Entregue');
      });
    });

    it('4.3 copies candidate context into ChatGPT prompt format with fidelity', async () => {
      const repo = getStorageRepository();
      const createdLead = await repo.create({
        name: 'Marcelo Viana',
        link: 'https://linkedin.com/in/marcelo-viana',
        areaRole: 'Arquiteto de Software Java & Spring',
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Marcelo Viana')).toBeInTheDocument();
      });

      const row = screen.getByText('Marcelo Viana').closest('tr')!;
      const copyBtn = within(row).getByRole('button', {
        name: /Copiar Contexto/i,
      });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledTimes(1);
        const copiedText = writeTextMock.mock.calls[0][0];
        expect(copiedText).toContain('Marcelo Viana');
        expect(copiedText).toContain('https://linkedin.com/in/marcelo-viana');
        expect(copiedText).toContain('Arquiteto de Software Java & Spring');
        expect(copiedText).toContain('Diagnóstico dos filtros ATS');
      });
    });
  });

  // =========================================================================
  // Scenario 2: LocalStorage Offline Fallback Resilience
  // =========================================================================
  describe('Scenario 2: Zero Environment Variables Offline Resilience', () => {
    it('4.4 initializes in local-storage mode with zero environment variables and no errors', () => {
      const repo = getStorageRepository();
      expect(repo.mode).toBe('local-storage');
    });

    it('4.5 auto-seeds 5 realistic candidate leads when initialized for the first time', async () => {
      const repo = new LocalStorageRepository();
      const leads = await repo.getAll();

      expect(leads.length).toBe(SEED_LEADS.length);
      expect(leads.length).toBeGreaterThanOrEqual(5);

      const names = leads.map((l) => l.name);
      expect(names).toContain('Mariana Souza');
      expect(names).toContain('Lucas Ferreira');
      expect(names).toContain('Beatriz Lima');
      expect(names).toContain('Gabriel Rocha');
      expect(names).toContain('Camila Duarte');
    });

    it('4.6 pre-seeded leads contain representatives of all 4 required status values', async () => {
      const repo = new LocalStorageRepository();
      const leads = await repo.getAll();
      const statuses = new Set(leads.map((l) => l.status));

      expect(statuses.has('Novo')).toBe(true);
      expect(statuses.has('Aguardando Pagamento')).toBe(true);
      expect(statuses.has('Revisando (IA)')).toBe(true);
      expect(statuses.has('Entregue')).toBe(true);
    });

    it('4.7 recovers safely from corrupted JSON in localStorage without throwing uncaught exceptions', async () => {
      // Inject corrupted JSON string into storage
      localStorage.setItem('curriculo_express_leads_v1', 'corrupted-invalid-json-data-{{{');

      const repo = new LocalStorageRepository();
      // Should not throw, should heal by re-initializing seed data
      const leads = await repo.getAll();
      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBeGreaterThanOrEqual(5);
    });

    it('4.8 persists data modifications synchronously across independent repository instances', async () => {
      const repoInstance1 = new LocalStorageRepository();
      const created = await repoInstance1.create({
        name: 'Instância Compartilhada',
        link: 'https://linkedin.com/in/compartilhada',
        areaRole: 'QA Lead',
      });

      const repoInstance2 = new LocalStorageRepository();
      const retrieved = await repoInstance2.getById(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Instância Compartilhada');

      await repoInstance2.updateStatus(created.id, 'Entregue');

      const retrievedFromInstance1 = await repoInstance1.getById(created.id);
      expect(retrievedFromInstance1?.status).toBe('Entregue');
    });
  });
});
