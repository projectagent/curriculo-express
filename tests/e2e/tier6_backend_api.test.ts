/** @vitest-environment node */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';

const API_BASE_URL = 'http://localhost:3001';
const LEADS_ENDPOINT = `${API_BASE_URL}/leads`;
const DB_PATH = path.resolve(__dirname, '../../leads.sqlite');

describe('Tier 6: Backend API & SQLite Physical Persistence Integration Tests', () => {
  let serverInstance: any = null;
  let startedServerLocally = false;
  let db: any = null;

  // Track created test lead IDs for assertions and guaranteed cleanup
  let createdLeadAId: string = '';
  let createdLeadBId: string = '';

  beforeAll(async () => {
    // 1. Ensure Express server is running on port 3001
    try {
      const ping = await fetch(LEADS_ENDPOINT);
      if (ping.status === 200 || ping.status === 404) {
        // Express is already listening externally
        startedServerLocally = false;
      }
    } catch {
      // Server not running, bootstrap dynamically
      const serverModule = await import('../../api/server.js');
      serverInstance = serverModule.server;
      startedServerLocally = true;
    }

    // 2. Obtain SQLite database singleton handle for direct disk queries
    const dbModule = await import('../../api/db.js');
    db = await dbModule.getDb();
  }, 15000);

  afterAll(async () => {
    // Cleanup any lingering test records if not already deleted
    try {
      if (db) {
        if (createdLeadAId) {
          await db.run('DELETE FROM leads WHERE id = ?', [createdLeadAId]);
        }
        if (createdLeadBId) {
          await db.run('DELETE FROM leads WHERE id = ?', [createdLeadBId]);
        }
      }
    } catch {
      // Ignore cleanup error if already removed
    }

    // Cleanly close server listener if started by this test suite
    if (startedServerLocally && serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }

    // Cleanly close SQLite database connection
    const dbModule = await import('../../api/db.js');
    await dbModule.closeDb();
  });

  // -------------------------------------------------------------------------
  // Test 1: POST /leads inserts lead, returns HTTP 201, generated ID, status 'Novo'
  // -------------------------------------------------------------------------
  it('Test 1: POST /leads inserts lead, asserts HTTP 201, verifies generated ID and status "Novo"', async () => {
    const payload = {
      nome: 'Beatriz Almeida Santana',
      link: 'https://linkedin.com/in/beatriz-almeida',
      area: 'Tech Lead Cloud'
    };

    const res = await fetch(LEADS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toBeDefined();
    expect(body.id).toBeDefined();
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(10); // Valid UUID

    expect(body.nome).toBe(payload.nome);
    expect(body.name).toBe(payload.nome);
    expect(body.link).toBe(payload.link);
    expect(body.area).toBe(payload.area);
    expect(body.areaRole).toBe(payload.area);
    expect(body.status).toBe('Novo');
    expect(body.data_criacao).toBeDefined();
    expect(body.createdAt).toBe(body.data_criacao);

    // Save ID for subsequent tests
    createdLeadAId = body.id;
  });

  // -------------------------------------------------------------------------
  // Test 2: Physical persistence check - directly queries leads.sqlite
  // -------------------------------------------------------------------------
  it('Test 2: Physical persistence check - directly queries leads.sqlite to assert record was physically written to disk', async () => {
    expect(createdLeadAId).toBeTruthy();

    // Verify physical file exists on disk
    expect(fs.existsSync(DB_PATH)).toBe(true);

    // Query leads.sqlite directly via database driver
    const row = await db.get('SELECT * FROM leads WHERE id = ?', [createdLeadAId]);

    expect(row).toBeDefined();
    expect(row.id).toBe(createdLeadAId);
    expect(row.nome).toBe('Beatriz Almeida Santana');
    expect(row.link).toBe('https://linkedin.com/in/beatriz-almeida');
    expect(row.area).toBe('Tech Lead Cloud');
    expect(row.status).toBe('Novo');
    expect(row.data_criacao).toBeDefined();
    expect(typeof row.data_criacao).toBe('string');
  });

  // -------------------------------------------------------------------------
  // Test 3: GET /leads returns array containing inserted lead, ordered DESC
  // -------------------------------------------------------------------------
  it('Test 3: GET /leads returns array containing inserted lead, asserts HTTP 200, verifies descending order by data_criacao', async () => {
    // Insert a second lead with small delay to ensure distinct data_criacao timestamp
    await new Promise((r) => setTimeout(r, 20));

    const payloadB = {
      nome: 'Carlos Mendes Ferreira',
      link: 'https://linkedin.com/in/carlos-mendes',
      area: 'DevOps Engineer'
    };

    const resB = await fetch(LEADS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadB)
    });
    expect(resB.status).toBe(201);
    const bodyB = await resB.json();
    createdLeadBId = bodyB.id;

    // Fetch all leads via GET /leads
    const res = await fetch(LEADS_ENDPOINT);
    expect(res.status).toBe(200);

    const leads = await res.json();
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThanOrEqual(2);

    // Assert array contains both inserted leads
    const foundA = leads.find((l: any) => l.id === createdLeadAId);
    const foundB = leads.find((l: any) => l.id === createdLeadBId);
    expect(foundA).toBeDefined();
    expect(foundB).toBeDefined();
    expect(foundA.nome).toBe('Beatriz Almeida Santana');
    expect(foundB.nome).toBe('Carlos Mendes Ferreira');

    // Assert descending order by data_criacao across entire list
    for (let i = 0; i < leads.length - 1; i++) {
      const timeCurrent = new Date(leads[i].data_criacao).getTime();
      const timeNext = new Date(leads[i + 1].data_criacao).getTime();
      expect(timeCurrent).toBeGreaterThanOrEqual(timeNext);
    }

    // Lead B was created after Lead A, so Lead B must appear before Lead A
    const indexB = leads.findIndex((l: any) => l.id === createdLeadBId);
    const indexA = leads.findIndex((l: any) => l.id === createdLeadAId);
    expect(indexB).toBeLessThan(indexA);
  });

  // -------------------------------------------------------------------------
  // Test 4: PUT /leads/:id updates status across valid states and persists
  // -------------------------------------------------------------------------
  it('Test 4: PUT /leads/:id updates status across valid states, asserts HTTP 200, queries leads.sqlite to verify physical update', async () => {
    expect(createdLeadAId).toBeTruthy();

    const validStates = [
      'Aguardando Pagamento',
      'Revisando (IA)',
      'Entregue',
      'Novo'
    ];

    for (const targetStatus of validStates) {
      const res = await fetch(`${LEADS_ENDPOINT}/${createdLeadAId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(createdLeadAId);
      expect(body.status).toBe(targetStatus);

      // Direct physical verification in leads.sqlite
      const diskRow = await db.get('SELECT status FROM leads WHERE id = ?', [createdLeadAId]);
      expect(diskRow).toBeDefined();
      expect(diskRow.status).toBe(targetStatus);
    }
  });

  // -------------------------------------------------------------------------
  // Test 5: PUT /leads/:id with invalid status returns HTTP 400
  // -------------------------------------------------------------------------
  it('Test 5: PUT /leads/:id with invalid status returns HTTP 400', async () => {
    expect(createdLeadAId).toBeTruthy();

    const invalidStatuses = ['StatusInvalido', 'Cancelado', '', 'novo'];

    for (const badStatus of invalidStatuses) {
      const res = await fetch(`${LEADS_ENDPOINT}/${createdLeadAId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: badStatus })
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Status inválido' });
    }
  });

  // -------------------------------------------------------------------------
  // Test 6: PUT /leads/:id with non-existent ID returns HTTP 404
  // -------------------------------------------------------------------------
  it('Test 6: PUT /leads/:id with non-existent ID returns HTTP 404', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const res = await fetch(`${LEADS_ENDPOINT}/${nonExistentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Aguardando Pagamento' })
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Lead não encontrado' });
  });

  // -------------------------------------------------------------------------
  // Test 7: DELETE /leads/:id removes lead, asserts HTTP 200
  // -------------------------------------------------------------------------
  it('Test 7: DELETE /leads/:id removes lead, asserts HTTP 200', async () => {
    expect(createdLeadAId).toBeTruthy();

    const res = await fetch(`${LEADS_ENDPOINT}/${createdLeadAId}`, {
      method: 'DELETE'
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      message: 'Lead excluído com sucesso',
      id: createdLeadAId
    });
  });

  // -------------------------------------------------------------------------
  // Test 8: Physical deletion check - directly queries leads.sqlite
  // -------------------------------------------------------------------------
  it('Test 8: Physical deletion check - directly queries leads.sqlite to assert record is physically gone from disk', async () => {
    expect(createdLeadAId).toBeTruthy();

    const diskRow = await db.get('SELECT * FROM leads WHERE id = ?', [createdLeadAId]);
    expect(diskRow).toBeUndefined();

    // Mark as cleaned up so afterAll doesn't need to delete again
    createdLeadAId = '';
  });

  // -------------------------------------------------------------------------
  // Test 9: DELETE /leads/:id with non-existent ID returns HTTP 404
  // -------------------------------------------------------------------------
  it('Test 9: DELETE /leads/:id with non-existent ID returns HTTP 404', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const res = await fetch(`${LEADS_ENDPOINT}/${nonExistentId}`, {
      method: 'DELETE'
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Lead não encontrado' });
  });

  // -------------------------------------------------------------------------
  // Test 10: POST /leads with missing required fields returns HTTP 400
  // -------------------------------------------------------------------------
  it('Test 10: POST /leads with missing required fields returns HTTP 400', async () => {
    const invalidPayloads = [
      {}, // totally empty
      { nome: 'Só Nome' }, // missing link and area
      { link: 'https://linkedin.com/in/teste' }, // missing nome and area
      { area: 'Frontend' }, // missing nome and link
      { nome: 'Nome', link: 'Link' }, // missing area
      { nome: '   ', link: 'https://linkedin.com/in/valido', area: 'Backend' }, // whitespace nome
      { nome: 'Nome Valido', link: '   ', area: 'Backend' }, // whitespace link
      { nome: 'Nome Valido', link: 'https://linkedin.com/in/valido', area: '   ' } // whitespace area
    ];

    for (const badPayload of invalidPayloads) {
      const res = await fetch(LEADS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badPayload)
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Campos obrigatórios: nome, link, area' });
    }

    // Clean up createdLeadBId so disk is left pristine
    if (createdLeadBId) {
      const delRes = await fetch(`${LEADS_ENDPOINT}/${createdLeadBId}`, {
        method: 'DELETE'
      });
      expect(delRes.status).toBe(200);
      createdLeadBId = '';
    }
  });
});
