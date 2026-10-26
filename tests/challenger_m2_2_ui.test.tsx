import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../src/pages/AdminPage';
import { ToastContainer } from '../src/components/common/Toast';
import { StatusDropdown } from '../src/components/admin/StatusDropdown';
import { DeleteLeadButton } from '../src/components/admin/DeleteLeadButton';
import { LeadsTable } from '../src/components/admin/LeadsTable';
import { calculateAdminStats, filterAndSortLeads } from '../src/services/leadService';
import api, { normalizeLead, getAll, create, updateStatus, deleteLead } from '../src/services/api';
import { setRepositoryInstanceForTesting, setStorageRepositoryForTesting } from '../src/services/storage/storageFactory';
import { LocalStorageRepository } from '../src/services/storage/LocalStorageRepository';
import { Lead, LeadStatus, LEAD_STATUS_VALUES } from '../src/types/lead';

describe('Challenger 2 Empirical Verification Suite — Milestone 2', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    setStorageRepositoryForTesting(null);
    repo = new LocalStorageRepository();
    setRepositoryInstanceForTesting(repo);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    setStorageRepositoryForTesting(null);
    vi.restoreAllMocks();
  });

  const renderAdminPage = (initialAuth: boolean = true) =>
    render(
      <BrowserRouter>
        <AdminPage initialAuthenticated={initialAuth} />
        <ToastContainer />
      </BrowserRouter>
    );

  // =========================================================================
  // REQUIREMENT 1: Status Updates in Table Dropdown Across All 4 Valid States
  // =========================================================================
  describe('1. Status Updates Across All 4 Valid States', () => {
    const allStatuses: LeadStatus[] = ['Novo', 'Aguardando Pagamento', 'Revisando (IA)', 'Entregue'];

    it('StatusDropdown renders all 4 valid states in options', () => {
      const dummyLeadId = 'lead-123';
      const onStatusChange = vi.fn().mockResolvedValue(true);

      render(
        <StatusDropdown
          currentStatus="Novo"
          leadId={dummyLeadId}
          leadName="Teste Candidato"
          onStatusChange={onStatusChange}
        />
      );

      const select = screen.getByRole('combobox', { name: /Alterar status do lead Teste Candidato/i });
      expect(select).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      const optionValues = options.map((opt) => (opt as HTMLOptionElement).value);
      expect(optionValues).toEqual(LEAD_STATUS_VALUES);
      expect(optionValues).toEqual(allStatuses);
    });

    it('cycles through all 4 status states sequentially via StatusDropdown component', async () => {
      let currentStatus: LeadStatus = 'Novo';
      const onStatusChange = vi.fn().mockImplementation(async (newStatus: LeadStatus) => {
        currentStatus = newStatus;
        return true;
      });

      const { rerender } = render(
        <StatusDropdown
          currentStatus={currentStatus}
          leadId="lead-1"
          leadName="Candidato Ciclo"
          onStatusChange={onStatusChange}
        />
      );

      for (const nextStatus of allStatuses) {
        if (nextStatus === currentStatus) continue;

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: nextStatus } });

        expect(onStatusChange).toHaveBeenCalledWith(nextStatus);
        rerender(
          <StatusDropdown
            currentStatus={nextStatus}
            leadId="lead-1"
            leadName="Candidato Ciclo"
            onStatusChange={onStatusChange}
          />
        );
        expect(screen.getByRole('combobox')).toHaveValue(nextStatus);
      }
    });

    it('updates status in AdminPage UI across all 4 states and persists to repository', async () => {
      renderAdminPage(true);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const marianaDropdown = screen.getByRole('combobox', {
        name: /Alterar status do lead Mariana Souza/i,
      });
      expect(marianaDropdown).toHaveValue('Novo');

      // Test all 4 states in order
      const sequence: LeadStatus[] = ['Aguardando Pagamento', 'Revisando (IA)', 'Entregue', 'Novo'];
      for (const targetState of sequence) {
        fireEvent.change(marianaDropdown, { target: { value: targetState } });

        await waitFor(async () => {
          expect(marianaDropdown).toHaveValue(targetState);
          const all = await repo.getAll();
          const mariana = all.find((l) => l.name === 'Mariana Souza');
          expect(mariana?.status).toBe(targetState);
        });
      }
    });

    it('rolls back status update in AdminPage UI when updateStatus rejects/fails', async () => {
      // Mock repository updateStatus to fail
      vi.spyOn(repo, 'updateStatus').mockRejectedValue(new Error('Network failure or 500 error'));

      renderAdminPage(true);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const dropdown = screen.getByRole('combobox', {
        name: /Alterar status do lead Mariana Souza/i,
      });
      expect(dropdown).toHaveValue('Novo');

      // Attempt to change to 'Entregue'
      fireEvent.change(dropdown, { target: { value: 'Entregue' } });

      // Because repo fails, it should roll back to 'Novo'
      await waitFor(() => {
        expect(dropdown).toHaveValue('Novo');
        expect(
          screen.getByText(/Não foi possível atualizar o status. As alterações foram revertidas./i)
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // REQUIREMENT 2: Lead Deletion with Confirmation Dialog (window.confirm)
  // =========================================================================
  describe('2. Lead Deletion with Confirmation Dialog', () => {
    it('aborts deletion when user clicks Cancel on window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const onDelete = vi.fn().mockResolvedValue(true);

      const sampleLead: Lead = {
        id: 'del-1',
        name: 'Lead Não Excluir',
        link: 'https://linkedin.com/in/safe',
        areaRole: 'Backend',
        status: 'Novo',
        createdAt: new Date().toISOString(),
      };

      render(<DeleteLeadButton lead={sampleLead} onDelete={onDelete} />);

      const deleteBtn = screen.getByRole('button', { name: /Excluir lead Lead Não Excluir/i });
      fireEvent.click(deleteBtn);

      expect(confirmSpy).toHaveBeenCalledWith('Tem certeza que deseja excluir permanentemente este lead?');
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('proceeds with deletion when user clicks OK on window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const onDelete = vi.fn().mockResolvedValue(true);

      const sampleLead: Lead = {
        id: 'del-2',
        name: 'Lead A Excluir',
        link: 'https://linkedin.com/in/del',
        areaRole: 'QA',
        status: 'Novo',
        createdAt: new Date().toISOString(),
      };

      render(<DeleteLeadButton lead={sampleLead} onDelete={onDelete} />);

      const deleteBtn = screen.getByRole('button', { name: /Excluir lead Lead A Excluir/i });
      fireEvent.click(deleteBtn);

      expect(confirmSpy).toHaveBeenCalledWith('Tem certeza que deseja excluir permanentemente este lead?');
      expect(onDelete).toHaveBeenCalledWith('del-2');
    });

    it('rolls back deletion and restores lead in UI if deletion API fails', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(repo, 'delete').mockRejectedValue(new Error('Server error on DELETE'));

      renderAdminPage(true);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const deleteMarianaBtn = screen.getByRole('button', { name: /Excluir lead Mariana Souza/i });
      fireEvent.click(deleteMarianaBtn);

      // Rollback: error toast displayed and Mariana Souza restored to UI
      await waitFor(() => {
        expect(screen.getByText(/Não foi possível excluir o lead./i)).toBeInTheDocument();
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // REQUIREMENT 3: Metrics Calculation and Search/Filtering in LeadsTable
  // =========================================================================
  describe('3. Metrics Calculation & Search/Filtering', () => {
    describe('calculateAdminStats boundary & stress cases', () => {
      it('returns all zeros for empty leads list', () => {
        const stats = calculateAdminStats([]);
        expect(stats).toEqual({
          total: 0,
          novos: 0,
          aguardandoPagamento: 0,
          revisandoIA: 0,
          entregues: 0,
        });
      });

      it('accurately counts exact status distribution across large dataset', () => {
        const sampleLeads: Lead[] = [
          ...Array.from({ length: 15 }, (_, i) => ({
            id: `n-${i}`,
            name: `Novo ${i}`,
            link: 'https://ex.com',
            areaRole: 'Dev',
            status: 'Novo' as LeadStatus,
            createdAt: new Date().toISOString(),
          })),
          ...Array.from({ length: 8 }, (_, i) => ({
            id: `a-${i}`,
            name: `Aguardando ${i}`,
            link: 'https://ex.com',
            areaRole: 'Dev',
            status: 'Aguardando Pagamento' as LeadStatus,
            createdAt: new Date().toISOString(),
          })),
          ...Array.from({ length: 12 }, (_, i) => ({
            id: `r-${i}`,
            name: `Revisando ${i}`,
            link: 'https://ex.com',
            areaRole: 'Dev',
            status: 'Revisando (IA)' as LeadStatus,
            createdAt: new Date().toISOString(),
          })),
          ...Array.from({ length: 25 }, (_, i) => ({
            id: `e-${i}`,
            name: `Entregue ${i}`,
            link: 'https://ex.com',
            areaRole: 'Dev',
            status: 'Entregue' as LeadStatus,
            createdAt: new Date().toISOString(),
          })),
        ];

        const stats = calculateAdminStats(sampleLeads);
        expect(stats.total).toBe(60);
        expect(stats.novos).toBe(15);
        expect(stats.aguardandoPagamento).toBe(8);
        expect(stats.revisandoIA).toBe(12);
        expect(stats.entregues).toBe(25);
      });

      it('safely handles unknown or corrupted statuses without throwing', () => {
        const corrupted: any[] = [
          { id: '1', name: 'Corrupt', link: '', areaRole: '', status: 'UnknownStatus', createdAt: '' },
          { id: '2', name: 'NullStatus', link: '', areaRole: '', status: null, createdAt: '' },
          { id: '3', name: 'Valid', link: '', areaRole: '', status: 'Novo', createdAt: '' },
        ];

        const stats = calculateAdminStats(corrupted);
        expect(stats.total).toBe(3);
        expect(stats.novos).toBe(1);
        expect(stats.aguardandoPagamento).toBe(0);
        expect(stats.revisandoIA).toBe(0);
        expect(stats.entregues).toBe(0);
      });
    });

    describe('filterAndSortLeads search and filtering', () => {
      const mockDataset: Lead[] = [
        {
          id: '1',
          name: 'Ana Cláudia Silva',
          link: 'https://linkedin.com/in/ana-claudia',
          areaRole: 'UX/UI Designer Sênior',
          status: 'Novo',
          createdAt: '2026-10-26T10:00:00.000Z',
        },
        {
          id: '2',
          name: 'Bruno Meireles',
          link: 'https://linkedin.com/in/bruno-m',
          areaRole: 'Desenvolvedor Frontend React',
          status: 'Aguardando Pagamento',
          createdAt: '2026-10-26T12:00:00.000Z',
        },
        {
          id: '3',
          name: 'Carlos Drummond',
          link: 'https://linkedin.com/in/drummond-poeta',
          areaRole: 'Engenheiro de Dados Python',
          status: 'Revisando (IA)',
          createdAt: '2026-10-26T14:00:00.000Z',
        },
        {
          id: '4',
          name: 'Daniela Albuquerque',
          link: 'https://cv-daniela.pdf',
          areaRole: 'Product Manager',
          status: 'Entregue',
          createdAt: '2026-10-26T16:00:00.000Z',
        },
      ];

      it('filters case-insensitively and with trimmed whitespace on name', () => {
        const res = filterAndSortLeads(mockDataset, { searchQuery: '   bRuNo   ' });
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe('Bruno Meireles');
      });

      it('filters on areaRole', () => {
        const res = filterAndSortLeads(mockDataset, { searchQuery: 'frontend' });
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe('Bruno Meireles');
      });

      it('filters on link URL', () => {
        const res = filterAndSortLeads(mockDataset, { searchQuery: 'cv-daniela' });
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe('Daniela Albuquerque');
      });

      it('filters by status correctly', () => {
        const res = filterAndSortLeads(mockDataset, { status: 'Revisando (IA)' });
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe('Carlos Drummond');
      });

      it('combines text search and status filter', () => {
        const res = filterAndSortLeads(mockDataset, {
          searchQuery: 'de',
          status: 'Revisando (IA)',
        });
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe('Carlos Drummond');
      });

      it('sorts by createdAt_desc, createdAt_asc, and name_asc', () => {
        const desc = filterAndSortLeads(mockDataset, { sortBy: 'createdAt_desc' });
        expect(desc[0].name).toBe('Daniela Albuquerque');
        expect(desc[3].name).toBe('Ana Cláudia Silva');

        const asc = filterAndSortLeads(mockDataset, { sortBy: 'createdAt_asc' });
        expect(asc[0].name).toBe('Ana Cláudia Silva');
        expect(asc[3].name).toBe('Daniela Albuquerque');

        const nameAsc = filterAndSortLeads(mockDataset, { sortBy: 'name_asc' });
        expect(nameAsc.map((l) => l.name)).toEqual([
          'Ana Cláudia Silva',
          'Bruno Meireles',
          'Carlos Drummond',
          'Daniela Albuquerque',
        ]);
      });
    });

    it('renders LeadsTable and shows EmptyState with "Limpar filtros" button when no results match', () => {
      const onClearFilters = vi.fn();
      render(
        <LeadsTable
          leads={[]}
          isLoading={false}
          copiedLeadId={null}
          hasFilters={true}
          onStatusChange={vi.fn()}
          onCopyContext={vi.fn()}
          onDeleteLead={vi.fn()}
          onClearFilters={onClearFilters}
        />
      );

      expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
      expect(screen.getByText('Nenhum resultado corresponde aos filtros selecionados.')).toBeInTheDocument();
      const clearBtn = screen.getByRole('button', { name: /Limpar filtros/i });
      fireEvent.click(clearBtn);
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // REQUIREMENT 4: src/services/api.ts Error Handling for 400 and 500 Responses
  // =========================================================================
  describe('4. src/services/api.ts Error Handling (400 and 500 Responses)', () => {
    beforeEach(() => {
      // Clear testing override so api.ts uses real fetch
      setRepositoryInstanceForTesting(null);
      setStorageRepositoryForTesting(null);
    });

    it('getAll throws error on HTTP 400 and does NOT mask error with fallback', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(getAll()).rejects.toThrow(/Erro ao buscar leads: 400 Bad Request/);
    });

    it('getAll throws error on HTTP 500 and does NOT mask error with fallback', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getAll()).rejects.toThrow(/Erro ao buscar leads: 500 Internal Server Error/);
    });

    it('create throws error on HTTP 400 (Bad Request / Missing fields)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        create({ name: 'Incomplete', link: '', areaRole: '' })
      ).rejects.toThrow(/Erro ao cadastrar lead: 400 Bad Request/);
    });

    it('create throws error on HTTP 500 (Internal Server Error)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        create({ name: 'Valid Name', link: 'https://ex.com', areaRole: 'Dev' })
      ).rejects.toThrow(/Erro ao cadastrar lead: 500 Internal Server Error/);
    });

    it('updateStatus throws error on HTTP 400 (Invalid Status)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        updateStatus('some-id', 'Invalido' as LeadStatus)
      ).rejects.toThrow(/Erro ao atualizar status do lead: 400 Bad Request/);
    });

    it('updateStatus throws error on HTTP 404 (Lead not found)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        updateStatus('non-existent-id', 'Entregue')
      ).rejects.toThrow(/Erro ao atualizar status do lead: 404 Not Found/);
    });

    it('updateStatus throws error on HTTP 500 (Internal Server Error)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        updateStatus('some-id', 'Entregue')
      ).rejects.toThrow(/Erro ao atualizar status do lead: 500 Internal Server Error/);
    });

    it('deleteLead throws error on HTTP 404 (Lead not found)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(deleteLead('non-existent-id')).rejects.toThrow(/Erro ao excluir lead: 404 Not Found/);
    });

    it('deleteLead throws error on HTTP 500 (Internal Server Error)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(deleteLead('some-id')).rejects.toThrow(/Erro ao excluir lead: 500 Internal Server Error/);
    });

    it('aliased api.delete also throws error on HTTP 500', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(api.delete('some-id')).rejects.toThrow(/Erro ao excluir lead: 500 Internal Server Error/);
    });
  });
});
