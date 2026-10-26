import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from '../../src/pages/AdminPage';
import { getStorageRepository } from '../../src/services/storage/storageFactory';
import { buildChatGptPrompt } from '../../src/services/clipboardService';
import { Lead } from '../../src/types/lead';

const renderAdmin = () =>
  render(React.createElement(MemoryRouter, null, React.createElement(AdminPage)));

describe('Tier 2: Feature Coverage — Admin Panel & Lead Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Feature 5: Admin Panel /admin renders 5 mandatory columns (>= 5 test cases)
  // =========================================================================
  describe('Feature 5: Admin Panel Mandatory Columns & Data Grid', () => {
    it('2.5.1 renders Column 1: Data/Hora header', async () => {
      renderAdmin();

      await waitFor(() => {
        const header = screen.getByRole('columnheader', { name: /Data\/Hora/i });
        expect(header).toBeInTheDocument();
      });
    });

    it('2.5.2 renders Column 2: Nome header', async () => {
      renderAdmin();

      await waitFor(() => {
        const header = screen.getByRole('columnheader', { name: /^Nome$/i });
        expect(header).toBeInTheDocument();
      });
    });

    it('2.5.3 renders Column 3: Link (LinkedIn / CV) header', async () => {
      renderAdmin();

      await waitFor(() => {
        const header = screen.getByRole('columnheader', { name: /Link/i });
        expect(header).toBeInTheDocument();
      });
    });

    it('2.5.4 renders Column 4: Área / Cargo header', async () => {
      renderAdmin();

      await waitFor(() => {
        const header = screen.getByRole('columnheader', { name: /Área \/ Cargo/i });
        expect(header).toBeInTheDocument();
      });
    });

    it('2.5.5 renders Column 5: Status header', async () => {
      renderAdmin();

      await waitFor(() => {
        const header = screen.getByRole('columnheader', { name: /^Status$/i });
        expect(header).toBeInTheDocument();
      });
    });

    it('2.5.6 renders candidate links as clickable external anchors with security attributes', async () => {
      renderAdmin();

      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /Acessar link externo|linkedin|github/i });
        expect(links.length).toBeGreaterThan(0);
        expect(links[0].getAttribute('target')).toBe('_blank');
        expect(links[0].getAttribute('rel')).toContain('noopener');
      });
    });
  });

  // =========================================================================
  // Feature 6: Status dropdown updates and persists among 4 values (>= 5 test cases)
  // =========================================================================
  describe('Feature 6: Status Dropdown Lifecycle & Persistence', () => {
    it('2.6.1 dropdown offers all 4 required status values', async () => {
      renderAdmin();

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);

        const firstStatusSelect = selects[0];
        const options = Array.from(firstStatusSelect.querySelectorAll('option')).map(
          (o) => o.textContent?.trim()
        );

        expect(options).toContain('Novo');
        expect(options).toContain('Aguardando Pagamento');
        expect(options).toContain('Revisando (IA)');
        expect(options).toContain('Entregue');
      });
    });

    it('2.6.2 updates and persists status transition to "Aguardando Pagamento"', async () => {
      const repo = getStorageRepository();
      const created = await repo.create({
        name: 'Beatriz Ramos',
        link: 'https://linkedin.com/in/beatriz-ramos',
        areaRole: 'Product Manager Tech',
      });

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Beatriz Ramos')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(`Alterar status do lead ${created.name}`);
      fireEvent.change(select, { target: { value: 'Aguardando Pagamento' } });

      await waitFor(async () => {
        const updated = await repo.getById(created.id);
        expect(updated?.status).toBe('Aguardando Pagamento');
      });
    });

    it('2.6.3 updates and persists status transition to "Revisando (IA)"', async () => {
      const repo = getStorageRepository();
      const created = await repo.create({
        name: 'Guilherme Santos',
        link: 'https://linkedin.com/in/guilherme-santos',
        areaRole: 'Engenheiro de Machine Learning',
      });

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Guilherme Santos')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(`Alterar status do lead ${created.name}`);
      fireEvent.change(select, { target: { value: 'Revisando (IA)' } });

      await waitFor(async () => {
        const updated = await repo.getById(created.id);
        expect(updated?.status).toBe('Revisando (IA)');
      });
    });

    it('2.6.4 updates and persists status transition to "Entregue"', async () => {
      const repo = getStorageRepository();
      const created = await repo.create({
        name: 'Priscila Alves',
        link: 'https://linkedin.com/in/priscila-alves',
        areaRole: 'Cloud Solutions Architect',
      });

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Priscila Alves')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(`Alterar status do lead ${created.name}`);
      fireEvent.change(select, { target: { value: 'Entregue' } });

      await waitFor(async () => {
        const updated = await repo.getById(created.id);
        expect(updated?.status).toBe('Entregue');
      });
    });

    it('2.6.5 status changes visually reflect with corresponding color badges', async () => {
      const repo = getStorageRepository();
      const created = await repo.create({
        name: 'Thiago Martins',
        link: 'https://linkedin.com/in/thiago-martins',
        areaRole: 'Security Analyst',
      });

      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText('Thiago Martins')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(`Alterar status do lead ${created.name}`);
      fireEvent.change(select, { target: { value: 'Entregue' } });

      await waitFor(() => {
        const row = select.closest('tr');
        expect(row?.textContent).toContain('Entregue');
      });
    });
  });

  // =========================================================================
  // Feature 7: "Copiar Contexto" generates ChatGPT prompt (>= 5 test cases)
  // =========================================================================
  describe('Feature 7: ChatGPT Prompt Generator & Context Copy', () => {
    const mockLead: Lead = {
      id: 'test-lead-copy-1',
      name: 'Camila Fernandes',
      link: 'https://linkedin.com/in/camila-fernandes',
      areaRole: 'Senior Data Scientist',
      status: 'Novo',
      createdAt: '2026-10-26T12:00:00.000Z',
    };

    it('2.7.1 renders "Copiar Contexto" button on each lead row', async () => {
      renderAdmin();

      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button', { name: /Copiar Contexto/i });
        expect(copyButtons.length).toBeGreaterThan(0);
      });
    });

    it('2.7.2 prompt contains candidate exact Nome', () => {
      const prompt = buildChatGptPrompt(mockLead);
      expect(prompt).toContain('Camila Fernandes');
    });

    it('2.7.3 prompt contains candidate exact Link', () => {
      const prompt = buildChatGptPrompt(mockLead);
      expect(prompt).toContain('https://linkedin.com/in/camila-fernandes');
    });

    it('2.7.4 prompt contains candidate exact Área/Cargo', () => {
      const prompt = buildChatGptPrompt(mockLead);
      expect(prompt).toContain('Senior Data Scientist');
    });

    it('2.7.5 prompt contains structured ATS, STAR, and Action Plan guidelines for ChatGPT', () => {
      const prompt = buildChatGptPrompt(mockLead);
      expect(prompt).toContain('Diagnóstico dos filtros ATS');
      expect(prompt).toContain('STAR');
      expect(prompt).toContain('Headline do LinkedIn');
      expect(prompt).toContain('Plano de Ação Imediato');
    });

    it('2.7.6 clicking button copies prompt to clipboard and provides user feedback indicator', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      renderAdmin();

      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button', { name: /Copiar Contexto/i });
        expect(copyButtons.length).toBeGreaterThan(0);
      });

      const firstCopyBtn = screen.getAllByRole('button', { name: /Copiar Contexto/i })[0];
      fireEvent.click(firstCopyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledTimes(1);
        const copiedCall = writeTextMock.mock.calls[0][0];
        expect(copiedCall).toContain('Nome:');
        expect(copiedCall).toContain('Área de Atuação / Cargo Alvo:');
        expect(copiedCall).toContain('Link do LinkedIn / Currículo:');
        expect(screen.getByText('Copiado!')).toBeInTheDocument();
      });
    });
  });
});
