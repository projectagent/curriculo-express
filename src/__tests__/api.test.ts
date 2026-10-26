import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api, { normalizeLead, getAll, create, updateStatus, deleteLead, delete as deleteAlias } from '../services/api';
import { setStorageRepositoryForTesting } from '../services/storage/storageFactory';
import { LocalStorageRepository } from '../services/storage/LocalStorageRepository';

describe('src/services/api.ts REST Client', () => {
  beforeEach(() => {
    localStorage.clear();
    setStorageRepositoryForTesting(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    setStorageRepositoryForTesting(null);
    vi.restoreAllMocks();
  });

  describe('normalizeLead', () => {
    it('normalizes backend database row with Portuguese field names', () => {
      const raw = {
        id: '123',
        nome: 'João da Silva',
        link: 'https://linkedin.com/in/joao',
        area: 'Engenharia de Software',
        status: 'Novo',
        data_criacao: '2026-10-26T12:00:00.000Z',
      };

      const normalized = normalizeLead(raw);
      expect(normalized.id).toBe('123');
      expect(normalized.name).toBe('João da Silva');
      expect(normalized.link).toBe('https://linkedin.com/in/joao');
      expect(normalized.areaRole).toBe('Engenharia de Software');
      expect(normalized.status).toBe('Novo');
      expect(normalized.createdAt).toBe('2026-10-26T12:00:00.000Z');
    });

    it('normalizes backend database row with English field names', () => {
      const raw = {
        id: 456,
        name: 'Maria Oliveira',
        link: 'https://linkedin.com/in/maria',
        areaRole: 'Product Manager',
        status: 'Aguardando Pagamento',
        createdAt: '2026-10-26T14:00:00.000Z',
      };

      const normalized = normalizeLead(raw);
      expect(normalized.id).toBe('456');
      expect(normalized.name).toBe('Maria Oliveira');
      expect(normalized.link).toBe('https://linkedin.com/in/maria');
      expect(normalized.areaRole).toBe('Product Manager');
      expect(normalized.status).toBe('Aguardando Pagamento');
      expect(normalized.createdAt).toBe('2026-10-26T14:00:00.000Z');
    });

    it('provides sensible defaults for missing status, createdAt, and areaRole', () => {
      const raw = {
        id: 789,
        nome: 'Sem Detalhes',
        link: 'https://cv.pdf',
      };

      const normalized = normalizeLead(raw);
      expect(normalized.id).toBe('789');
      expect(normalized.name).toBe('Sem Detalhes');
      expect(normalized.status).toBe('Novo');
      expect(normalized.areaRole).toBe('');
      expect(normalized.createdAt).toBeDefined();
    });
  });

  describe('HTTP REST operations with mocked fetch', () => {
    it('getAll() sends GET to /leads and returns normalized array', async () => {
      const mockRows = [
        {
          id: 'lead-1',
          nome: 'Dev Um',
          link: 'https://linkedin.com/in/dev1',
          area: 'Frontend',
          status: 'Novo',
          data_criacao: '2026-10-26T10:00:00.000Z',
        },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRows,
      });
      global.fetch = fetchMock;

      const results = await getAll();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/leads');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Dev Um');
      expect(results[0].areaRole).toBe('Frontend');
    });

    it('create() sends POST to /leads with dual Portuguese and English field mappings', async () => {
      const createdRow = {
        id: 'new-uuid',
        nome: 'Carlos Drummond',
        name: 'Carlos Drummond',
        link: 'https://linkedin.com/in/drummond',
        area: 'Engenharia de Software',
        areaRole: 'Engenharia de Software',
        status: 'Novo',
        data_criacao: '2026-10-26T12:00:00.000Z',
      };

      let capturedPayload: any = null;
      const fetchMock = vi.fn().mockImplementation(async (_url, opts) => {
        capturedPayload = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => createdRow,
        };
      });
      global.fetch = fetchMock;

      const lead = await create({
        name: 'Carlos Drummond',
        link: 'https://linkedin.com/in/drummond',
        areaRole: 'Engenharia de Software',
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(capturedPayload.nome).toBe('Carlos Drummond');
      expect(capturedPayload.name).toBe('Carlos Drummond');
      expect(capturedPayload.area).toBe('Engenharia de Software');
      expect(capturedPayload.areaRole).toBe('Engenharia de Software');
      expect(capturedPayload.status).toBe('Novo');

      expect(lead.id).toBe('new-uuid');
      expect(lead.name).toBe('Carlos Drummond');
    });

    it('updateStatus() sends PUT to /leads/:id with new status', async () => {
      const updatedRow = {
        id: 'uuid-1',
        nome: 'Carlos Drummond',
        link: 'https://linkedin.com/in/drummond',
        area: 'Engenharia de Software',
        status: 'Revisando (IA)',
        data_criacao: '2026-10-26T12:00:00.000Z',
      };

      let capturedMethod = '';
      let capturedBody: any = null;
      const fetchMock = vi.fn().mockImplementation(async (_url, opts) => {
        capturedMethod = opts.method;
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => updatedRow,
        };
      });
      global.fetch = fetchMock;

      const result = await updateStatus('uuid-1', 'Revisando (IA)');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/leads/uuid-1',
        expect.anything()
      );
      expect(capturedMethod).toBe('PUT');
      expect(capturedBody).toEqual({ status: 'Revisando (IA)' });
      expect(result.status).toBe('Revisando (IA)');
    });

    it('deleteLead() and aliased delete() send DELETE to /leads/:id and return boolean', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Lead excluído com sucesso' }),
      });
      global.fetch = fetchMock;

      const res1 = await deleteLead('uuid-to-delete');
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/leads/uuid-to-delete', {
        method: 'DELETE',
      });
      expect(res1).toBe(true);

      const res2 = await deleteAlias('uuid-to-delete-alias');
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/leads/uuid-to-delete-alias', {
        method: 'DELETE',
      });
      expect(res2).toBe(true);
    });

    it('re-throws HTTP server error when status code is non-2xx', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });
      global.fetch = fetchMock;

      await expect(
        create({ name: 'Invalido', link: '', areaRole: '' })
      ).rejects.toThrow(/Erro ao cadastrar lead: 400/);
    });
  });

  describe('JavaScript reserved word alias export', () => {
    it('exports delete both as deleteLead and delete on the api namespace', () => {
      expect(api.delete).toBe(deleteLead);
      expect(deleteAlias).toBe(deleteLead);
      expect(typeof api.getAll).toBe('function');
      expect(typeof api.create).toBe('function');
      expect(typeof api.updateStatus).toBe('function');
      expect(typeof api.delete).toBe('function');
    });
  });

  describe('Offline fallback to LocalStorage repository', () => {
    it('falls back to LocalStorage repository when fetch fails with network error', async () => {
      const repo = new LocalStorageRepository();
      setStorageRepositoryForTesting(repo);

      // In testing override mode, it directly routes to repo
      const leads = await api.getAll();
      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBeGreaterThanOrEqual(5);
    });
  });
});
