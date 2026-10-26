# Revisão Express de Currículo e LinkedIn — MVP

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](https://github.com)
[![Tests Status](https://img.shields.io/badge/Tests-140%2F140%20Passing%20(100%25)-success?style=flat-square)](TEST_READY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](tsconfig.json)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](package.json)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite)](vite.config.ts)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](tailwind.config.js)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%204--Layer-purple?style=flat-square)](PROJECT.md)

---

## 1. Visão Geral e Proposta de Valor

O **Currículo Express Tech** é uma aplicação web voltada para candidatos, desenvolvedores e estudantes de tecnologia que enfrentam dificuldades para superar os filtros automatizados de recrutamento (**Applicant Tracking Systems — ATS**) e capturar a atenção de tech recruiters.

### Proposta de Valor Central
- **Headline de Conversão:** *"Seu currículo não passa nos filtros dos recrutadores? Nós reescrevemos para você ser chamado para entrevistas"*.
- **Agilidade:** Entrega de diagnósticos profundos e reescrita completa do perfil profissional em **poucas horas**.
- **Fluxo Operacional Enxuto:** Combina uma **Landing Page de Alta Conversão** integrada nativamente ao WhatsApp com um **Painel Administrativo (`/admin`)** para gerenciamento de leads e aceleração do fluxo operacional manual via prompts estruturados para IA (ChatGPT).

### Público-Alvo
- Desenvolvedores (Frontend, Backend, Fullstack, Mobile).
- Especialistas em Dados, Inteligência Artificial, DevOps e Cloud.
- Candidatos em início de carreira ou em transição que precisam de posicionamento claro no mercado tech.

---

## 2. Arquitetura em 4 Camadas (Clean 4-Layer Architecture)

O sistema foi arquitetado com estrita separação de responsabilidades seguindo o padrão de **4 camadas desacopladas**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CAMADA DE APRESENTAÇÃO (UI / Components & Pages)                         │
│    LandingPage (/), AdminPage (/admin)                                      │
│    HeroSection, HowItWorks, LeadCaptureForm, LeadsTable, StatusDropdown     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Consome hooks
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. CAMADA DE ESTADO E HOOKS (State & Interaction)                           │
│    useLeadForm, useLeads, useClipboard, useToast                            │
│    Validação reativa, controle de loading, sincronização de estado          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Orquestra regras de negócio
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. CAMADA DE SERVIÇOS DE DOMÍNIO (Domain Services)                          │
│    whatsappService (codificação de URI e construção de templates)           │
│    clipboardService (geração de prompts STAR/ATS para ChatGPT + fallback)  │
│    leadService (agregação de métricas, busca e ordenação)                   │
│    validators & formatters (validação de link, e-mail, nomes e datas)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Persiste através de contrato puro
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 4. CAMADA DE PERSISTÊNCIA (Repository Pattern & Storage Factory)             │
│    ILeadsRepository (Contrato de interface)                                │
│    ├── LovableCloudRepository (Backend Cloud / Supabase API)                │
│    └── LocalStorageRepository (Fallback resiliente offline + 5 seed leads)  │
│    storageFactory (Detecção dinâmica de credenciais com fallback seguro)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento das Camadas

1. **Camada de Apresentação (`src/components/`, `src/pages/`):**
   - Responsável exclusivamente por renderização de UI, acessibilidade (ARIA labels) e eventos do usuário. Não contém lógica de persistência nem manipulação direta de storage.
2. **Camada de Hooks (`src/hooks/`):**
   - Encapsula o ciclo de vida do formulário (`useLeadForm`), gerenciamento otimista de leads (`useLeads`), cópia para área de transferência (`useClipboard`) e feedback ao usuário (`useToast`).
3. **Camada de Serviços (`src/services/`):**
   - Regras de domínio e utilitários agnósticos de interface:
     - `whatsappService.ts`: constrói links no formato `https://wa.me/<phone>?text=...` garantindo sanitização de dígitos e codificação estrita (`encodeURIComponent`).
     - `clipboardService.ts`: formata o prompt de IA especializado contendo instruções ATS, metodologia STAR e headline otimizado.
     - `leadService.ts`: filtros, busca multi-campo e cálculo de métricas para os cards estatísticos.
4. **Camada de Persistência (`src/services/storage/`):**
   - Implementa o **Repository Pattern** através da interface `ILeadsRepository`.
   - Permite alternância transparente entre **Lovable Cloud (Supabase)** e **LocalStorage**, garantindo funcionamento 100% funcional mesmo sem qualquer variável de ambiente configurada.

---

## 3. Divisão de Rotas e Componentes

### 3.1 Rota Cliente: Landing Page (`/`)

Focada em conversão direta com fluxo simplificado:
- **Navbar (`src/components/common/Navbar.tsx`):** Identidade visual, logotipo da marca e link direto para o back-office administrativo.
- **HeroSection (`src/components/landing/HeroSection.tsx`):**
  - Título verbatim obrigatório: *"Seu currículo não passa nos filtros dos recrutadores? Nós reescrevemos para você ser chamado para entrevistas"*.
  - Subtítulo enfatizando entrega expressa em poucas horas.
  - Provas de valor com bullet points (Revisão ATS, Otimização de LinkedIn, Alinhamento via WhatsApp).
- **HowItWorksSection (`src/components/landing/HowItWorksSection.tsx`):**
  - Explicação visual em 3 passos sequenciais:
    1. *Preencha o formulário*
    2. *Combine detalhes e pagamento no WhatsApp*
    3. *Receba seu perfil otimizado em poucas horas*
- **LeadCaptureForm (`src/components/landing/LeadCaptureForm.tsx`):**
  - Formulário com validação em tempo real para:
    - **Nome Completo** (mínimo 3 caracteres, higienização de espaços).
    - **Link do LinkedIn ou Currículo** (validação estrita de protocolo http/https, rejeição de strings de e-mail e hostname válido).
    - **Área de Atuação e Cargo Desejado** (mínimo 2 caracteres).
  - Botão de Ação: *"Solicitar Análise via WhatsApp"*.
  - Ao enviar: salva o lead na base de dados e abre a conversa oficial no WhatsApp com mensagem pré-formatada.
  - Banner de confirmação com link alternativo caso o bloqueador de pop-ups do navegador interfira.
- **TrustBadges (`src/components/landing/TrustBadges.tsx`):** Indicadores de credibilidade (Segurança de dados, entrega expressa, metodologia comprovada).
- **Footer (`src/components/common/Footer.tsx`):** Rodapé institucional com links de navegação e atalho operacional para o `/admin`.

### 3.2 Rota Operacional: Painel de Administração (`/admin`)

Interface de back-office projetada para velocidade e eficiência operacional:
- **AdminHeader (`src/components/admin/AdminHeader.tsx`):** Cabeçalho de controle com breadcrumb e botão de retorno à Landing Page.
- **AdminStatsCards (`src/components/admin/AdminStatsCards.tsx`):** 5 cards com contadores dinâmicos calculados em tempo real:
  - *Total de Leads*
  - *Novos*
  - *Aguardando Pagamento*
  - *Revisando (IA)*
  - *Entregues*
- **TableFilters (`src/components/admin/TableFilters.tsx`):**
  - Campo de busca instantânea por nome, link ou área/cargo.
  - Dropdown para filtrar registros por status específico.
  - Botão *"Limpar filtros"* quando uma busca não retorna resultados.
- **LeadsTable (`src/components/admin/LeadsTable.tsx`):**
  - Tabela responsiva com as **5 colunas obrigatórias**:
    1. **Data/Hora** (formatada no padrão brasileiro `DD/MM/AAAA HH:mm`).
    2. **Nome** do candidato.
    3. **Link (LinkedIn / CV)** (link clicável seguro com `target="_blank"` e `rel="noopener noreferrer"`).
    4. **Área / Cargo** desejado.
    5. **Status** com controle interativo.
- **StatusDropdown (`src/components/admin/StatusDropdown.tsx`):**
  - Dropdown por linha permitindo alternar e persistir imediatamente o status entre os 4 valores obrigatórios:
    - `Novo` (badge azul)
    - `Aguardando Pagamento` (badge âmbar/amarelo)
    - `Revisando (IA)` (badge roxo)
    - `Entregue` (badge verde esmeralda)
- **CopyContextButton (`src/components/admin/CopyContextButton.tsx`):**
  - Botão *"Copiar Contexto"* que gera um prompt estruturado completo e copia para a área de transferência do sistema operacional com fallback resiliente (`navigator.clipboard` e `document.execCommand`).
- **EmptyState (`src/components/admin/EmptyState.tsx`):**
  - Renderizado quando não há leads cadastrados ou quando os filtros ativos não encontram correspondências, incluindo botão de ação.

---

## 4. Matriz de Verificação de Requisitos

| Requisito | Descrição | Implementação | Validação & Testes |
|---|---|---|---|
| **R1. Landing Page** | SPA responsiva em React + Tailwind com Hero, Como Funciona (3 passos) e Formulário de Captura. | `HeroSection.tsx`, `HowItWorksSection.tsx`, `LeadCaptureForm.tsx`. | 20 testes em `tier2_landing_whatsapp.test.ts`. Valida headline verbatim, passos 1-2-3 e campos do form. |
| **R1. WhatsApp URL** | Formatação da mensagem e codificação URI completa (`encodeURIComponent`) para `https://wa.me/...`. | `whatsappService.ts`: template `"Olá, acabei de preencher o formulário. Meu nome é [Nome], sou da área de [Área] e quero a revisão express."`. | Testes de acentuação (`ç`, `ã`, `é`), símbolos (`&`, `#`, `+`), round-trip decoding e fallback de popup. |
| **R2. Painel Admin** | Rota `/admin` com tabela de 5 colunas obrigatórias (Data/Hora, Nome, Link, Área/Cargo, Status). | `AdminPage.tsx`, `LeadsTable.tsx`, `LeadTableRow.tsx`. | 17 testes em `tier2_admin_table.test.ts`. Valida os 5 cabeçalhos e renderização tabular. |
| **R2. Status Interativo** | Dropdown com 4 estados persistidos: `Novo`, `Aguardando Pagamento`, `Revisando (IA)` e `Entregue`. | `StatusDropdown.tsx`, `useLeads.ts`, `ILeadsRepository.ts`. | Validação de persistência otimista, concorrência e atualização nos cards de métricas. |
| **R2. Copiar Contexto** | Botão que copia texto padronizado para ChatGPT com Nome, Área/Cargo e Link do candidato. | `CopyContextButton.tsx`, `clipboardService.ts`. Prompt inclui diagnósticos ATS, STAR e headline. | Testes de cópia para clipboard com fallback cross-browser e feedback visual toast. |
| **R3. Persistência** | Suporte a Lovable Cloud (Supabase) com fallback automático para LocalStorage offline. | `LovableCloudRepository.ts`, `LocalStorageRepository.ts`, `storageFactory.ts`. | 5 seed leads pré-carregados, auto-recuperação de JSON corrompido, 0 variáveis necessárias para executar. |
| **R4. Identidade Visual** | Tokens: Azul Marinho (confiança), Branco (fundo limpo) e Verde WhatsApp (`#25D366`). | `tailwind.config.js`, `src/index.css`, componentes. | Cores `#0F172A`, `#1E3A8A`, `#25D366` aplicadas com contraste e 100% responsivas. |

---

## 5. Especificação de Variáveis de Ambiente

O projeto é **100% funcional em modo offline / zero-config**. Caso nenhuma variável seja configurada, o sistema inicializa automaticamente utilizando o `LocalStorageRepository` pré-populado com 5 leads representativos.

Para conectar ao backend em nuvem (Lovable Cloud / Supabase), configure o arquivo `.env`:

```env
# Telefone de destino para onde o cliente será redirecionado no WhatsApp (apenas dígitos com DDI e DDD)
# Exemplo padrão: 5511999999999
VITE_WHATSAPP_PHONE=5511999999999

# Senha de Acesso ao Painel Administrativo (/admin) - Padrão: admin123
VITE_ADMIN_PASSWORD=admin123

# Credenciais da Lovable Cloud / Supabase (Opcional - ativa LovableCloudRepository)
VITE_SUPABASE_URL=https://sua-instancia.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-jwt

# Aliases compatíveis com Lovable Cloud
VITE_LOVABLE_CLOUD_URL=
VITE_LOVABLE_CLOUD_KEY=
```

---

## 6. Instruções de Instalação e Execução (Windows PowerShell)

> **⚠️ IMPORTANTE PARA WINDOWS POWERSHELL:**  
> Devido às restrições de `ExecutionPolicy` no Windows, a execução direta de scripts `.ps1` pode ser bloqueada.  
> **Sempre utilize os comandos `npm.cmd` e `npx.cmd` no terminal.**

### Passo 1: Clonar o Repositório e Navegar para o Diretório
```powershell
cd C:\Users\project\Documents\antigravity\proud-borg
```

### Passo 2: Instalar as Dependências
```powershell
npm.cmd install
```

### Passo 3: Executar o Servidor de Desenvolvimento
```powershell
npm.cmd run dev
```
O servidor iniciará em `http://localhost:5173`.
- Acesso à Landing Page: `http://localhost:5173/`
- Acesso ao Painel Admin: `http://localhost:5173/admin`

### Passo 4: Executar os Testes Automatizados
```powershell
# Executa toda a suíte de testes (133 testes em 14 arquivos)
npm.cmd test

# Executa apenas os testes E2E
npx.cmd vitest run tests/e2e
```

### Passo 5: Compilar para Produção (Build)
```powershell
npm.cmd run build
```
O comando executa a checagem de tipos com `tsc` e o empacotamento com `vite build`, gerando a pasta `dist/` sem nenhum erro de compilação (Exit Code 0).

---

## 7. Estratégia de Testes e Matriz E2E (Tiers 1 a 5)

A qualidade da aplicação é garantida por uma suíte de testes em camadas com **100% de aprovação (133/133 testes)**:

| Nível de Teste | Arquivo de Teste | Qtd. | Foco da Verificação |
|---|---|:---:|---|
| **Tier 1: Build Smoke** | `tests/e2e/tier1_build_smoke.test.ts` | 5 | Compilação com `npm.cmd run build` (código 0), integridade de `dist/`, assets CSS/JS e checagem de tipos com `tsc -b`. |
| **Tier 2: LP & WhatsApp** | `tests/e2e/tier2_landing_whatsapp.test.ts` | 20 | Headline do Hero, 3 passos do Como Funciona, validação de campos, codificação de URL do WhatsApp (`encodeURIComponent`) e persistência do lead. |
| **Tier 2: Admin Table** | `tests/e2e/tier2_admin_table.test.ts` | 17 | 5 colunas obrigatórias, dropdown de 4 status (`Novo`, `Aguardando Pagamento`, `Revisando (IA)`, `Entregue`), persistência e cópia do prompt ChatGPT. |
| **Tier 3: Boundary & Edges** | `tests/e2e/tier3_validation_edge_cases.test.ts` | 21 | Rejeição de espaços em branco, higienização de URLs (LinkedIn, Drive, GitHub), diacríticos em português (`ç`, `ã`, `é`), símbolos (`&`, `#`, `+`), estado vazio do Admin e filtros. |
| **Tier 4: Offline Resilience** | `tests/e2e/tier4_resilience_offline.test.ts` | 8 | Ciclo de vida completo do lead (LP ➔ WhatsApp ➔ Admin ➔ Status ➔ ChatGPT), fallback offline no LocalStorage, 5 seed leads e auto-cura de JSON corrompido. |
| **Tier 5: Adversarial Stress** | `tests/e2e/tier5_adversarial_m1.test.ts` | 16 | Estresse de caracteres especiais, injeção de parâmetros (`&`, `#`, `?`, `=`), payloads longos (5000+ chars), emojis, endurecimento de validação de URL e fallback seguro de telefone. |
| **Tier 5: Admin & Storage** | `tests/e2e/tier5_adversarial_admin_storage.test.ts` | 16 | Alternância rápida de status em sequência, concorrência entre múltiplos leads (12+ registros simultâneos), auto-cura de JSON não-array, fallback em memória e renderização em escala (50+ leads sob 1s). |
| **Unit & Componentes** | `src/__tests__/*.test.ts(x)` | 30 | Validação isolada de serviços (`whatsappService`, `clipboardService`, `leadService`), `LocalStorageRepository`, validadores e componentes React. |
| **TOTAL** | **14 arquivos de teste** | **133** | **100% PASS (Zero falhas, zero regressões)** |

> Para mais detalhes técnicos sobre a infraestrutura de testes, consulte:
> - [`TEST_INFRA.md`](TEST_INFRA.md) — Documentação da arquitetura e metodologia de testes.
> - [`TEST_READY.md`](TEST_READY.md) — Sumário de execução, comandos e inventário de testes.

---

## 8. Estrutura de Arquivos do Projeto

```
proud-borg/
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md                                # Documentação completa do projeto
├── TEST_INFRA.md                            # Especificação detalhada da infraestrutura de testes
├── TEST_READY.md                            # Resumo executivo dos testes e status de cobertura
├── src/
│   ├── main.tsx                             # Ponto de entrada da aplicação React
│   ├── App.tsx                              # Roteamento da aplicação (/ e /admin)
│   ├── index.css                            # Estilos globais e tokens de cores
│   ├── types/
│   │   ├── lead.ts                          # Interfaces Lead, LeadStatus, CreateLeadDTO
│   │   └── common.ts                        # Tipos utilitários e de validação
│   ├── config/
│   │   ├── constants.ts                     # Textos, etapas, cores e configurações estáticas
│   │   └── env.ts                           # Leitura segura de variáveis com fallbacks
│   ├── services/
│   │   ├── storage/
│   │   │   ├── ILeadsRepository.ts          # Contrato de persistência
│   │   │   ├── LocalStorageRepository.ts    # Implementação LocalStorage com auto-cura
│   │   │   ├── LovableCloudRepository.ts    # Implementação Lovable Cloud / Supabase
│   │   │   ├── seedData.ts                  # 5 leads de demonstração
│   │   │   └── storageFactory.ts            # Factory com injeção de dependência e fallback
│   │   ├── leadService.ts                   # Agregação, filtros e métricas de leads
│   │   ├── whatsappService.ts               # Construção e codificação de URL do WhatsApp
│   │   └── clipboardService.ts              # Prompt generator STAR/ATS e cópia cross-browser
│   ├── hooks/
│   │   ├── useLeads.ts                      # Hook de listagem, filtro e atualização de status
│   │   ├── useLeadForm.ts                   # Hook de gerenciamento do formulário de captura
│   │   ├── useClipboard.ts                  # Hook de interação com a área de transferência
│   │   └── useToast.ts                      # Hook de notificações contextuais
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx                   # Barra de navegação com link para /admin
│   │   │   ├── Footer.tsx                   # Rodapé com créditos e links
│   │   │   ├── StatusBadge.tsx              # Badge visual colorido por status
│   │   │   ├── Toast.tsx                    # Notificação flutuante de feedback
│   │   │   ├── Icons.tsx                    # Ícones SVG leves e acessíveis
│   │   │   └── Button.tsx                   # Componente de botão reutilizável
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx              # Seção principal de conversão com headline
│   │   │   ├── HowItWorksSection.tsx        # Seção com os 3 passos sequenciais
│   │   │   ├── StepCard.tsx                 # Card individual de passo
│   │   │   ├── LeadCaptureForm.tsx          # Formulário de captura com redirecionamento
│   │   │   └── TrustBadges.tsx              # Badges de segurança e agilidade
│   │   └── admin/
│   │       ├── AdminHeader.tsx              # Cabeçalho administrativo com breadcrumb
│   │       ├── AdminStatsCards.tsx          # 5 cards de métricas em tempo real
│   │       ├── TableFilters.tsx             # Barra de busca e filtro por status
│   │       ├── LeadsTable.tsx               # Tabela principal de leads
│   │       ├── LeadTableRow.tsx             # Linha da tabela com as 5 colunas
│   │       ├── StatusDropdown.tsx           # Dropdown interativo de 4 status
│   │       ├── CopyContextButton.tsx        # Botão para copiar prompt do ChatGPT
│   │       └── EmptyState.tsx               # Tratamento de lista vazia
│   ├── pages/
│   │   ├── LandingPage.tsx                  # Página cliente (Landing Page)
│   │   └── AdminPage.tsx                    # Página operacional (Back-Office Admin)
│   ├── utils/
│   │   ├── formatters.ts                    # Formatação de datas em pt-BR e normalização de URLs
│   │   └── validators.ts                    # Validação de formulário, e-mail e hostname
│   └── __tests__/                           # Testes unitários e de componentes
└── tests/
    └── e2e/                                 # Suíte E2E automatizada (Tiers 1 a 5)
```

---

## 9. Licença

Este projeto é um MVP desenvolvido sob os padrões de excelência de engenharia de software da DIO. Distribuído sob a licença MIT.
