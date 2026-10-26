# Project: Revisão Express - Backend Local SQLite & Frontend Decoupling

## Architecture
- **Backend Service (`/api`)**: Lightweight Node.js Express server running on port 3001 using ES Modules.
  - `api/db.js`: Single-responsibility module managing the SQLite connection (`leads.sqlite`) with WAL mode and auto-creating table `leads`.
  - `api/routes/leads.js`: Dedicated Express Router containing REST endpoints (`GET`, `POST`, `PUT`, `DELETE /leads`).
  - `api/server.js`: Clean bootstrap module with CORS, `express.json()`, route mounting, and port 3001 listener.
- **Frontend Layer (`src/`)**: React + TypeScript application built with Vite and Tailwind CSS.
  - Completely decoupled from `@supabase/supabase-js` and Lovable Cloud.
  - `src/services/api.ts`: Dedicated HTTP fetch client connecting to `http://localhost:3001/leads` with bidirectional field normalization.
  - `src/services/leadService.ts`: Pure domain logic (stats calculation, filtering/sorting) delegating CRUD to `api.ts`.
  - Hooks (`useLeadForm`, `useLeads`) and UI components (`LeadCaptureForm`, `AdminPage`, `LeadsTable`, `StatusDropdown`, `DeleteLeadButton`).
- **Data Flow**:
  `[Browser Client / UI]` ➔ `[useLeadForm / useLeads]` ➔ `[src/services/api.ts]` ➔ `(HTTP fetch)` ➔ `[Express /api/server.js]` ➔ `[api/routes/leads.js]` ➔ `[api/db.js]` ➔ `[leads.sqlite]`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | SQLite Connection & Schema Init | `api/db.js` initializes connection to `leads.sqlite`, enables WAL mode, creates table `leads` (`id`, `nome`, `link`, `area`, `status` DEFAULT 'Novo', `data_criacao`) | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Backend REST Routes | `api/routes/leads.js` implements `GET /leads` (ordered DESC), `POST /leads` (status 201), `PUT /leads/:id` (status 200/400/404), `DELETE /leads/:id` (status 200/404) | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Express Server Bootstrap | `api/server.js` initializes Express on port 3001 with `cors()`, `express.json()`, and mounts `/leads` | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Dependency Management & Windows Scripts | Add `express`, `cors`, `sqlite`, `sqlite3` to `package.json`, configure `"allowScripts": { "sqlite3": true }` for npm 12 on Windows | M1 | Survey Explorer 1 & 3 |
| F5 | Complete Lovable / Supabase Removal | Remove `@supabase/supabase-js` from `package.json`, delete `LovableCloudRepository.ts`, clean `env.ts` and `storageFactory.ts` | M2 | ORIGINAL_REQUEST §R2 |
| F6 | Modular REST API Client | Implement `src/services/api.ts` with `getAll()`, `create(dto)`, `updateStatus(id, status)`, and `delete(id)` with bidirectional field normalization | M2 | ORIGINAL_REQUEST §R2 |
| F7 | Hook & Service Modernization | Update `useLeadForm`, `useLeads`, and `leadService` to consume `src/services/api.ts` with optimistic UI and rollback | M2 | ORIGINAL_REQUEST §R2 |
| F8 | WhatsApp Redirection Flow Preservation | Preserve form validation and WhatsApp URL generation/redirect in `useLeadForm` and `LeadCaptureForm` | M2 | ORIGINAL_REQUEST §R2 |
| F9 | Admin Protection & UI Flow Preservation | Preserve "admin123" gate in `AdminLogin`, metrics cards, status dropdown with 4 valid states, and deletion modal confirmation | M2 | ORIGINAL_REQUEST §R2 |
| F10 | Frontend Clean Build Verification | `npm.cmd run build` passes with exit code 0, 0 TypeScript errors, and 0 orphan Supabase references | M2 | ORIGINAL_REQUEST §R2, §Verification |
| F11 | Execution Documentation (`README_LOCAL.md`) | Provide step-by-step instructions for Windows PowerShell using `npm.cmd` to install dependencies, run backend and frontend concurrently | M3 | ORIGINAL_REQUEST §R4 |
| F12 | Backend Integration Test Suite | Automated integration tests (`tests/e2e/tier6_backend_api.test.ts`) validating GET, POST, PUT, DELETE with HTTP status codes and real disk persistence in `leads.sqlite` | M4 | ORIGINAL_REQUEST §Verification |
| F13 | Full Test Suite Pass & Adversarial Hardening | Run all unit, component, and E2E tests (`npm.cmd test`), verify 100% pass, and verify edge cases | M4 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Local Node.js + SQLite (/api) | Implement `api/db.js`, `api/routes/leads.js`, `api/server.js`, and install dependencies (`express`, `cors`, `sqlite`, `sqlite3`) with `"allowScripts": { "sqlite3": true }` | none | DONE |
| M2 | Frontend Refactor & Decoupling | Remove `@supabase/supabase-js`, delete `LovableCloudRepository.ts`, create `src/services/api.ts`, update `env.ts`, `leadService.ts`, `useLeadForm.ts`, `useLeads.ts`, `AdminHeader.tsx` | M1 (contract defined) | DONE |
| M3 | Documentation & Local Setup Guide | Create `README_LOCAL.md` with Windows PowerShell `npm.cmd` commands for backend (port 3001) and frontend (port 5173) execution | M1, M2 | DONE |
| M4 | E2E Integration Testing & Full Verification | Implement `tests/e2e/tier6_backend_api.test.ts` with real HTTP requests and SQLite disk validation, run `npm.cmd test` (100% pass), and `npm.cmd run build` | M1, M2, M3 | DONE |

## Interface Contracts

### Backend REST API (`http://localhost:3001/leads`) ↔ Frontend API Client (`src/services/api.ts`)

#### Endpoints
1. `GET /leads`
   - Returns: `200 OK`
   - Body: Array of Lead objects ordered by `data_criacao DESC`
   - Schema per item:
     ```json
     {
       "id": "uuid-string",
       "nome": "string",
       "name": "string",
       "link": "string",
       "area": "string",
       "areaRole": "string",
       "status": "Novo | Aguardando Pagamento | Revisando (IA) | Entregue",
       "data_criacao": "ISO-8601 string",
       "createdAt": "ISO-8601 string"
     }
     ```

2. `POST /leads`
   - Request Body:
     ```json
     {
       "nome": "string (required)",
       "link": "string (required)",
       "area": "string (required)"
     }
     ```
     *(Also accepts `{ name, link, areaRole }` for backward compatibility)*
   - Validations:
     - Missing or empty `nome`, `link`, or `area` ➔ `400 Bad Request` with `{ "error": "Campos obrigatórios: nome, link, area" }`
   - Returns: `201 Created` with created Lead object (`id` auto-generated, `status = 'Novo'`, `data_criacao = ISO timestamp`).

3. `PUT /leads/:id`
   - Request Body:
     ```json
     {
       "status": "Novo | Aguardando Pagamento | Revisando (IA) | Entregue"
     }
     ```
   - Validations:
     - Invalid status value ➔ `400 Bad Request` with `{ "error": "Status inválido" }`
     - Non-existent `id` ➔ `404 Not Found` with `{ "error": "Lead não encontrado" }`
   - Returns: `200 OK` with updated Lead object.

4. `DELETE /leads/:id`
   - Validations:
     - Non-existent `id` ➔ `404 Not Found` with `{ "error": "Lead não encontrado" }`
   - Returns: `200 OK` with `{ "message": "Lead excluído com sucesso", "id": "uuid-string" }`.

#### Frontend Client Signatures (`src/services/api.ts`)
```typescript
export function getAll(): Promise<Lead[]>;
export function create(dto: CreateLeadDTO): Promise<Lead>;
export function updateStatus(id: string, status: LeadStatus): Promise<Lead>;
export function deleteLead(id: string): Promise<boolean>;
export { deleteLead as delete };
```

## Code Layout
- `api/db.js` — Exclusive ownership: M1 Worker
- `api/routes/leads.js` — Exclusive ownership: M1 Worker
- `api/server.js` — Exclusive ownership: M1 Worker
- `package.json` — Modified by M1 Worker (dependencies) and M2 Worker (uninstall Supabase)
- `src/services/api.ts` — Exclusive ownership: M2 Worker
- `src/config/env.ts` — Exclusive ownership: M2 Worker
- `src/services/leadService.ts` — Exclusive ownership: M2 Worker
- `src/hooks/useLeadForm.ts` — Exclusive ownership: M2 Worker
- `src/hooks/useLeads.ts` — Exclusive ownership: M2 Worker
- `src/components/admin/AdminHeader.tsx` — Exclusive ownership: M2 Worker
- `src/services/storage/LovableCloudRepository.ts` — Deleted by M2 Worker
- `README_LOCAL.md` — Exclusive ownership: M3 Worker
- `tests/e2e/tier6_backend_api.test.ts` — Exclusive ownership: M4 Worker / Test Writer
