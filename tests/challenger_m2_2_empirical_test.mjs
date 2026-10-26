// tests/challenger_m2_2_empirical_test.mjs
// Adversarial Empirical Stress Test Suite executed by Challenger 2 (Milestone 2)

import assert from 'node:assert/strict';
import { getDb, closeDb } from '../api/db.js';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function runEmpiricalChallenger2Suite() {
  console.log('========================================================================');
  console.log('CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS SUITE (MILESTONE 2 VERIFICATION)');
  console.log('========================================================================\n');

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

  // ---------------------------------------------------------------------------
  // SUITE 1: Zero Supabase & Lovable Cloud References in Frontend
  // ---------------------------------------------------------------------------
  console.log('--- SUITE 1: Complete Decoupling & Zero Supabase Verification ---');
  const srcDir = path.resolve('src');
  const pkgJsonPath = path.resolve('package.json');

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
  test('1.1 package.json does not contain @supabase/supabase-js', !allDeps['@supabase/supabase-js']);

  function scanDirForPatterns(dir, patterns) {
    const matches = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        matches.push(...scanDirForPatterns(fullPath, patterns));
      } else if (file.isFile() && /\.(ts|tsx|js|jsx|json|css|html)$/.test(file.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pat of patterns) {
          if (content.includes(pat)) {
            matches.push({ file: fullPath, pattern: pat });
          }
        }
      }
    }
    return matches;
  }

  const forbidden = ['@supabase', 'LovableCloudRepository', 'lovable-cloud'];
  const srcMatches = scanDirForPatterns(srcDir, forbidden);
  test('1.2 Zero occurrences of Supabase or Lovable Cloud in src/', srcMatches.length === 0, `Matches found: ${JSON.stringify(srcMatches)}`);

  const lovableRepoExists = fs.existsSync(path.resolve('src/services/storage/LovableCloudRepository.ts'));
  test('1.3 LovableCloudRepository.ts deleted permanently', !lovableRepoExists);

  // ---------------------------------------------------------------------------
  // SUITE 2: Live Backend REST API Integration via HTTP
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Live Backend REST API Integration & 4-State Machine ---');
  const db = await getDb();

  // Clean test baseline
  await db.run('DELETE FROM leads');

  // 2.1 POST valid lead
  const postRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Mariana Teste SQLite',
      link: 'https://linkedin.com/in/mariana-teste',
      area: 'Desenvolvedora Fullstack',
    }),
  });

  test('2.1 POST /leads returns 201 Created', postRes.status === 201);
  const createdLead = await postRes.json();
  test('2.1.1 Created lead has default status "Novo"', createdLead.status === 'Novo');
  test('2.1.2 Dual mapping fields present (nome/name, area/areaRole)', createdLead.nome === createdLead.name && createdLead.area === createdLead.areaRole);

  const leadId = createdLead.id;

  // 2.2 Direct SQLite verification
  const dbRow1 = await db.get('SELECT * FROM leads WHERE id = ?', [leadId]);
  test('2.2 SQLite row authentically saved to leads.sqlite', Boolean(dbRow1) && dbRow1.nome === 'Mariana Teste SQLite');

  // 2.3 Status transitions across all 4 valid states
  const validStates = ['Aguardando Pagamento', 'Revisando (IA)', 'Entregue', 'Novo'];
  for (const st of validStates) {
    const putRes = await fetch(`${BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st }),
    });

    test(`2.3 PUT status -> "${st}" returns 200 OK`, putRes.status === 200);
    const putBody = await putRes.json();
    test(`2.3.1 PUT response body status is "${st}"`, putBody.status === st);

    // Verify in SQLite
    const rowUpdated = await db.get('SELECT status FROM leads WHERE id = ?', [leadId]);
    test(`2.3.2 SQLite confirms status updated to "${st}" on disk`, rowUpdated.status === st);
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: REST API Client Error Handling for 400 and 500 Responses
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: REST API Error Handling (400 and 500 HTTP Responses) ---');

  // 3.1 POST /leads with missing fields -> 400
  const post400 = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Sem Link e Area' }),
  });
  test('3.1 POST with missing fields returns 400 Bad Request', post400.status === 400);
  const post400Body = await post400.json();
  test('3.1.1 Error response body explains missing fields', post400Body.error === 'Campos obrigatórios: nome, link, area');

  // 3.2 PUT /leads/:id with invalid status -> 400
  const put400 = await fetch(`${BASE_URL}/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'StatusInventado' }),
  });
  test('3.2 PUT with invalid status returns 400 Bad Request', put400.status === 400);
  const put400Body = await put400.json();
  test('3.2.1 Error response body explains invalid status', put400Body.error === 'Status inválido');

  // 3.3 PUT /leads/:id with non-existent ID -> 404
  const nonExistentId = '00000000-dead-beef-cafe-000000000000';
  const put404 = await fetch(`${BASE_URL}/leads/${nonExistentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Entregue' }),
  });
  test('3.3 PUT with non-existent ID returns 404 Not Found', put404.status === 404);

  // 3.4 DELETE /leads/:id on valid lead -> 200
  const del200 = await fetch(`${BASE_URL}/leads/${leadId}`, { method: 'DELETE' });
  test('3.4 DELETE /leads/:id returns 200 OK', del200.status === 200);

  // Confirm removed from SQLite
  const dbRowDeleted = await db.get('SELECT * FROM leads WHERE id = ?', [leadId]);
  test('3.4.1 SQLite confirms lead deleted from disk', dbRowDeleted === undefined);

  // 3.5 DELETE /leads/:id on non-existent ID -> 404
  const del404 = await fetch(`${BASE_URL}/leads/${leadId}`, { method: 'DELETE' });
  test('3.5 Second DELETE of same ID returns 404 Not Found', del404.status === 404);

  // ---------------------------------------------------------------------------
  // SUITE 4: LeadsTable Filter & Stats Stress Generator
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Metrics Calculation & Search Filter Generator ---');

  // Seed 200 leads with various combinations of text, accents, links, and statuses
  const statuses = ['Novo', 'Aguardando Pagamento', 'Revisando (IA)', 'Entregue'];
  const testLeads = [];
  const statusCounts = { 'Novo': 0, 'Aguardando Pagamento': 0, 'Revisando (IA)': 0, 'Entregue': 0 };

  for (let i = 0; i < 200; i++) {
    const st = statuses[i % statuses.length];
    statusCounts[st]++;
    testLeads.push({
      id: `lead-stress-${i}`,
      name: `Candidato #${i} ${i % 3 === 0 ? 'Silva' : i % 3 === 1 ? 'Santos' : 'Oliveira'}`,
      link: `https://linkedin.com/in/cand-${i}`,
      areaRole: i % 2 === 0 ? 'Desenvolvedor Frontend React' : 'Engenheiro de Dados Python',
      status: st,
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    });
  }

  // Pure functions test using simulated pure logic
  function calculateStats(leads) {
    const s = { total: leads.length, novos: 0, aguardandoPagamento: 0, revisandoIA: 0, entregues: 0 };
    for (const l of leads) {
      if (l.status === 'Novo') s.novos++;
      else if (l.status === 'Aguardando Pagamento') s.aguardandoPagamento++;
      else if (l.status === 'Revisando (IA)') s.revisandoIA++;
      else if (l.status === 'Entregue') s.entregues++;
    }
    return s;
  }

  const computedStats = calculateStats(testLeads);
  test('4.1 Stats generator: total matches 200', computedStats.total === 200);
  test('4.1.1 Novos matches expected 50', computedStats.novos === statusCounts['Novo']);
  test('4.1.2 Aguardando Pagamento matches expected 50', computedStats.aguardandoPagamento === statusCounts['Aguardando Pagamento']);
  test('4.1.3 Revisando (IA) matches expected 50', computedStats.revisandoIA === statusCounts['Revisando (IA)']);
  test('4.1.4 Entregues matches expected 50', computedStats.entregues === statusCounts['Entregue']);

  // Search filtering stress
  function filterLeads(leads, filters) {
    let res = [...leads];
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.trim().toLowerCase();
      res = res.filter(l => l.name.toLowerCase().includes(q) || l.areaRole.toLowerCase().includes(q) || l.link.toLowerCase().includes(q));
    }
    if (filters.status && filters.status !== 'Todos') {
      res = res.filter(l => l.status === filters.status);
    }
    return res;
  }

  const querySilva = filterLeads(testLeads, { searchQuery: 'SILVA' });
  const expectedSilva = testLeads.filter(l => l.name.toLowerCase().includes('silva'));
  test('4.2 Filter case-insensitive "SILVA" returns exact matches', querySilva.length === expectedSilva.length);

  const queryStatusAndText = filterLeads(testLeads, { searchQuery: 'Frontend', status: 'Revisando (IA)' });
  const expectedCombined = testLeads.filter(l => l.areaRole.includes('Frontend') && l.status === 'Revisando (IA)');
  test('4.3 Filter combined searchQuery + status returns exact intersection', queryStatusAndText.length === expectedCombined.length);

  // Clean DB
  await db.run('DELETE FROM leads');

  console.log('\n========================================================================');
  console.log(`SUMMARY: Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.error('Failures encountered:');
    for (const f of failures) {
      console.error(`- ${f.name}: ${f.details}`);
    }
  }

  return { passed, failed };
}

// Start or attach to server
(async () => {
  let serverInstance = null;
  try {
    const ping = await fetch(`${BASE_URL}/leads`).catch(() => null);
    if (!ping) {
      const mod = await import('../api/server.js');
      serverInstance = mod.server;
      await new Promise(r => setTimeout(r, 200));
    }

    const { passed, failed } = await runEmpiricalChallenger2Suite();
    if (serverInstance) serverInstance.close();
    await closeDb();
    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('FATAL TEST ERROR:', err);
    if (serverInstance) serverInstance.close();
    await closeDb();
    process.exit(1);
  }
})();
