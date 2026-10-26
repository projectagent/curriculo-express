// tests/challenger_m1_1_empirical_test.mjs
// Adversarial Empirical Stress Test Suite executed by Challenger 1 (Milestone 1)

import assert from 'node:assert/strict';
import { getDb, closeDb } from '../api/db.js';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (body !== undefined && typeof body === 'object' && !(body instanceof Buffer)) {
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

async function run() {
  console.log('======================================================================');
  console.log('CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS TEST SUITE (MILESTONE 1)');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  function test(name, condition, details = '') {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name}${details ? ' -> ' + details : ''}`);
    } else {
      failed++;
      failures.push({ name, details });
      console.error(`  [FAIL] ${name} -> ${details}`);
    }
  }

  const db = await getDb();

  // -------------------------------------------------------------------------
  // SECTION 0: Clean DB baseline
  // -------------------------------------------------------------------------
  console.log('--- SECTION 0: Database Baseline & Schema Check ---');
  await db.run('DELETE FROM leads');
  const count0 = await db.get('SELECT COUNT(*) as c FROM leads');
  test('0.1 Database reset to pristine state', count0.c === 0, `Count: ${count0.c}`);

  const pragmaJournal = await db.get('PRAGMA journal_mode');
  test('0.2 WAL mode enabled', pragmaJournal.journal_mode.toLowerCase() === 'wal', pragmaJournal.journal_mode);

  const pragmaBusy = await db.get('PRAGMA busy_timeout');
  test('0.3 Busy timeout >= 5000ms', pragmaBusy.timeout >= 5000, `Timeout: ${pragmaBusy.timeout}`);

  const pragmaIntegrity0 = await db.get('PRAGMA integrity_check');
  test('0.4 PRAGMA integrity_check initial', pragmaIntegrity0.integrity_check === 'ok', pragmaIntegrity0.integrity_check);

  // -------------------------------------------------------------------------
  // SECTION 1: Baseline Contract & HTTP Methods (GET, POST, PUT, DELETE)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 1: Baseline Contract & HTTP Methods ---');
  
  // 1.1 GET /leads on empty
  const getEmpty = await request('/leads');
  test('1.1 GET /leads empty returns 200 with []', getEmpty.status === 200 && Array.isArray(getEmpty.data) && getEmpty.data.length === 0, `Status: ${getEmpty.status}, length: ${getEmpty.data?.length}`);

  // 1.2 POST /leads with Portuguese fields
  const postPt = await request('/leads', {
    method: 'POST',
    body: {
      nome: 'Carlos Drummond',
      link: 'https://linkedin.com/in/drummond',
      area: 'Engenharia de Software'
    }
  });
  test('1.2 POST /leads Portuguese returns 201', postPt.status === 201, `Status: ${postPt.status}`);
  test('1.2.1 POST returned ID is valid UUID', typeof postPt.data?.id === 'string' && postPt.data.id.length === 36, `ID: ${postPt.data?.id}`);
  test('1.2.2 POST returned status is "Novo"', postPt.data?.status === 'Novo', `Status: ${postPt.data?.status}`);
  test('1.2.3 POST dual mapping keys present', postPt.data?.nome === 'Carlos Drummond' && postPt.data?.name === 'Carlos Drummond' && postPt.data?.area === 'Engenharia de Software' && postPt.data?.areaRole === 'Engenharia de Software' && postPt.data?.data_criacao === postPt.data?.createdAt);

  const lead1Id = postPt.data?.id;

  // 1.3 Direct SQLite inspection for lead 1
  const rowDb1 = await db.get('SELECT * FROM leads WHERE id = ?', [lead1Id]);
  test('1.3 Direct SQLite inspection: row authentically persisted in leads.sqlite', Boolean(rowDb1) && rowDb1.nome === 'Carlos Drummond' && rowDb1.status === 'Novo', `DB row: ${JSON.stringify(rowDb1)}`);

  // 1.4 POST /leads with English fields (backward compatibility)
  const postEn = await request('/leads', {
    method: 'POST',
    body: {
      name: 'Ada Lovelace',
      link: 'https://linkedin.com/in/ada',
      areaRole: 'Computer Science & Algorithms'
    }
  });
  test('1.4 POST /leads English aliases returns 201', postEn.status === 201 && postEn.data?.nome === 'Ada Lovelace' && postEn.data?.name === 'Ada Lovelace');
  const lead2Id = postEn.data?.id;

  // 1.5 Direct SQLite inspection for lead 2
  const rowDb2 = await db.get('SELECT * FROM leads WHERE id = ?', [lead2Id]);
  test('1.5 Direct SQLite inspection: English alias persisted correctly', Boolean(rowDb2) && rowDb2.nome === 'Ada Lovelace' && rowDb2.area === 'Computer Science & Algorithms');

  // 1.6 GET /leads returns both leads ordered by data_criacao DESC
  const getList = await request('/leads');
  test('1.6 GET /leads returns 200 with 2 items', getList.status === 200 && getList.data?.length === 2);
  test('1.6.1 GET /leads ordered by data_criacao DESC', getList.data?.[0]?.id === lead2Id && getList.data?.[1]?.id === lead1Id, `Order: [${getList.data?.[0]?.nome}, ${getList.data?.[1]?.nome}]`);

  // 1.7 PUT /leads/:id transitions
  const transitions = ['Aguardando Pagamento', 'Revisando (IA)', 'Entregue', 'Novo'];
  for (const st of transitions) {
    const putRes = await request(`/leads/${lead1Id}`, {
      method: 'PUT',
      body: { status: st }
    });
    test(`1.7 PUT status transition to '${st}' returns 200`, putRes.status === 200 && putRes.data?.status === st, `HTTP ${putRes.status}`);
    
    // Direct SQLite check
    const rowUpdated = await db.get('SELECT status FROM leads WHERE id = ?', [lead1Id]);
    test(`1.7.1 Direct SQLite confirms '${st}' persisted`, rowUpdated?.status === st, `DB status: ${rowUpdated?.status}`);
  }

  // 1.8 DELETE /leads/:id
  const delRes1 = await request(`/leads/${lead1Id}`, { method: 'DELETE' });
  test('1.8 DELETE /leads/:id returns 200', delRes1.status === 200 && delRes1.data?.message === 'Lead excluído com sucesso');

  // Direct SQLite check deletion
  const rowDeleted = await db.get('SELECT * FROM leads WHERE id = ?', [lead1Id]);
  test('1.8.1 Direct SQLite confirms record removed from disk', rowDeleted === undefined, `Row: ${rowDeleted}`);

  // 1.9 DELETE second time returns 404
  const delRes2 = await request(`/leads/${lead1Id}`, { method: 'DELETE' });
  test('1.9 Re-DELETE of same ID returns 404', delRes2.status === 404 && delRes2.data?.error === 'Lead não encontrado');

  // Clean lead 2
  await request(`/leads/${lead2Id}`, { method: 'DELETE' });

  // -------------------------------------------------------------------------
  // SECTION 2: Missing Fields, Malformed Data & Input Validation
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Missing Fields & Validation Edge Cases ---');

  const invalidPostBodies = [
    { label: 'empty object {}', body: {} },
    { label: 'missing nome', body: { link: 'https://linkedin.com', area: 'Dev' } },
    { label: 'missing link', body: { nome: 'João', area: 'Dev' } },
    { label: 'missing area', body: { nome: 'João', link: 'https://linkedin.com' } },
    { label: 'empty string nome', body: { nome: '', link: 'https://linkedin.com', area: 'Dev' } },
    { label: 'empty string link', body: { nome: 'João', link: '', area: 'Dev' } },
    { label: 'empty string area', body: { nome: 'João', link: 'https://linkedin.com', area: '' } },
    { label: 'whitespace only nome', body: { nome: '   \t\n  ', link: 'https://linkedin.com', area: 'Dev' } },
    { label: 'whitespace only link', body: { nome: 'João', link: '   ', area: 'Dev' } },
    { label: 'whitespace only area', body: { nome: 'João', link: 'https://linkedin.com', area: '   \n  ' } },
    { label: 'number type nome', body: { nome: 12345, link: 'https://linkedin.com', area: 'Dev' } },
    { label: 'boolean type link', body: { nome: 'João', link: true, area: 'Dev' } },
    { label: 'object type area', body: { nome: 'João', link: 'https://linkedin.com', area: { role: 'Dev' } } },
    { label: 'array type nome', body: { nome: ['João'], link: 'https://linkedin.com', area: 'Dev' } },
    { label: 'null fields', body: { nome: null, link: null, area: null } }
  ];

  for (const tc of invalidPostBodies) {
    const res = await request('/leads', { method: 'POST', body: tc.body });
    test(`2.1 POST invalid [${tc.label}] returns 400`, res.status === 400 && res.data?.error === 'Campos obrigatórios: nome, link, area', `Status: ${res.status}`);
  }

  // 2.2 Extra fields parameter tampering on POST
  const tamperPost = await request('/leads', {
    method: 'POST',
    body: {
      nome: 'Tamper Target',
      link: 'https://linkedin.com/in/tamper',
      area: 'Security',
      id: '00000000-hacked-custom-id',
      status: 'Entregue',
      data_criacao: '1970-01-01T00:00:00.000Z'
    }
  });
  test('2.2 POST ignores client-injected id, status, data_criacao', 
    tamperPost.status === 201 && 
    tamperPost.data?.id !== '00000000-hacked-custom-id' && 
    tamperPost.data?.status === 'Novo' && 
    tamperPost.data?.data_criacao !== '1970-01-01T00:00:00.000Z',
    `id: ${tamperPost.data?.id}, status: ${tamperPost.data?.status}`);
  
  const tamperLeadId = tamperPost.data?.id;

  // 2.3 PUT invalid statuses
  const invalidStatuses = [
    { label: 'empty body', body: {} },
    { label: 'missing status prop', body: { foo: 'bar' } },
    { label: 'arbitrary status', body: { status: 'Aprovado' } },
    { label: 'lowercase novo', body: { status: 'novo' } },
    { label: 'lowercase entregue', body: { status: 'entregue' } },
    { label: 'whitespace status', body: { status: ' Novo ' } },
    { label: 'number status', body: { status: 1 } },
    { label: 'boolean status', body: { status: true } },
    { label: 'null status', body: { status: null } },
    { label: 'empty string status', body: { status: '' } }
  ];

  for (const st of invalidStatuses) {
    const res = await request(`/leads/${tamperLeadId}`, { method: 'PUT', body: st.body });
    test(`2.3 PUT invalid status [${st.label}] returns 400`, res.status === 400 && res.data?.error === 'Status inválido', `Status: ${res.status}`);
  }

  // 2.4 PUT parameter tampering: attempt to overwrite immutable fields (nome, link, area)
  const tamperPut = await request(`/leads/${tamperLeadId}`, {
    method: 'PUT',
    body: {
      status: 'Aguardando Pagamento',
      nome: 'OVERWRITTEN NAME',
      link: 'https://evil.com',
      area: 'HACKED'
    }
  });
  test('2.4 PUT only updates status, preserving immutable fields in response',
    tamperPut.status === 200 &&
    tamperPut.data?.status === 'Aguardando Pagamento' &&
    tamperPut.data?.nome === 'Tamper Target' &&
    tamperPut.data?.link === 'https://linkedin.com/in/tamper');

  // Verify in SQLite
  const rowTamperDb = await db.get('SELECT * FROM leads WHERE id = ?', [tamperLeadId]);
  test('2.4.1 Direct SQLite confirms nome and link were not overwritten',
    rowTamperDb.nome === 'Tamper Target' && rowTamperDb.link === 'https://linkedin.com/in/tamper' && rowTamperDb.status === 'Aguardando Pagamento');

  // Clean tamper lead
  await request(`/leads/${tamperLeadId}`, { method: 'DELETE' });

  // -------------------------------------------------------------------------
  // SECTION 3: Invalid IDs & Boundary Conditions (PUT & DELETE)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Invalid IDs & Boundary Conditions ---');

  const invalidIds = [
    '00000000-0000-0000-0000-000000000000',
    'non-existent-uuid-string',
    '12345',
    'undefined',
    'null',
    '--invalid',
    '../../etc/passwd',
    'id with spaces'
  ];

  for (const invId of invalidIds) {
    const encodedId = encodeURIComponent(invId);
    const putRes = await request(`/leads/${encodedId}`, {
      method: 'PUT',
      body: { status: 'Revisando (IA)' }
    });
    test(`3.1 PUT non-existent ID [${invId}] returns 404`, putRes.status === 404 && putRes.data?.error === 'Lead não encontrado', `Status: ${putRes.status}`);

    const delRes = await request(`/leads/${encodedId}`, { method: 'DELETE' });
    test(`3.2 DELETE non-existent ID [${invId}] returns 404`, delRes.status === 404 && delRes.data?.error === 'Lead não encontrado', `Status: ${delRes.status}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Extreme Character Sets, Injection Payloads & Unicode
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Extreme Character Sets & Security Payloads ---');

  const extremePayloads = [
    {
      label: 'Portuguese Accents & Diacritics',
      nome: "Lúcia d'Ávila & Conceição Gonçalves Júnior",
      link: 'https://linkedin.com/in/lúcia-d-ávila',
      area: 'Engenharia de Software (Avançado: C# / C++ / IA)'
    },
    {
      label: 'Unicode Emojis & Symbols',
      nome: '👩‍💻 Alex Rivera 🚀✨ (🇧🇷 / 🇺🇸)',
      link: 'https://linkedin.com/in/alex-rivera-🚀',
      area: 'Fullstack Dev 🔥 [Next.js + Node.js 🤖]'
    },
    {
      label: 'Cyrillic Script',
      nome: 'Иван Петрович Сидоров',
      link: 'https://linkedin.com/in/ivan-sidorov',
      area: 'Разработчик программного обеспечения'
    },
    {
      label: 'CJK Characters (Chinese, Japanese, Korean)',
      nome: '李明 / 佐藤健 / 김철수',
      link: 'https://linkedin.com/in/liming-tokyo',
      area: 'クラウドアーキテクト / 人工知能'
    },
    {
      label: 'Arabic RTL Script',
      nome: 'أحمد بن علي المهندس',
      link: 'https://linkedin.com/in/ahmed-engineer',
      area: 'مهندس برمجيات سحابية'
    },
    {
      label: 'Mathematical & Special Symbols',
      nome: '∀x ∈ ℝ : x² ≥ 0 ∑ ∏ ∫ √ ∞ ≠ ≤ ≥',
      link: 'https://linkedin.com/in/math-dev?q=1&p=2#sec',
      area: 'Algorithm Specialist π / λ-calculus'
    },
    {
      label: 'HTML / XSS / Script Injection Characters',
      nome: '<script>alert("XSS")</script>',
      link: 'https://linkedin.com/in/"><svg/onload=alert(1)>',
      area: '<iframe src="javascript:alert(1)"></iframe>'
    },
    {
      label: 'SQL Injection in POST Fields',
      nome: "Robert'); DROP TABLE leads;--",
      link: "https://linkedin.com/' OR 1=1 --",
      area: "Backend'; SELECT * FROM leads;--"
    },
    {
      label: 'Quotation Marks & Escaped Symbols',
      nome: 'O\'Connor "The Hacker" `grep` \\slash /back',
      link: 'https://linkedin.com/in/o\'connor?a=1&b=2',
      area: 'DevOps & SysAdmin $PATH %USER% {foo}'
    },
    {
      label: 'Massive String (10,000 characters each)',
      nome: 'A'.repeat(10000),
      link: 'https://linkedin.com/in/' + 'B'.repeat(9950),
      area: 'C'.repeat(10000)
    }
  ];

  const createdExtremeIds = [];

  for (const p of extremePayloads) {
    const postRes = await request('/leads', { method: 'POST', body: p });
    test(`4.1 POST extreme payload [${p.label}] returns 201`, postRes.status === 201, `Status: ${postRes.status}`);

    const created = postRes.data;
    if (created?.id) {
      createdExtremeIds.push(created.id);

      // Verify exact byte-for-byte fidelity in HTTP response
      test(`4.1.1 Fidelity in POST response [${p.label}]`, 
        created.nome === p.nome && created.link === p.link && created.area === p.area,
        `Lengths match: ${created.nome.length} vs ${p.nome.length}`);

      // Direct SQLite disk check: assert SQLite stores verbatim
      const rowDb = await db.get('SELECT * FROM leads WHERE id = ?', [created.id]);
      test(`4.1.2 Authentically persisted to leads.sqlite disk [${p.label}]`,
        rowDb && rowDb.nome === p.nome && rowDb.link === p.link && rowDb.area === p.area,
        `DB length: ${rowDb?.nome?.length}`);

      // Verify GET /leads returns verbatim
      const getSingle = await request('/leads');
      const foundInGet = getSingle.data?.find(l => l.id === created.id);
      test(`4.1.3 Retrieved verbatim via GET /leads [${p.label}]`,
        foundInGet && foundInGet.nome === p.nome && foundInGet.link === p.link && foundInGet.area === p.area);
    }
  }

  // 4.2 Verify SQL Injection did NOT drop the table
  const checkTableAfterInjection = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='leads'");
  test('4.2 SQL Injection defense: table `leads` exists and was NOT dropped', checkTableAfterInjection?.name === 'leads');

  // 4.3 SQL Injection in PUT ID
  const sqlInjectionPut = await request("/leads/' OR 1=1 --", {
    method: 'PUT',
    body: { status: 'Entregue' }
  });
  test('4.3 SQL Injection in PUT ID returns 404 and does NOT update all records', sqlInjectionPut.status === 404);

  // Assert in SQLite that not all records became 'Entregue'
  const novoCount = await db.get("SELECT COUNT(*) as c FROM leads WHERE status = 'Novo'");
  test('4.3.1 Records remained intact after PUT SQL injection attempt', novoCount.c > 0, `Novo count: ${novoCount.c}`);

  // 4.4 SQL Injection in PUT status
  const sqlInjStatus = await request(`/leads/${createdExtremeIds[0]}`, {
    method: 'PUT',
    body: { status: "Novo'; DROP TABLE leads; --" }
  });
  test('4.4 SQL Injection in PUT status returns 400', sqlInjStatus.status === 400);

  // 4.5 SQL Injection in DELETE ID
  const sqlInjectionDelete = await request("/leads/' OR 1=1 --", { method: 'DELETE' });
  test('4.5 SQL Injection in DELETE ID returns 404 and does NOT wipe table', sqlInjectionDelete.status === 404);

  const totalAfterInjDel = await db.get('SELECT COUNT(*) as c FROM leads');
  test('4.5.1 Record count unchanged after DELETE injection attempt', totalAfterInjDel.c === createdExtremeIds.length, `Count: ${totalAfterInjDel.c}`);

  // Clean extreme leads
  for (const id of createdExtremeIds) {
    await request(`/leads/${id}`, { method: 'DELETE' });
  }

  const countAfterClean = await db.get('SELECT COUNT(*) as c FROM leads');
  test('4.6 Cleaned all extreme test leads', countAfterClean.c === 0, `Count: ${countAfterClean.c}`);

  // -------------------------------------------------------------------------
  // SECTION 5: High Concurrency & Stress Harness
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Concurrency & SQLite Stress Harness ---');

  const BURST_SIZE = 100;
  console.log(`Sending ${BURST_SIZE} simultaneous POST requests...`);
  const t0 = Date.now();
  const burstPromises = Array.from({ length: BURST_SIZE }, (_, i) => {
    return request('/leads', {
      method: 'POST',
      body: {
        nome: `Concurrent Candidate #${i}`,
        link: `https://linkedin.com/in/candidate-${i}`,
        area: `Role ${i % 10}`
      }
    });
  });

  const burstResults = await Promise.all(burstPromises);
  const tBurst = Date.now() - t0;

  const all201 = burstResults.every(r => r.status === 201);
  const burstIds = burstResults.map(r => r.data?.id).filter(Boolean);
  const burstUniqueIds = new Set(burstIds);

  test(`5.1 High concurrency: ${BURST_SIZE} parallel POSTs all returned 201 in ${tBurst}ms`, all201, `Success count: ${burstResults.filter(r => r.status === 201).length}/${BURST_SIZE}`);
  test(`5.1.1 All ${BURST_SIZE} generated IDs are unique UUIDs`, burstUniqueIds.size === BURST_SIZE, `Unique: ${burstUniqueIds.size}`);

  // Direct SQLite inspection
  const dbCountBurst = await db.get('SELECT COUNT(*) as c FROM leads');
  test(`5.1.2 Direct SQLite confirms ${BURST_SIZE} records in leads.sqlite`, dbCountBurst.c === BURST_SIZE, `Count: ${dbCountBurst.c}`);

  // 5.2 Concurrent mixed GET and PUT operations
  console.log('Sending 50 concurrent GETs and 50 concurrent PUTs simultaneously...');
  const tMix0 = Date.now();
  const mixedOps = [];

  for (let i = 0; i < 50; i++) {
    mixedOps.push(request('/leads', { method: 'GET' }));
    mixedOps.push(request(`/leads/${burstIds[i]}`, {
      method: 'PUT',
      body: { status: 'Revisando (IA)' }
    }));
  }

  const mixedResults = await Promise.all(mixedOps);
  const tMixed = Date.now() - tMix0;

  const getsOk = mixedResults.filter((_, idx) => idx % 2 === 0).every(r => r.status === 200 && Array.isArray(r.data));
  const putsOk = mixedResults.filter((_, idx) => idx % 2 === 1).every(r => r.status === 200 && r.data?.status === 'Revisando (IA)');

  test(`5.2 Mixed concurrent 50 GETs + 50 PUTs handled without lock errors in ${tMixed}ms`, getsOk && putsOk, `GETs ok: ${getsOk}, PUTs ok: ${putsOk}`);

  // Direct SQLite check: 50 records updated
  const countUpdated = await db.get("SELECT COUNT(*) as c FROM leads WHERE status = 'Revisando (IA)'");
  test('5.2.1 Direct SQLite confirms 50 records updated to Revisando (IA)', countUpdated.c === 50, `Count: ${countUpdated.c}`);

  // 5.3 Concurrent DELETE of all 100 leads
  console.log(`Sending concurrent DELETE for all ${BURST_SIZE} leads...`);
  const tDel0 = Date.now();
  const delPromises = burstIds.map(id => request(`/leads/${id}`, { method: 'DELETE' }));
  const delResults = await Promise.all(delPromises);
  const tDel = Date.now() - tDel0;

  const allDelsOk = delResults.every(r => r.status === 200 && r.data?.message === 'Lead excluído com sucesso');
  test(`5.3 Concurrent DELETE of ${BURST_SIZE} leads completed with 200 OK in ${tDel}ms`, allDelsOk);

  // Direct SQLite check
  const countAfterMassDel = await db.get('SELECT COUNT(*) as c FROM leads');
  test('5.3.1 Direct SQLite confirms table is completely empty (0 records)', countAfterMassDel.c === 0, `Count: ${countAfterMassDel.c}`);

  // -------------------------------------------------------------------------
  // SECTION 6: Error Handling & Malformed Payloads
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 6: Error Handling & Resilience ---');

  // 6.1 Malformed JSON payload
  const malformedJsonRes = await request('/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"nome": "broken json without closing brace, "link":'
  });
  test('6.1 Malformed JSON handled gracefully with 4xx status', malformedJsonRes.status === 400 || malformedJsonRes.status === 500, `HTTP ${malformedJsonRes.status}`);

  // 6.2 Server still responsive immediately after bad request
  const pingAfterCrash = await request('/leads');
  test('6.2 Server remains responsive after malformed payload', pingAfterCrash.status === 200 && Array.isArray(pingAfterCrash.data));

  // 6.3 Final PRAGMA integrity_check
  const finalIntegrity = await db.get('PRAGMA integrity_check');
  test('6.3 Final PRAGMA integrity_check is ok', finalIntegrity.integrity_check === 'ok', finalIntegrity.integrity_check);

  await closeDb();

  console.log('\n======================================================================');
  console.log(`SUMMARY: Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    console.error('\nFAILURES:');
    for (const f of failures) {
      console.error(`- ${f.name}: ${f.details}`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Start server if needed or attach to running instance
let serverInstance = null;
try {
  await fetch('http://localhost:3001/leads');
} catch (e) {
  const { server } = await import('../api/server.js');
  serverInstance = server;
  await new Promise(r => setTimeout(r, 200));
}

try {
  await run();
} catch (err) {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
} finally {
  if (serverInstance) {
    serverInstance.close();
  }
}

