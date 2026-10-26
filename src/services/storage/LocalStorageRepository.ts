import { ILeadsRepository } from './ILeadsRepository';
import { Lead, CreateLeadDTO, LeadStatus } from '../../types/lead';
import { SEED_LEADS } from './seedData';
import { normalizeUrl } from '../../utils/formatters';

export const LOCAL_STORAGE_LEADS_KEY = 'curriculo_express_leads_v1';

export class LocalStorageRepository implements ILeadsRepository {
  readonly mode = 'local-storage' as const;
  private memoryCache: Lead[] | null = null;

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private loadLeads(): Lead[] {
    if (this.isLocalStorageAvailable()) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
        if (raw === null) {
          // Key doesn't exist yet: initialize with seed data
          window.localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(SEED_LEADS));
          return [...SEED_LEADS];
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // If parsed is not an array, heal with seed data
        window.localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(SEED_LEADS));
        return [...SEED_LEADS];
      } catch (err) {
        // Corrupted JSON: heal by re-initializing seed data
        console.warn('LocalStorage data corrupt, healing with seed data:', err);
        try {
          window.localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(SEED_LEADS));
        } catch {
          // ignore
        }
        return [...SEED_LEADS];
      }
    }

    if (!this.memoryCache) {
      this.memoryCache = [...SEED_LEADS];
    }
    return this.memoryCache;
  }

  private saveLeads(leads: Lead[]): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(leads));
      } catch (err) {
        console.warn('Error saving to localStorage, keeping in-memory:', err);
      }
    }
    this.memoryCache = [...leads];
  }

  async getAll(): Promise<Lead[]> {
    const leads = this.loadLeads();
    return [...leads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<Lead | null> {
    const leads = this.loadLeads();
    return leads.find((l) => l.id === id) || null;
  }

  async create(dto: CreateLeadDTO): Promise<Lead> {
    const leads = this.loadLeads();
    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: dto.name.trim(),
      link: normalizeUrl(dto.link),
      areaRole: dto.areaRole.trim(),
      phone: dto.phone?.trim() || undefined,
      status: 'Novo',
      createdAt: new Date().toISOString(),
    };

    const updated = [newLead, ...leads];
    this.saveLeads(updated);
    return newLead;
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const leads = this.loadLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Lead com ID ${id} não encontrado.`);
    }

    const updatedLead: Lead = {
      ...leads[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    leads[index] = updatedLead;
    this.saveLeads(leads);
    return updatedLead;
  }

  async delete(id: string): Promise<boolean> {
    const leads = this.loadLeads();
    const filtered = leads.filter((l) => l.id !== id);
    if (filtered.length === leads.length) {
      return false;
    }
    this.saveLeads(filtered);
    return true;
  }

  resetToSeeds(): void {
    this.saveLeads([...SEED_LEADS]);
  }
}
