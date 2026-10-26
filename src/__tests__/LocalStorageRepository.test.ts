import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository, LOCAL_STORAGE_LEADS_KEY } from '../services/storage/LocalStorageRepository';
import { LeadStatus } from '../types/lead';

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repo = new LocalStorageRepository();
  });

  it('initializes with 5 pre-seeded leads covering all 4 status values', async () => {
    const leads = await repo.getAll();
    expect(leads.length).toBe(5);

    const statuses = new Set(leads.map((l) => l.status));
    expect(statuses.has('Novo')).toBe(true);
    expect(statuses.has('Aguardando Pagamento')).toBe(true);
    expect(statuses.has('Revisando (IA)')).toBe(true);
    expect(statuses.has('Entregue')).toBe(true);
  });

  it('creates new lead and persists to localStorage', async () => {
    const newLead = await repo.create({
      name: 'Gabriel Martins',
      link: 'linkedin.com/in/gabriel-martins',
      areaRole: 'DevOps / SRE',
      phone: '11988887777',
    });

    expect(newLead.id).toBeDefined();
    expect(newLead.name).toBe('Gabriel Martins');
    expect(newLead.status).toBe('Novo');
    expect(newLead.link).toBe('https://linkedin.com/in/gabriel-martins');

    const allLeads = await repo.getAll();
    expect(allLeads.length).toBe(6);
    expect(allLeads[0].name).toBe('Gabriel Martins');

    // Confirm persisted in localStorage
    const rawStored = window.localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    expect(rawStored).toContain('Gabriel Martins');
  });

  it('updates lead status correctly and records updatedAt timestamp', async () => {
    const leads = await repo.getAll();
    const targetLead = leads[0];

    const updated = await repo.updateStatus(targetLead.id, 'Revisando (IA)' as LeadStatus);
    expect(updated.status).toBe('Revisando (IA)');
    expect(updated.updatedAt).toBeDefined();

    const fetched = await repo.getById(targetLead.id);
    expect(fetched?.status).toBe('Revisando (IA)');
  });

  it('throws error when trying to update non-existent lead', async () => {
    await expect(repo.updateStatus('non-existent-id', 'Entregue')).rejects.toThrow(
      'não encontrado'
    );
  });
});
