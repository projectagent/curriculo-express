# Guia de Execução Local — Revisão Express (Node.js + SQLite + React)

Este documento fornece as instruções oficiais, completas e práticas para configurar, executar, testar e operar a aplicação **Revisão Express de Currículo e LinkedIn** em ambiente local, com persistência dedicada em **Node.js + Express + SQLite (`leads.sqlite`)** e frontend desacoplado em **React (Vite + TypeScript)**.

---

## 1. Pré-Requisitos do Sistema

Antes de iniciar, certifique-se de que sua máquina possui as seguintes versões instaladas:

| Ferramenta | Versão Recomendada | Versão Mínima | Verificação no Terminal |
|------------|-------------------|---------------|-------------------------|
| **Node.js** | v24.x ou v20.x LTS | v20.0.0       | `node -v`               |
| **npm**     | 10.x ou 12.x+     | 10.0.0        | `npm.cmd -v`            |

> **Nota sobre o sistema operacional:** As instruções e exemplos abaixo foram testados e validados no Windows 11 / Windows 10 utilizando o **Windows PowerShell**.

---

## 2. ⚠️ Aviso Crucial: Windows PowerShell e a Política de Execução (`npm.cmd`)

No Windows PowerShell, a política padrão de execução de scripts do sistema (`ExecutionPolicy`) geralmente está configurada como `Restricted` ou `RemoteSigned`. Isso faz com que a invocação direta do comando `npm` tente executar o arquivo de script `C:\Program Files\nodejs\npm.ps1`, resultando no seguinte erro de segurança:

```text
npm : O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado porque a
execução de scripts foi desabilitada neste sistema.
+ CategoryInfo : ErrodeSegurança: (:) [], PSSecurityException
+ FullyQualifiedErrorId : UnauthorizedAccess
```

### Por que usar `npm.cmd` e `npx.cmd`?
Para contornar essa restrição sem a necessidade de alterar as permissões de segurança globais do Windows ou exigir privilégios de Administrador, **todos os comandos no Windows PowerShell devem utilizar explicitamente a extensão `.cmd`**:

- Em vez de `npm install`, utilize: **`npm.cmd install`**
- Em vez de `npm run dev`, utilize: **`npm.cmd run dev`**
- Em vez de `npm test`, utilize: **`npm.cmd test`**
- Em vez de `npm run build`, utilize: **`npm.cmd run build`**
- Em vez de `npx vitest`, utilize: **`npx.cmd vitest`**

---

## 3. Dependências do Backend e Configuração do `package.json`

O backend local foi construído com arquitetura modular enxuta e utiliza quatro bibliotecas fundamentais:

- **`express`**: Framework HTTP minimalista para fornecimento da API REST (`/leads`).
- **`cors`**: Middleware para habilitar Cross-Origin Resource Sharing entre a API (porta 3001) e o frontend Vite (porta 5173).
- **`sqlite3`**: Driver nativo de banco de dados para comunicação direta com o motor SQLite em disco.
- **`sqlite`**: Wrapper moderno baseado em Promises para simplificar operações assíncronas com async/await no SQLite.

### Configuração de `allowScripts` para o npm 12+
Nas versões recentes do npm (como npm 12), scripts de ciclo de vida de compilação de binários nativos (`preinstall`, `install`, `postinstall`) são bloqueados por padrão por medidas de segurança. Para permitir que o `sqlite3` baixe ou compile seus binários pré-construídos para Windows sem intervenção manual, o `package.json` possui a seguinte declaração explícita:

```json
"allowScripts": {
  "sqlite3": true
}
```

Isso garante uma instalação limpa, estável e livre de falhas ao executar `npm.cmd install`.

---

## 4. Execução Dual em Terminais Paralelos

Para operar a aplicação localmente com persistência em tempo real, execute o backend e o frontend simultaneamente em duas janelas distintas do Windows PowerShell no diretório raiz do projeto.

### 4.1 Instalação Inicial de Dependências (executar uma única vez)
Abra o Windows PowerShell na raiz do projeto e instale todas as dependências:
```powershell
npm.cmd install
```

---

### 4.2 Terminal 1 — Inicializar o Backend (API Express na porta 3001)

Abra a primeira janela do PowerShell e execute:
```powershell
node api/server.js
```
*(Alternativamente, você pode executar `npm.cmd run server`)*

**Saída esperada no console:**
```text
Server running on port 3001
```
> **Comportamento do Backend:** O servidor inicializa na porta `3001`, configura os middlewares CORS e JSON, conecta-se ao arquivo de banco de dados local `leads.sqlite` (criando-o e criando a tabela `leads` caso ainda não existam) e passa a escutar requisições em `http://localhost:3001/leads`.

---

### 4.3 Terminal 2 — Inicializar o Frontend (Vite Dev Server na porta 5173)

Abra uma segunda janela do PowerShell e execute:
```powershell
npm.cmd run dev
```

**Saída esperada no console:**
```text
  VITE v6.1.0  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Acesse a aplicação no navegador em: **`http://localhost:5173`**

---

## 5. Arquitetura da Solução e Persistência Local

A solução adota estrita separação de responsabilidades (SRP) e eliminação de duplicidades (DRY):

```text
[Navegador / Cliente React]
       │
       ▼
[src/services/api.ts]  (Cliente HTTP com fetch nativo)
       │
       ▼ (HTTP REST via porta 3001)
[api/server.js]        (Express Server, CORS, JSON Parser)
       │
       ▼
[api/routes/leads.js]  (Router: GET, POST, PUT, DELETE)
       │
       ▼
[api/db.js]            (Singleton SQLite, WAL Mode, schema init)
       │
       ▼
[leads.sqlite]         (Arquivo físico persistido na raiz do projeto)
```

### 5.1 Módulos do Backend (`/api`)

1. **`api/db.js` (Gerenciador do Banco de Dados SQLite):**
   - Cria e mantém uma conexão singleton com `leads.sqlite`.
   - Ativa o modo de escrita **WAL (`PRAGMA journal_mode = WAL;`)** e timeout de concorrência (**`PRAGMA busy_timeout = 5000;`**) para evitar bloqueios de arquivo no Windows.
   - Cria automaticamente a tabela `leads` na inicialização:
     ```sql
     CREATE TABLE IF NOT EXISTS leads (
       id TEXT PRIMARY KEY,
       nome TEXT NOT NULL,
       link TEXT NOT NULL,
       area TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'Novo',
       data_criacao TEXT NOT NULL
     );
     ```
   - Exporta funções limpas de conexão (`getDb`) e encerramento gracioso (`closeDb`).

2. **`api/routes/leads.js` (Rotas REST):**
   - **`GET /leads`**: Retorna a listagem de todos os leads ordenados por data decrescente (`data_criacao DESC`). Retorna código HTTP `200 OK`.
   - **`POST /leads`**: Cria um novo lead com ID UUID gerado via `crypto.randomUUID()`, status padrão `'Novo'` e data no padrão ISO 8601. Valida a presença obrigatória de `nome`, `link` e `area`. Retorna código HTTP `201 Created` (ou `400 Bad Request` em caso de dados ausentes).
   - **`PUT /leads/:id`**: Atualiza o status do lead. Valida os 4 estados permitidos (`Novo`, `Aguardando Pagamento`, `Revisando (IA)`, `Entregue`). Retorna `200 OK`, `400 Bad Request` se o status for inválido, ou `404 Not Found` se o lead não existir.
   - **`DELETE /leads/:id`**: Exclui permanentemente o lead do banco. Retorna `200 OK` com confirmação ou `404 Not Found` se o lead não for localizado.

3. **`api/server.js` (Ponto de Entrada):**
   - Configura a instância do Express na porta `3001` (ou variável `process.env.PORT`).
   - Registra middlewares globais (`cors()`, `express.json()`).
   - Monta o roteador `/leads` e inicia a escuta de conexões HTTP.

### 5.2 Camada Frontend Desacoplada (`src/`)
- O frontend React foi **completamente desacoplado** do Lovable Cloud e do Supabase (`@supabase/supabase-js` foi totalmente removido).
- O módulo **`src/services/api.ts`** fornece as funções utilitárias `getAll()`, `create(dto)`, `updateStatus(id, status)` e `delete(id)` utilizando a API nativa `fetch`.
- Contém normalização bidirecional de dados entre as colunas do SQLite (`nome`, `area`, `data_criacao`) e os modelos da interface (`name`, `areaRole`, `createdAt`), permitindo interoperabilidade transparente.
- Inclui mecanismo de fallback resiliente para execução de testes unitários locais sem dependência de portas abertas.

---

## 6. Funcionalidades da Aplicação e Acesso Administrativo

### 6.1 Landing Page (`http://localhost:5173/`)
- **Captura de Leads**: Formulário com validação em tempo real de Nome Completo, Link do LinkedIn/Currículo e Área de Atuação.
- **Redirecionamento WhatsApp**: Ao clicar em *"Solicitar Análise via WhatsApp"*, o lead é persistido na API local via `POST /leads` e uma nova aba é aberta direcionando para o WhatsApp com os parâmetros de mensagem pré-formatados:
  ```text
  Olá, acabei de preencher o formulário. Meu nome é [Nome], sou da área de [Área] e quero a revisão express.
  ```

### 6.2 Painel Administrativo (`http://localhost:5173/admin`)
- **Proteção por Senha**: O acesso à rota `/admin` é protegido por autenticação.
  - **Senha padrão do Administrador**: `admin123`
  - A sessão autenticada é armazenada de forma segura na sessão do navegador (`sessionStorage`).
- **Gestão de Leads**:
  - **Métricas em Tempo Real**: Cards com contagem total de leads e distribuição por status.
  - **Busca e Filtro**: Busca reativa por nome, área ou link.
  - **Atualização de Status**: Dropdown com as 4 fases do fluxo:
    1. `Novo`
    2. `Aguardando Pagamento`
    3. `Revisando (IA)`
    4. `Entregue`
  - **Exclusão com Confirmação**: Botão de exclusão com modal de confirmação de segurança antes da remoção permanente no banco.
  - **Gerador de Prompts ChatGPT**: Botão para copiar prompt estruturado com metodologia STAR/ATS para revisão com inteligência artificial.

---

## 7. Testes Automatizados e Verificação da Aplicação

### 7.1 Execução da Suíte Completa de Testes
Para rodar toda a suíte de testes (testes unitários, testes de componentes React e testes de integração com o SQLite), execute:

```powershell
npm.cmd test
```

A suíte executará mais de 190 testes automatizados distribuídos em 19 arquivos de teste, incluindo:
- `tests/e2e/tier1_build_smoke.test.ts`: Verificação estática de arquivos de configuração e build.
- `tests/e2e/tier2_landing_whatsapp.test.ts`: Testes do fluxo da landing page e WhatsApp.
- `tests/e2e/tier2_admin_table.test.ts`: Testes de grid e painel administrativo.
- `tests/e2e/tier3_validation_edge_cases.test.ts`: Testes de borda e validações.
- `tests/e2e/tier4_resilience_offline.test.ts`: Testes de resiliência e offline.
- `tests/e2e/tier5_adversarial_*.test.ts`: Testes adversariais de segurança e concorrência.
- `tests/e2e/tier6_backend_api.test.ts`: **Teste de integração ponta a ponta do backend Node.js + SQLite**, cobrindo:
  1. `POST /leads` e validação de status HTTP 201 e dados criados.
  2. Validação de persistência física direta no arquivo `leads.sqlite`.
  3. `GET /leads` com validação de status HTTP 200 e ordenação decrescente por data.
  4. `PUT /leads/:id` com transição por todos os 4 status válidos e checagem física em disco.
  5. `PUT /leads/:id` com status inválido retornando HTTP 400.
  6. `PUT /leads/:id` com ID inexistente retornando HTTP 404.
  7. `DELETE /leads/:id` com retorno de HTTP 200.
  8. Validação de remoção física definitiva do registro em `leads.sqlite`.
  9. `DELETE /leads/:id` com ID inexistente retornando HTTP 404.
  10. `POST /leads` com campos obrigatórios ausentes retornando HTTP 400.

---

### 7.2 Verificação do Build de Produção
Para verificar se a aplicação compila sem erros de TypeScript e sem referências órfãs a serviços externos:

```powershell
npm.cmd run build
```

**Resultado esperado:**
- O compilador do TypeScript (`tsc`) roda com zero erros de diagnóstico.
- O Vite gera o pacote otimizado de produção na pasta `dist/`.
- O comando finaliza com código de saída 0 (`exit code 0`).

---

### 7.3 Verificação Manual Rápida dos Endpoints via PowerShell
Caso queira testar a API manualmente sem abrir o navegador, com o backend rodando no Terminal 1, execute no Terminal 2:

```powershell
# 1. Criar um novo lead
$novoLead = Invoke-RestMethod -Uri "http://localhost:3001/leads" -Method POST -ContentType "application/json" -Body '{"nome":"Engenheiro Teste","link":"https://linkedin.com/in/teste","area":"Fullstack"}'
Write-Host "Lead criado com ID:" $novoLead.id

# 2. Listar todos os leads
$lista = Invoke-RestMethod -Uri "http://localhost:3001/leads" -Method GET
Write-Host "Total de leads no banco:" $lista.Length

# 3. Atualizar status
$atualizado = Invoke-RestMethod -Uri "http://localhost:3001/leads/$($novoLead.id)" -Method PUT -ContentType "application/json" -Body '{"status":"Revisando (IA)"}'
Write-Host "Novo status:" $atualizado.status

# 4. Excluir lead
$removido = Invoke-RestMethod -Uri "http://localhost:3001/leads/$($novoLead.id)" -Method DELETE
Write-Host "Mensagem de exclusão:" $removido.message
```

---

## 8. Diagnóstico e Resolução de Problemas (Troubleshooting)

### Erro: `EADDRINUSE: address already in use :::3001`
- **Causa:** Outro processo está ocupando a porta 3001 (por exemplo, uma instância anterior do Node.js).
- **Solução no Windows PowerShell:**
  ```powershell
  # Localizar o ID do processo ocupando a porta 3001
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

  # Finalizar o processo pelo PID
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
  ```

### O banco de dados `leads.sqlite` foi bloqueado (`SQLITE_BUSY: database is locked`)
- **Causa:** O Windows trava arquivos abertos se uma conexão não for fechada adequadamente.
- **Solução:** O módulo `api/db.js` já habilita por padrão `PRAGMA journal_mode = WAL;` e `PRAGMA busy_timeout = 5000;`. Certifique-se de que não há múltiplos editores externos de SQLite abertos com bloqueio exclusivo no arquivo `leads.sqlite`.

### Como redefinir o banco de dados do zero?
Basta finalizar o backend no Terminal 1, excluir os arquivos locais do SQLite na raiz do projeto e reiniciar o servidor:
```powershell
Remove-Item -Path "leads.sqlite*", "leads.sqlite-wal", "leads.sqlite-shm" -ErrorAction SilentlyContinue
node api/server.js
```
O servidor recriará o arquivo `leads.sqlite` e a tabela `leads` vazia instantaneamente.
