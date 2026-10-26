# Test Infrastructure & Methodology — Revisão Express MVP

This document specifies the test architecture, test tier distribution, requirements traceability matrix, and execution procedures for the **Revisão Express de Currículo e LinkedIn MVP** (`proud-borg`).

---

## 1. Test Architecture Overview

The test architecture is designed around an **Opaque-Box Requirement-Driven** methodology utilizing **Vitest** in conjunction with **@testing-library/react** and **jsdom**, fully integrated with Vite 6, TypeScript 5.7, and React 18.

### Test Directory Layout

```
proud-borg/
├── src/__tests__/                       # Unit & component integration tests
│   ├── AdminPage.test.tsx
│   ├── LandingPage.test.tsx
│   ├── LocalStorageRepository.test.ts
│   ├── clipboardService.test.ts
│   ├── leadService.test.ts
│   ├── validators.test.ts
│   └── whatsappService.test.ts
    └── tests/
        └── e2e/                             # End-to-End Requirement Test Suite (Tiers 1–5)
            ├── tier1_build_smoke.test.ts
            ├── tier2_landing_whatsapp.test.ts
            ├── tier2_admin_table.test.ts
            ├── tier3_validation_edge_cases.test.ts
            ├── tier4_resilience_offline.test.ts
            ├── tier5_adversarial_m1.test.ts
            └── tier5_adversarial_admin_storage.test.ts
```

---

## 2. The 4-Tier Test Methodology

The E2E suite implements a structured 4-tier verification hierarchy:

### Tier 1: Static & Build Smoke Tests (`tier1_build_smoke.test.ts`)
- **Objective:** Verify production bundling, TypeScript compilation, asset integrity, and critical project configuration.
- **Coverage:**
  1. `npm.cmd run build` executes without errors and emits production `dist/` directory.
  2. `dist/index.html` exists and contains correct title, meta tags, and `#root` mounting node.
  3. Bundled JavaScript and CSS assets exist and have healthy production sizes.
  4. Configuration files (`package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`) exist and parse.
  5. TypeScript project references typecheck cleanly via `npx.cmd tsc -b`.

### Tier 2: Feature Coverage Tests (`tier2_landing_whatsapp.test.ts` & `tier2_admin_table.test.ts`)
- **Objective:** Deep requirement-driven validation of core user journeys with at least 5 test cases per feature.
- **Features Tested:**
  1. **Landing Page Hero Section:**
     - Exact headline text verification: *"Seu currículo não passa nos filtros dos recrutadores? Nós reescrevemos para você ser chamado para entrevistas"*.
     - Subtitle emphasizing delivery in hours (*"em poucas horas"*).
     - Tagline pill badge rendering.
     - Checklist proof bullets (ATS, LinkedIn, WhatsApp).
     - Dark navy styling visual token validation.
  2. **Como Funciona (3 Steps):**
     - Section headline verification.
     - Presence of exactly 3 sequential numbered steps (1, 2, 3).
     - Step 1: *"Preencha o formulário"*.
     - Step 2: *"Combine detalhes e pagamento no WhatsApp"*.
     - Step 3: *"Receba seu perfil otimizado em poucas horas"*.
  3. **Lead Capture Form & Validation:**
     - 3 required fields (*Nome Completo*, *Link do LinkedIn ou Currículo*, *Área de Atuação e Cargo Desejado*).
     - Blank submission blocks dispatch and shows 3 errors.
     - Minimum length enforcement on name (>= 3 chars).
     - URL validation on profile/CV link.
     - Minimum length enforcement on area/cargo (>= 2 chars).
     - CTA submit button with text *"Solicitar Análise via WhatsApp"*.
  4. **WhatsApp URL Constructor & Redirection:**
     - Base URL structure: `https://wa.me/<phone>?text=...`.
     - Exact template: `"Olá, acabei de preencher o formulário. Meu nome é [Nome], sou da área de [Área] e quero a revisão express."`.
     - Full percent encoding (`encodeURIComponent`) for spaces, commas, and accents.
     - Submission persists lead to repository.
     - Success banner with direct fallback WhatsApp link.
  5. **Admin Panel (`/admin`) Data Grid:**
     - 5 mandatory column headers (*Data/Hora*, *Nome*, *Link (LinkedIn / CV)*, *Área / Cargo*, *Status*).
     - External link rendering with `target="_blank"` and `rel="noopener noreferrer"`.
  6. **Status Dropdown Lifecycle & Persistence:**
     - Dropdown contains all 4 mandatory statuses: `"Novo"`, `"Aguardando Pagamento"`, `"Revisando (IA)"`, `"Entregue"`.
     - Status transition to `"Aguardando Pagamento"` persists.
     - Status transition to `"Revisando (IA)"` persists.
     - Status transition to `"Entregue"` persists.
     - Visual badge updates and reflects corresponding colors.
  7. **"Copiar Contexto" ChatGPT Prompt Generation:**
     - Button present in each row.
     - Prompt includes candidate Nome.
     - Prompt includes candidate Link.
     - Prompt includes candidate Área/Cargo.
     - Structured ATS, STAR, and Action Plan guidelines.
     - Clipboard copy execution and feedback badge.

### Tier 3: Boundary & Edge Cases (`tier3_validation_edge_cases.test.ts`)
- **Objective:** Adversarial testing, encoding integrity, and corner cases.
- **Coverage:**
  1. Pure whitespace inputs rejected.
  2. Trimming leading/trailing spaces on submit.
  3. Granular error highlighting for partial submissions.
  4. Dynamic clearing of errors upon typing valid input.
  5. Invalid URL formats rejected (missing domains, spaces, invalid protocols).
  6. Normalization of URLs missing `https://` prefix.
  7. Support for Google Drive, OneDrive, and GitHub raw URLs.
  8. Portuguese diacritics encoding (`ç`, `ã`, `é`, `ó`, `ú`, `ê`, `í`).
  9. Symbols `&` and `#` encoded as `%26` and `%23`.
  10. Plus sign `+` encoded as `%2B`.
  11. Punctuation (apostrophes, hyphens, slashes) preserved.
  12. Round-trip decode/encode fidelity: `decodeURIComponent(url) === rawMessage`.
  13. Admin empty state rendering when leads count is 0.
  14. Friendly empty state message and Landing Page CTA button.
  15. Admin summary counters handling zero counts safely.
  16. Empty search filter result with *"Limpar filtros"* restore action.

### Tier 4: Real-World Scenarios (`tier4_resilience_offline.test.ts`)
- **Objective:** Full lifecycle simulation and zero-configuration offline resilience.
- **Coverage:**
  1. Complete candidate-to-operator lifecycle: Form Submission ➔ WhatsApp Generation ➔ Lead Registration ➔ Admin Table Retrieval ➔ Status Progression (Novo ➔ Aguardando Pagamento ➔ Revisando (IA) ➔ Entregue) ➔ AI Context Copy.
  2. LocalStorage repository fallback when zero cloud backend variables are present.
  3. Pre-seeding of 5 realistic tech candidate leads covering all 4 status states.
  4. Automatic healing and self-recovery when encountering corrupted localStorage JSON.
  5. Synchronization and persistence across independent repository instances.

### Tier 5: Adversarial Stress & Hardening Tests (`tier5_adversarial_m1.test.ts` & `tier5_adversarial_admin_storage.test.ts`)
- **Objective:** Maximum stress and boundary hardening across encoding, concurrency, scale, and storage failures.
- **Coverage:**
  1. Complete Portuguese diacritics set (lowercase and uppercase) stress encoding.
  2. Prevention of URL query parameter and hash injection (`&`, `#`, `?`, `=`).
  3. Handling of 5,000+ character inputs without parameter truncation or buffer crash.
  4. International emojis and symbols round-trip preservation.
  5. Hardened URL validation (rejecting email strings via `!parsed.username` and enforcing valid alphanumeric hostname labels).
  6. Phone normalization with safe fallback to default phone on non-digit strings.
  7. Rapid sequential status toggling across all 4 statuses with instant persistence.
  8. Concurrent status transitions across multiple leads (12+ leads) without race conditions.
  9. Malformed and non-array JSON corruption self-healing in localStorage.
  10. In-memory cache fallback when localStorage is disabled or throws QuotaExceededError.
  11. ChatGPT prompt generation with extreme string lengths and XSS payloads.
  12. Table rendering and reactive filtering at scale (50+ leads rendered under 1s).

---

## 3. Environment & Execution Instructions

### Windows Environment Rule
On Windows PowerShell, npm scripts must always be invoked with `.cmd`:

```powershell
# Run entire test suite (Unit + E2E)
npm.cmd test

# Run only E2E test suites (Tiers 1–5)
npx.cmd vitest run tests/e2e

# Run specific E2E test tier
npx.cmd vitest run tests/e2e/tier1_build_smoke.test.ts
npx.cmd vitest run tests/e2e/tier2_landing_whatsapp.test.ts
npx.cmd vitest run tests/e2e/tier2_admin_table.test.ts
npx.cmd vitest run tests/e2e/tier3_validation_edge_cases.test.ts
npx.cmd vitest run tests/e2e/tier4_resilience_offline.test.ts
npx.cmd vitest run tests/e2e/tier5_adversarial_m1.test.ts
npx.cmd vitest run tests/e2e/tier5_adversarial_admin_storage.test.ts

# Production build verification
npm.cmd run build

# TypeScript compilation check
npx.cmd tsc -b
```

---

## 4. Test Verification Status

- **Total Test Files:** 14 (7 E2E + 7 Unit/Component)
- **Total Tests:** 133
- **Passing:** 133 (100%)
- **Failing:** 0
- **Build Status:** Clean compilation (`npm.cmd run build` exits 0)
- **Bundle Output:** `dist/` verified with HTML, CSS, and JS bundles
