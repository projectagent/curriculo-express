import { Lead, LeadFilters, AdminStats, CreateLeadDTO, LeadStatus } from '../types/lead';
import api from './api';

export function calculateAdminStats(leads: Lead[]): AdminStats {
  const stats: AdminStats = {
    total: leads.length,
    novos: 0,
    aguardandoPagamento: 0,
    revisandoIA: 0,
    entregues: 0,
  };

  for (const lead of leads) {
    switch (lead.status) {
      case 'Novo':
        stats.novos++;
        break;
      case 'Aguardando Pagamento':
        stats.aguardandoPagamento++;
        break;
      case 'Revisando (IA)':
        stats.revisandoIA++;
        break;
      case 'Entregue':
        stats.entregues++;
        break;
    }
  }

  return stats;
}

export function filterAndSortLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  let result = [...leads];

  // 1. Text search query (name, areaRole, link)
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const query = filters.searchQuery.trim().toLowerCase();
    result = result.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.areaRole.toLowerCase().includes(query) ||
        lead.link.toLowerCase().includes(query)
    );
  }

  // 2. Status filter
  if (filters.status && filters.status !== 'Todos') {
    result = result.filter((lead) => lead.status === filters.status);
  }

  // 3. Sorting
  const sortBy = filters.sortBy || 'createdAt_desc';
  result.sort((a, b) => {
    if (sortBy === 'createdAt_desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'createdAt_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name, 'pt-BR');
    }
    return 0;
  });

  return result;
}

export async function fetchAllLeads(): Promise<Lead[]> {
  return api.getAll();
}

export async function createNewLead(dto: CreateLeadDTO): Promise<Lead> {
  return api.create(dto);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return api.updateStatus(id, status);
}

export async function deleteLead(id: string): Promise<boolean> {
  return api.delete(id);
}
