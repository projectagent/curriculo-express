import { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadFilters, LeadStatus } from '../types/lead';
import {
  fetchAllLeads,
  updateLeadStatus as persistStatusUpdate,
  deleteLead as persistDeleteLead,
  calculateAdminStats,
  filterAndSortLeads,
} from '../services/leadService';
import { showToast } from './useToast';

export function useLeads() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({
    searchQuery: '',
    status: 'Todos',
    sortBy: 'createdAt_desc',
  });

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllLeads();
      setAllLeads(data);
    } catch (err: any) {
      console.error('Erro ao carregar leads:', err);
      const msg = err?.message || 'Falha ao carregar a lista de leads.';
      setError(msg);
      showToast(msg, 'error', 'Erro');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const stats = useMemo(() => calculateAdminStats(allLeads), [allLeads]);

  const filteredLeads = useMemo(
    () => filterAndSortLeads(allLeads, filters),
    [allLeads, filters]
  );

  const updateStatus = useCallback(
    async (id: string, newStatus: LeadStatus): Promise<boolean> => {
      // Find current lead for optimistic rollback
      const currentLead = allLeads.find((l) => l.id === id);
      if (!currentLead) return false;

      const previousStatus = currentLead.status;
      if (previousStatus === newStatus) return true;

      // Optimistic UI update
      setAllLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l))
      );

      try {
        await persistStatusUpdate(id, newStatus);
        showToast(`Status de "${currentLead.name}" atualizado para "${newStatus}".`, 'success', 'Atualizado');
        return true;
      } catch (err: any) {
        console.error('Erro ao persistir status:', err);
        // Rollback
        setAllLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: previousStatus } : l))
        );
        showToast('Não foi possível atualizar o status. As alterações foram revertidas.', 'error', 'Erro');
        return false;
      }
    },
    [allLeads]
  );

  const deleteLead = useCallback(
    async (id: string): Promise<boolean> => {
      const currentLead = allLeads.find((l) => l.id === id);
      if (!currentLead) return false;

      // Optimistic removal from UI
      setAllLeads((prev) => prev.filter((l) => l.id !== id));

      try {
        await persistDeleteLead(id);
        showToast(`Lead "${currentLead.name}" excluído permanentemente.`, 'success', 'Excluído');
        return true;
      } catch (err: any) {
        console.error('Erro ao excluir lead:', err);
        // Rollback on failure
        setAllLeads((prev) => [...prev, currentLead]);
        showToast('Não foi possível excluir o lead.', 'error', 'Erro');
        return false;
      }
    },
    [allLeads]
  );

  return {
    leads: filteredLeads,
    allLeads,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    updateStatus,
    deleteLead,
    refresh: loadLeads,
  };
}
