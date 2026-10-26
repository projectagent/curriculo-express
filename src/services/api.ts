import { Lead, CreateLeadDTO, LeadStatus } from '../types/lead';
import { getApiBaseUrl } from '../config/env';
import { normalizeUrl } from '../utils/formatters';
import { getLeadsRepository, hasStorageRepositoryOverride } from './storage/storageFactory';

/**
 * Normalizes backend database rows (SQLite snake/flat Portuguese columns or English aliases)
 * into frontend Lead domain objects.
 */
export function normalizeLead(item: any): Lead {
  return {
    id: String(item.id),
    name: item.nome ?? item.name ?? '',
    link: item.link ?? '',
    areaRole: item.area ?? item.areaRole ?? item.area_role ?? '',
    status: (item.status || 'Novo') as LeadStatus,
    createdAt: item.data_criacao ?? item.createdAt ?? item.created_at ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updated_at,
    phone: item.phone,
    notes: item.notes,
  };
}

/**
 * Retrieves all leads from the REST API endpoint (ordered DESC by data_criacao).
 * Falls back to LocalStorage repository when offline or in test environments without a running server.
 */
export async function getAll(): Promise<Lead[]> {
  if (hasStorageRepositoryOverride()) {
    return getLeadsRepository().getAll();
  }

  try {
    const endpoint = `${getApiBaseUrl()}/leads`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Erro ao buscar leads: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(normalizeLead);
  } catch (err: any) {
    if (err?.message && err.message.startsWith('Erro ao buscar leads:')) {
      throw err;
    }
    // Fallback for offline / test runner execution
    try {
      return await getLeadsRepository().getAll();
    } catch {
      throw err;
    }
  }
}

/**
 * Creates a new lead via POST /leads sending dual Portuguese and English field mappings.
 * Falls back to LocalStorage repository when offline or in test environments without a running server.
 */
export async function create(dto: CreateLeadDTO): Promise<Lead> {
  if (hasStorageRepositoryOverride()) {
    return getLeadsRepository().create(dto);
  }

  try {
    const endpoint = `${getApiBaseUrl()}/leads`;
    const payload = {
      nome: dto.name.trim(),
      name: dto.name.trim(),
      link: normalizeUrl(dto.link),
      area: dto.areaRole.trim(),
      areaRole: dto.areaRole.trim(),
      phone: dto.phone?.trim() || null,
      status: 'Novo',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ao cadastrar lead: ${response.status} ${response.statusText}`);
    }

    const created = await response.json();
    return normalizeLead(created);
  } catch (err: any) {
    if (err?.message && err.message.startsWith('Erro ao cadastrar lead:')) {
      throw err;
    }
    // Fallback for offline / test runner execution
    try {
      return await getLeadsRepository().create(dto);
    } catch {
      throw err;
    }
  }
}

/**
 * Updates a lead status via PUT /leads/:id.
 * Falls back to LocalStorage repository when offline or in test environments without a running server.
 */
export async function updateStatus(id: string, status: LeadStatus): Promise<Lead> {
  if (hasStorageRepositoryOverride()) {
    return getLeadsRepository().updateStatus(id, status);
  }

  try {
    const endpoint = `${getApiBaseUrl()}/leads/${id}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar status do lead: ${response.status} ${response.statusText}`);
    }

    const updated = await response.json();
    return normalizeLead(updated);
  } catch (err: any) {
    if (err?.message && err.message.startsWith('Erro ao atualizar status do lead:')) {
      throw err;
    }
    // Fallback for offline / test runner execution
    try {
      return await getLeadsRepository().updateStatus(id, status);
    } catch {
      throw err;
    }
  }
}

/**
 * Deletes a lead permanently via DELETE /leads/:id.
 * Falls back to LocalStorage repository when offline or in test environments without a running server.
 */
async function deleteLead(id: string): Promise<boolean> {
  if (hasStorageRepositoryOverride()) {
    return getLeadsRepository().delete(id);
  }

  try {
    const endpoint = `${getApiBaseUrl()}/leads/${id}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Erro ao excluir lead: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (err: any) {
    if (err?.message && err.message.startsWith('Erro ao excluir lead:')) {
      throw err;
    }
    // Fallback for offline / test runner execution
    try {
      return await getLeadsRepository().delete(id);
    } catch {
      throw err;
    }
  }
}

// Handle JavaScript ESM reserved word 'delete' with an alias export
export { deleteLead as delete, deleteLead };

export const api = {
  getAll,
  create,
  updateStatus,
  delete: deleteLead,
};

export default api;
