// tests/adversarial_challenge_m1.mjs
// Adversarial Empirical Stress Test Suite for Milestone 1 (Backend Local Node.js + SQLite)

import assert from 'node:assert/strict';
import http from 'node:http';
import { getDb, closeDb } from '../api/db.js';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof Buffer)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: body !== undefined ? body : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function runAdversarialSuite() {
  console.log('===============================================================');
  console.log('STARTING EMPIRICAL ADVERSARIAL STRESS SUITE (CHALLENGER 2 - M1)');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function report(name, ok, details = '') {
    if (ok) {
      passed++;
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      failed++;
      console.error(`[FAIL] ${name} -> ${details}`);
    }
  }

  // -------------------------------------------------------------------------
  // SUITE 1: SQLite Engine & File Integrity
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 1: SQLite Engine & File Integrity ---');
  try {
    const db = await getDb();
    
    // 1.1 PRAGMA integrity_check
    const integrity = await db.get('PRAGMA integrity_check');
    report('1.1 PRAGMA integrity_check', integrity.integrity_check === 'ok', JSON.stringify(integrity));

    // 1.2 PRAGMA foreign_key_check
    const fkCheck = await db.all('PRAGMA foreign_key_check');
    report('1.2 PRAGMA foreign_key_check', fkCheck.length === 0, `violations: ${fkCheck.length}`);

    // 1.3 PRAGMA journal_mode
    const journal = await db.get('PRAGMA journal_mode');
    report('1.3 PRAGMA journal_mode is WAL', journal.journal_mode.toLowerCase() === 'wal', journal.journal_mode);

    // 1.4 PRAGMA busy_timeout
    const timeout = await db.get('PRAGMA busy_timeout');
    report('1.4 PRAGMA busy_timeout >= 5000ms', timeout.timeout >= 5000, `timeout: ${timeout.timeout}`);

    // 1.5 Table schema inspection
    const columns = await db.all('PRAGMA table_info(leads)');
    const colMap = Object.fromEntries(columns.map(c => [c.name, c]));
    
    const hasRequiredCols = 
      colMap.id && colMap.id.pk === 1 &&
      colMap.nome && colMap.nome.notnull === 1 &&
      colMap.link && colMap.link.notnull === 1 &&
      colMap.area && colMap.area.notnull === 1 &&
      colMap.status && colMap.status.notnull === 1 && colMap.status.dflt_value === "'Novo'" &&
      colMap.data_criacao && colMap.data_criacao.notnull === 1;

    report('1.5 Schema columns, primary key, NOT NULL and default values', Boolean(hasRequiredCols), JSON.stringify(colMap));
  } catch (err) {
    report('Suite 1 DB Connection/Query', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Non-existent IDs & Input Validation Edge Cases (404 and 400)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Non-existent IDs & Validation Edge Cases ---');
  try {
    // 2.1 PUT non-existent UUID -> 404
    const resPut404UUID = await request('/leads/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      body: { status: 'Aguardando Pagamento' }
    });
    report('2.1 PUT non-existent UUID returns 404', resPut404UUID.status === 404 && resPut404UUID.data?.error === 'Lead não encontrado', `HTTP ${resPut404UUID.status}`);

    // 2.2 PUT arbitrary non-existent string ID -> 404
    const resPut404Str = await request('/leads/non-existent-random-id-999', {
      method: 'PUT',
      body: { status: 'Revisando (IA)' }
    });
    report('2.2 PUT arbitrary non-existent string ID returns 404', resPut404Str.status === 404 && resPut404Str.data?.error === 'Lead não encontrado', `HTTP ${resPut404Str.status}`);

    // 2.3 DELETE non-existent UUID -> 404
    const resDel404UUID = await request('/leads/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE'
    });
    report('2.3 DELETE non-existent UUID returns 404', resDel404UUID.status === 404 && resDel404UUID.data?.error === 'Lead não encontrado', `HTTP ${resDel404UUID.status}`);

    // 2.4 DELETE arbitrary non-existent string ID -> 404
    const resDel404Str = await request('/leads/non-existent-random-id-999', {
      method: 'DELETE'
    });
    report('2.4 DELETE arbitrary non-existent ID returns 404', resDel404Str.status === 404 && resDel404Str.data?.error === 'Lead não encontrado', `HTTP ${resDel404Str.status}`);

    // First create a temporary test lead for status validation tests
    const leadSeed = await request('/leads', {
      method: 'POST',
      body: { nome: 'Seed Para Teste 400', link: 'https://linkedin.com/in/seed', area: 'QA' }
    });
    const seedId = leadSeed.data?.id;

    // 2.5 PUT invalid statuses -> 400
    const invalidStatuses = [
      { label: 'empty object', body: {} },
      { label: 'missing status prop', body: { other: 123 } },
      { label: 'arbitrary string', body: { status: 'Invalido' } },
      { label: 'lowercase novo', body: { status: 'novo' } },
      { label: 'empty string', body: { status: '' } },
      { label: 'whitespace only', body: { status: '   ' } },
      { label: 'null status', body: { status: null } },
      { label: 'number status', body: { status: 123 } },
      { label: 'SQL injection string', body: { status: "Novo'; DROP TABLE leads; --" } }
    ];

    for (const testCase of invalidStatuses) {
      const res = await request(`/leads/${seedId}`, {
        method: 'PUT',
        body: testCase.body
      });
      report(`2.5 PUT invalid status [${testCase.label}] returns 400`, res.status === 400 && res.data?.error === 'Status inválido', `HTTP ${res.status}`);
    }

    // 2.6 POST missing or blank fields -> 400
    const invalidPosts = [
      { label: 'empty body', body: {} },
      { label: 'missing area', body: { nome: 'João', link: 'https://linkedin.com' } },
      { label: 'missing link', body: { nome: 'João', area: 'Dev' } },
      { label: 'missing nome', body: { link: 'https://linkedin.com', area: 'Dev' } },
      { label: 'whitespace nome', body: { nome: '   ', link: 'https://linkedin.com', area: 'Dev' } },
      { label: 'whitespace link', body: { nome: 'João', link: '   ', area: 'Dev' } },
      { label: 'whitespace area', body: { nome: 'João', link: 'https://linkedin.com', area: '   ' } },
      { label: 'null fields', body: { nome: null, link: null, area: null } },
    ];

    for (const testCase of invalidPosts) {
      const res = await request('/leads', {
        method: 'POST',
        body: testCase.body
      });
      report(`2.6 POST invalid fields [${testCase.label}] returns 400`, res.status === 400 && res.data?.error === 'Campos obrigatórios: nome, link, area', `HTTP ${res.status}`);
    }

    // Clean up seed lead
    await request(`/leads/${seedId}`, { method: 'DELETE' });
  } catch (err) {
    report('Suite 2 Execution', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Status State Transitions & Dual-Mapping Verification
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Status State Machine Transitions ---');
  try {
    // 3.1 Create lead with English aliases
    const createRes = await request('/leads', {
      method: 'POST',
      body: { name: 'Lucas Transição', link: 'https://linkedin.com/in/lucas', areaRole: 'Engenheiro de Dados' }
    });
    report('3.1 Create lead returns 201 with default status Novo', createRes.status === 201 && createRes.data?.status === 'Novo', `ID: ${createRes.data?.id}`);
    const leadId = createRes.data?.id;

    // Check dual-mapping on create
    const d = createRes.data;
    const dualMappingOk = 
      d.nome === 'Lucas Transição' && d.name === 'Lucas Transição' &&
      d.area === 'Engenheiro de Dados' && d.areaRole === 'Engenheiro de Dados' &&
      Boolean(d.data_criacao) && d.createdAt === d.data_criacao;
    report('3.1 Dual-mapping fields on POST response', dualMappingOk, `nome/name, area/areaRole, data_criacao/createdAt match`);

    // 3.2 Transition to 'Aguardando Pagamento'
    const t1 = await request(`/leads/${leadId}`, {
      method: 'PUT',
      body: { status: 'Aguardando Pagamento' }
    });
    report('3.2 Transition Novo -> Aguardando Pagamento returns 200', t1.status === 200 && t1.data?.status === 'Aguardando Pagamento', t1.data?.status);

    // 3.3 Transition to 'Revisando (IA)'
    const t2 = await request(`/leads/${leadId}`, {
      method: 'PUT',
      body: { status: 'Revisando (IA)' }
    });
    report('3.3 Transition Aguardando Pagamento -> Revisando (IA) returns 200', t2.status === 200 && t2.data?.status === 'Revisando (IA)', t2.data?.status);

    // 3.4 Transition to 'Entregue'
    const t3 = await request(`/leads/${leadId}`, {
      method: 'PUT',
      body: { status: 'Entregue' }
    });
    report('3.4 Transition Revisando (IA) -> Entregue returns 200', t3.status === 200 && t3.data?.status === 'Entregue', t3.data?.status);

    // 3.5 Transition back to 'Novo'
    const t4 = await request(`/leads/${leadId}`, {
      method: 'PUT',
      body: { status: 'Novo' }
    });
    report('3.5 Transition Entregue -> Novo returns 200', t4.status === 200 && t4.data?.status === 'Novo', t4.data?.status);

    // Verify DB state directly via SQLite
    const db = await getDb();
    const dbRow = await db.get('SELECT * FROM leads WHERE id = ?', [leadId]);
    report('3.6 SQLite record directly matches latest status Novo', dbRow && dbRow.status === 'Novo', `DB status: ${dbRow?.status}`);

    // Clean up
    await request(`/leads/${leadId}`, { method: 'DELETE' });
  } catch (err) {
    report('Suite 3 Execution', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Concurrency & SQLite Lock Contention Stress Harness
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Concurrency & Rapid Request Stress Harness ---');
  try {
    const CONCURRENT_POSTS = 100;
    console.log(`Executing ${CONCURRENT_POSTS} concurrent POST requests simultaneously...`);
    const startTime = Date.now();

    const postPromises = Array.from({ length: CONCURRENT_POSTS }, (_, i) => {
      return request('/leads', {
        method: 'POST',
        body: {
          nome: `Concurrent Candidate ${i}`,
          link: `https://linkedin.com/in/concurrent-${i}`,
          area: `Area ${i % 5}`
        }
      });
    });

    const postResults = await Promise.all(postPromises);
    const postDuration = Date.now() - startTime;

    const allCreated = postResults.every(r => r.status === 201);
    const createdIds = postResults.map(r => r.data?.id).filter(Boolean);
    const uniqueIds = new Set(createdIds);

    report(`4.1 Rapid Burst: ${CONCURRENT_POSTS} concurrent POSTs handled without lock error`, allCreated, `${CONCURRENT_POSTS}/${CONCURRENT_POSTS} 201 in ${postDuration}ms`);
    report(`4.1 All ${CONCURRENT_POSTS} created IDs are unique UUIDs`, uniqueIds.size === CONCURRENT_POSTS, `unique count: ${uniqueIds.size}`);

    // Verify in SQLite database directly
    const db = await getDb();
    const countAfterBurst = await db.get('SELECT count(*) as count FROM leads');
    report(`4.1 Direct SQLite count matches created count`, countAfterBurst.count >= CONCURRENT_POSTS, `Count in DB: ${countAfterBurst.count}`);

    // 4.2 Interleaved high-concurrency: 50 GETs and 50 POSTs running concurrently (total 100 requests)
    console.log('Executing 50 GET and 50 POST requests interleaved in flight...');
    const mixedPromises = [];
    const extraCreatedIds = [];

    for (let i = 0; i < 50; i++) {
      mixedPromises.push(request('/leads', { method: 'GET' }));
      mixedPromises.push(
        request('/leads', {
          method: 'POST',
          body: {
            nome: `Mixed Load Candidate ${i}`,
            link: `https://linkedin.com/in/mixed-${i}`,
            area: 'Fullstack'
          }
        }).then(res => {
          if (res.data?.id) extraCreatedIds.push(res.data.id);
          return res;
        })
      );
    }

    const mixedStart = Date.now();
    const mixedResults = await Promise.all(mixedPromises);
    const mixedDuration = Date.now() - mixedStart;

    const getsOk = mixedResults.filter((_, idx) => idx % 2 === 0).every(r => r.status === 200 && Array.isArray(r.data));
    const postsOk = mixedResults.filter((_, idx) => idx % 2 === 1).every(r => r.status === 201);

    report('4.2 100 interleaved concurrent GET/POST requests pass without lock contention', getsOk && postsOk, `50 GETs (200) + 50 POSTs (201) in ${mixedDuration}ms`);

    // 4.3 Concurrent PUT status updates on 50 leads simultaneously
    console.log('Executing 50 concurrent PUT status updates...');
    const leadsToUpdate = createdIds.slice(0, 50);
    const statuses = ['Novo', 'Aguardando Pagamento', 'Revisando (IA)', 'Entregue'];
    const putStart = Date.now();
    const putPromises = leadsToUpdate.map((id, idx) => {
      const targetStatus = statuses[idx % statuses.length];
      return request(`/leads/${id}`, {
        method: 'PUT',
        body: { status: targetStatus }
      });
    });

    const putResults = await Promise.all(putPromises);
    const putDuration = Date.now() - putStart;
    const allPutsOk = putResults.every(r => r.status === 200);
    report('4.3 50 concurrent PUT updates succeed with 200 OK without lock errors', allPutsOk, `${putResults.length} PUTs in ${putDuration}ms`);

    // 4.4 Concurrent DELETE requests
    const allIdsToDelete = [...createdIds, ...extraCreatedIds];
    console.log(`Executing concurrent DELETE requests on ${allIdsToDelete.length} leads...`);
    const delStart = Date.now();
    const delPromises = allIdsToDelete.map(id => request(`/leads/${id}`, { method: 'DELETE' }));
    const delResults = await Promise.all(delPromises);
    const delDuration = Date.now() - delStart;

    const allDelsOk = delResults.every(r => r.status === 200 && r.data?.message === 'Lead excluído com sucesso');
    report(`4.4 Concurrent DELETE of ${allIdsToDelete.length} leads succeeds with 200 OK`, allDelsOk, `${allIdsToDelete.length} DELETEs in ${delDuration}ms`);

    // 4.5 Subsequent DELETE on same deleted IDs must all return 404
    console.log('Verifying 404 for deleted IDs...');
    const verify404Promises = allIdsToDelete.slice(0, 20).map(id => request(`/leads/${id}`, { method: 'DELETE' }));
    const verify404Results = await Promise.all(verify404Promises);
    const allDeletedAre404 = verify404Results.every(r => r.status === 404 && r.data?.error === 'Lead não encontrado');
    report('4.5 Re-deleting leads confirms permanent removal (all return 404)', allDeletedAre404, '20/20 return 404');

    // 4.6 Verify SQLite DB count is 0 after deletions
    const countFinal = await db.get('SELECT count(*) as count FROM leads');
    report('4.6 SQLite database leads count is 0 after clean-up', countFinal.count === 0, `Count in DB: ${countFinal.count}`);
  } catch (err) {
    report('Suite 4 Concurrency Stress', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Server Crash Resilience & Malformed Data
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Server Crash Resilience & Malformed Data ---');
  try {
    // 5.1 Send malformed raw JSON body
    const malformedRes = await request('/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"nome": "broken json without closing brace'
    });
    report('5.1 Malformed JSON does not crash server (returns 4xx/5xx handled)', malformedRes.status >= 400 && malformedRes.status < 600, `HTTP ${malformedRes.status}`);

    // 5.2 Server still running and responsive immediately after error
    const pingRes = await request('/leads', { method: 'GET' });
    report('5.2 Server remains responsive to subsequent requests', pingRes.status === 200 && Array.isArray(pingRes.data), `HTTP ${pingRes.status}, data is Array`);

    // 5.3 Final integrity check on SQLite
    const db = await getDb();
    const finalIntegrity = await db.get('PRAGMA integrity_check');
    report('5.3 Post-stress PRAGMA integrity_check', finalIntegrity.integrity_check === 'ok', JSON.stringify(finalIntegrity));
  } catch (err) {
    report('Suite 5 Crash Resilience', false, err.message);
  }

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================');

  return { passed, failed };
}

// Start or attach to server
(async () => {
  let serverInstance = null;
  try {
    const ping = await fetch(`http://localhost:${PORT}/leads`).catch(() => null);
    if (!ping) {
      const mod = await import('../api/server.js');
      serverInstance = mod.server;
    } else {
      console.log(`Attached to existing server running on port ${PORT}`);
    }

    const results = await runAdversarialSuite();
    if (serverInstance) {
      serverInstance.close();
    }
    await closeDb();
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (e) {
    console.error('Fatal test error:', e);
    if (serverInstance) serverInstance.close();
    await closeDb();
    process.exit(1);
  }
})();

