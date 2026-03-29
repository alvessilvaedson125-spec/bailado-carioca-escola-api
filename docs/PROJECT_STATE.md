# Bailado Carioca — Gestão Escolar
## Documento de Estado do Projeto (PROJECT_STATE)

> **Versão:** 2.0 — Março 2026
> **Status:** Produção ativa
> **Classificação:** SaaS de gestão especializada

---

# 🧭 1. VISÃO ESTRATÉGICA

O **Bailado Carioca — Gestão Escolar** é uma plataforma SaaS modular de gestão para escolas de dança, em operação ativa em produção. O sistema superou o estágio de CRUD e opera como plataforma de gestão financeira e operacional especializada.

## Capacidades atuais

| Capacidade | Status |
|---|---|
| Operação multiusuário com RBAC | ✅ Ativo |
| Expansão multiunidade | ✅ Suportado |
| Motor financeiro com DRE | ✅ Implementado |
| Geração automática de mensalidades | ✅ Implementado |
| Dashboard executivo com KPIs | ✅ Implementado |
| Relatórios filtráveis por período e turma | ✅ Implementado |
| Autenticação JWT com HMAC SHA-256 | ✅ Implementado |
| Paginação nas tabelas principais | ✅ Implementado |
| Módulo de administração de usuários | ✅ Implementado |

---

# 🧠 2. PRINCÍPIOS ARQUITETURAIS

## 2.1 Backend como fonte única da verdade

- Nenhuma regra crítica reside no frontend
- Toda validação e lógica de negócio são centralizadas no backend
- O frontend é estritamente uma camada de apresentação
- IDs são tratados como **strings (UUID)** em todas as camadas — conversão numérica é proibida

## 2.2 Separação de responsabilidades

| Camada | Responsabilidade |
|---|---|
| Auth | Sessão e identidade |
| Domínio | Regras de negócio |
| Infra | Comunicação (API, fetch) |
| UI | Renderização e interação |

## 2.3 Controle de fluxo determinístico

- Nenhuma decisão crítica ocorre em múltiplos pontos
- Navegação e autenticação possuem pontos únicos de decisão
- `auth.js` é o único responsável por redirecionamento de sessão
- `api.js` não manipula `window.location` em nenhuma circunstância

## 2.4 Evolução sem ruptura

- Deploy incremental
- Versionamento disciplinado com commits atômicos por feature
- Migrações idempotentes
- Compatibilidade retroativa sempre que possível

## 2.5 Segurança progressiva

- JWT assinado com **HMAC SHA-256** via `crypto.subtle` (Web Crypto API)
- Expiração em segundos (padrão RFC 7519)
- RBAC ativo com perfis `admin` e `operator`
- Expiração de sessão baseada em status HTTP 401
- Controle de sessão centralizado em `auth.js`

## 2.6 Regra de ouro de engenharia

```
Um passo por vez
Commit antes de mudar
Testar antes de avançar
Nunca quebrar fluxo existente
```

---

# 🧱 3. ARQUITETURA DO SISTEMA

## 3.1 Stack Tecnológico

### Frontend
| Camada | Tecnologia |
|---|---|
| Linguagem | HTML + CSS + JavaScript puro |
| Hospedagem | Cloudflare Pages |
| Arquitetura | SPA manual com router custom |
| Estilização | CSS modular por página + componentes globais |

### Backend
| Camada | Tecnologia |
|---|---|
| Runtime | Cloudflare Workers (edge serverless) |
| Linguagem | TypeScript |
| Banco de dados | Cloudflare D1 (SQLite serverless) |
| Autenticação | JWT HMAC SHA-256 (crypto.subtle) |

## 3.2 Estrutura do Frontend

```
bailado-carioca-erp-front/
├── css/
│   ├── pages/
│   │   ├── admin.css
│   │   ├── cash.css
│   │   ├── classes.css
│   │   ├── dashboard.css
│   │   ├── enrollments.css
│   │   ├── finance.css
│   │   ├── login.css
│   │   ├── reports.css
│   │   ├── students.css
│   │   ├── teachers.css
│   │   └── units.css
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   ├── style.css          ← ponto de entrada CSS
│   └── variables.css
├── js/
│   ├── api.js             ← camada de comunicação
│   ├── auth.js            ← sessão e identidade
│   ├── cash.js
│   ├── classes.js
│   ├── dashboard.js
│   ├── enrollments.js
│   ├── finance.js         ← motor de cálculo financeiro
│   ├── payments.js
│   ├── reports.js
│   ├── router.js          ← roteamento SPA
│   ├── students.js
│   ├── teachers.js
│   ├── toast.js           ← sistema de notificações
│   ├── units.js
│   └── utils.js
├── admin.html
├── app.html               ← shell principal do SPA
├── cash.html
├── classes.html
├── dashboard.html
├── enrollments.html
├── index.html             ← login (contexto isolado)
├── payments.html
├── reports.html
├── students.html
├── teachers.html
└── units.html
```

## 3.3 Estrutura do Backend

```
bailado-carioca-escola-api/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   └── admin.routes.ts      ← CRUD usuários + troca de senha
│   │   ├── auth/
│   │   │   └── auth.routes.ts       ← login, register, /me
│   │   ├── classes/
│   │   │   └── classes.routes.ts
│   │   ├── enrollments/
│   │   │   └── enrollments.routes.ts
│   │   ├── payments/
│   │   │   ├── payments.routes.ts   ← geração, filtros, summary, by-class
│   │   │   ├── payments.service.ts  ← geração automática de mensalidades
│   │   │   ├── cash.routes.ts
│   │   │   └── cash.service.ts
│   │   ├── students/
│   │   │   └── students.routes.ts
│   │   ├── teachers/
│   │   │   └── teachers.routes.ts
│   │   └── units/
│   │       └── units.routes.ts
│   ├── security/
│   │   ├── authorize.ts             ← requireAuth, requireRole
│   │   └── jwt.ts                   ← generateJWT, verifyJWT (HMAC SHA-256)
│   └── index.ts                     ← entry point do Worker
├── migrations/
├── docs/
│   └── PROJECT_STATE.md
└── wrangler.jsonc
```

## 3.4 Pipeline de execução do SPA (OBRIGATÓRIO)

```
CORE (toast, utils, api, auth) → ROUTER → MÓDULOS → DASHBOARD
```

**Garantias:**
- Evita race conditions entre módulos
- Evita execução fora de ordem
- Mantém previsibilidade total do estado da aplicação

## 3.5 Isolamento de contextos

### `index.html` (login)
- NÃO executa router
- NÃO chama `/auth/me`
- Responsável apenas pela autenticação inicial

### `app.html` (sistema)
- Executa router após validação de sessão
- Renderiza módulos sob demanda
- Gerencia ciclo de vida da sessão

## 3.6 Fluxo oficial de autenticação

```
Login → JWT Token → localStorage → app.html → /auth/me → Renderização
```

### Regras invioláveis
- `auth.js` é o único ponto de redirect de sessão
- `api.js` apenas envia requisições, retorna dados e lança erros
- `/auth/me` executa **uma vez** por carregamento, nunca em loop

---

# 🔐 4. SEGURANÇA

## 4.1 Autenticação JWT

O sistema utiliza JWT com assinatura **HMAC SHA-256** via `crypto.subtle` (Web Crypto API nativa do Cloudflare Workers).

```typescript
// Geração
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);

// Verificação criptográfica obrigatória antes de aceitar qualquer token
const valid = await crypto.subtle.verify("HMAC", key, signature, data);
```

**Padrões aplicados:**
- Expiração em **segundos** (padrão RFC 7519)
- Verificação de assinatura antes de aceitar payload
- Validação de `exp` em toda requisição autenticada
- `JWT_SECRET` armazenado como Cloudflare Worker Secret (nunca no código)

## 4.2 RBAC

| Perfil | Permissões |
|---|---|
| `admin` | Leitura e escrita em todos os módulos, gestão de usuários |
| `operator` | Leitura geral, sem acesso a administração |

**Expansão planejada:** perfis `teacher` e `financeiro`

## 4.3 Proteções implementadas

- Soft delete em todas as entidades (`deleted_at`)
- Imutabilidade de valores financeiros após geração
- Verificação de duplicidade em pagamentos
- Admin não pode desativar a própria conta
- Validação de transições de estado em pagamentos (pending → paid apenas)

---

# 🧩 5. MODELO DE DOMÍNIO

## Pipeline central

```
Students → Enrollments → Payments → Cash → Dashboard/Reports
```

## Entidades principais

### Students (Alunos)
- Status derivado: ativo se possui matrícula ativa
- Navegação direta para matrículas do aluno via botão "Ver"

### Enrollments (Matrículas)
- Vínculo entre aluno e turma
- Campos financeiros: `monthly_fee`, `discount`, `final_price`
- Status: `active`, `inactive`, `cancelled`
- Regra: um aluno não pode ter duas matrículas na mesma turma

### Payments (Pagamentos)
- Gerados automaticamente a partir de matrículas ativas
- Campos: `gross_amount`, `discount_percent`, `discount_amount`, `final_amount`
- Status computado: `paid`, `pending`, `overdue`
- **Valores são imutáveis após geração** — garantia de integridade contábil
- `due_date` calculado como dia 7 do mês de competência

### Cash (Caixa)
- Movimentações manuais de entrada e saída
- Cancelamento via soft delete
- Saldo = entradas - saídas

### Classes (Turmas)
- Suporte a múltiplos professores por turma
- Vinculada a unidade e professor
- Contador de condutores e conduzidas

---

# 💰 6. ARQUITETURA FINANCEIRA

## Motor de cálculo (`finance.js`)

Função centralizada `calculateFinance({ payments, cash })` que retorna:

```javascript
{
  receita: {
    esperado,   // soma de todos os pagamentos
    recebido,   // soma dos pagamentos com status 'paid'
    projetado,  // recebido + pendentes não vencidos
    pendente    // pendentes não vencidos
  },
  inadimplencia: {
    atrasado,     // pendentes vencidos
    defaultRate   // (atrasado / esperado) * 100
  },
  caixa: {
    entries,  // soma das entradas manuais
    exits,    // soma das saídas manuais
    balance   // entries - exits
  },
  total  // recebido + balance
}
```

## DRE Operacional

| Componente | Fonte |
|---|---|
| Receita esperada | Soma de todos os `final_amount` |
| Receita recebida | Pagamentos com `status = 'paid'` |
| Inadimplência | Pagamentos `pending` com `due_date` vencido |
| Caixa | Movimentações manuais |
| Total consolidado | Recebido + Saldo de Caixa |

## Geração automática de mensalidades

- Endpoint: `POST /api/v1/payments/generate`
- Parâmetros: `competence_month`, `competence_year`
- Comportamento: gera para todas as matrículas ativas, ignora duplicatas
- Retorno: `{ generated, skipped }`

---

# 🖥️ 7. MÓDULOS DO SISTEMA

## Dashboard
- KPIs de decisão: Recebido, Esperado, Eficiência, Inadimplência
- Saúde do negócio: Caixa, Total Consolidado, Status Geral
- Gráfico: Recebido vs Esperado — últimos 6 meses
- Ranking de turmas por eficiência de cobrança
- Filtro de período (mês/ano)
- Estado de onboarding para sistema vazio

## Relatórios
- KPIs financeiros detalhados
- Gauge de eficiência de cobrança (Recebido / Pendente / Inadimplente)
- Ranking de turmas com badge de performance
- Tabela de pagamentos ordenada por risco (vencido → pendente → pago)
- Filtros: mês, ano, turma
- Linhas vencidas destacadas em vermelho

## Alunos
- Lista com status derivado de matrículas ativas
- Busca por nome e email
- Paginação (15 por página)
- Navegação direta para matrículas do aluno

## Matrículas
- Vínculo aluno-turma com papel (condutor/conduzida)
- Gestão financeira por matrícula (mensalidade + desconto)
- Paginação (15 por página)
- Edição e cancelamento funcionais

## Pagamentos
- Geração em lote por competência
- Filtro por mês/ano
- Paginação (15 por página)
- Marcação de pagamento com Toast de confirmação

## Caixa
- Movimentações manuais de entrada e saída
- Filtro por tipo e descrição
- Cancelamento de movimentações
- Saldo em tempo real

## Turmas
- Suporte a múltiplos professores
- Vinculação com unidade
- Contagem de condutores e conduzidas

## Administração
- CRUD de usuários do sistema
- Criação de perfis `admin` e `operator`
- Desativação de usuários (soft delete)
- Troca de senha com validação da senha atual
- Proteção: admin não pode desativar a própria conta

---

# ⚠️ 8. INCIDENTES CRÍTICOS RESOLVIDOS

## 8.1 Race condition no router
| Campo | Detalhe |
|---|---|
| Sintoma | Tela travando em "Carregando..." |
| Causa | `init()` executando antes do módulo carregar |
| Correção | `waitForModule()` com polling de 10ms |
| Impacto | Estabilidade do SPA restaurada |

## 8.2 RBAC bloqueando enrollments
| Campo | Detalhe |
|---|---|
| Sintoma | 403 na API de matrículas |
| Causa | `requireRole` com restrição excessiva |
| Correção | Ajuste de permissões por endpoint |
| Impacto | Fluxo de dados restabelecido |

## 8.3 Hash de rota incorreto
| Campo | Detalhe |
|---|---|
| Sintoma | Módulo não carregava ao navegar |
| Causa | Rota `#/enrollments` incompatível com router |
| Correção | Uso de `window.location.hash` sem barra |
| Impacto | Navegação entre módulos estabilizada |

## 8.4 Tipagem de ID (CRÍTICO)
| Campo | Detalhe |
|---|---|
| Sintoma | Dados não apareciam na tela de matrículas |
| Causa | `Number(uuid)` retornando `NaN` |
| Correção | IDs mantidos como string em todas as camadas |
| Impacto | Correção total do fluxo Students → Enrollments |

**Regra arquitetural derivada (OBRIGATÓRIA):**
```
IDs são strings UUID em todas as camadas.
Proibido: Number(id), parseInt(id), qualquer coerção implícita.
```

## 8.5 Bug de competência (ano 2620)
| Campo | Detalhe |
|---|---|
| Sintoma | Pagamentos gerados com ano 2620 |
| Causa | Campo vazio enviado como string — `"" \|\| fallback` falhou |
| Correção | Validação explícita de string vazia antes do fallback |
| Impacto | Integridade dos dados financeiros restaurada |

## 8.6 Loop de autenticação
| Campo | Detalhe |
|---|---|
| Sintoma | Loop infinito de redirecionamentos |
| Causa | Múltiplos pontos de redirect em api.js, router.js e auth.js |
| Correção | Centralização total de redirect em auth.js |
| Impacto | Fluxo de autenticação estabilizado |

---

# 🚀 9. ROADMAP EVOLUTIVO

## Curto prazo
- [ ] Refresh token (extensão de sessão sem novo login)
- [ ] Logs estruturados no backend
- [ ] Filtro por unidade nos relatórios

## Médio prazo
- [ ] Observabilidade (erros e uso via Cloudflare Analytics)
- [ ] Perfis `teacher` e `financeiro` no RBAC
- [ ] Exportação de relatórios em PDF/CSV
- [ ] Notificações de inadimplência

## Longo prazo
- [ ] Multi-tenant real (múltiplas escolas)
- [ ] Billing SaaS (planos e cobrança recorrente)
- [ ] App mobile (PWA ou nativo)
- [ ] Integração com gateway de pagamento

---

# 🏁 10. STATUS ATUAL DO SISTEMA

| Área | Status | Detalhe |
|---|---|---|
| Backend | 🟢 Estável | Todos os módulos em produção |
| Autenticação | 🟢 Hardened | JWT HMAC SHA-256, RBAC ativo |
| Frontend | 🟢 Estabilizado | SPA sem race conditions |
| Financeiro | 🟢 Avançado | DRE + geração automática |
| Deploy | 🟢 Estável | Cloudflare Pages + Workers |
| Arquitetura | 🟢 Sólida | Separação clara de camadas |
| UX | 🟢 Profissional | Toast, paginação, loading states |
| Documentação | 🟢 Atualizada | Este documento |

---

# 📋 11. PROCESSO DE DESENVOLVIMENTO

## Fluxo padrão para qualquer mudança

```
1. Diagnóstico — entender o problema antes de codar
2. Proposta — definir a solução e os arquivos afetados
3. Aprovação — validar com o responsável
4. Execução controlada — um arquivo por vez
5. Commit — mensagem descritiva por feature
6. Deploy — verificar em produção
```

## Padrão de commit

```
feat: nova funcionalidade
fix: correção de bug
refactor: melhoria sem mudança de comportamento
docs: atualização de documentação
```

## Regras invioláveis

- Nunca commitar código não testado
- Nunca modificar múltiplos módulos em um único commit sem necessidade
- Nunca usar `alert()` — usar `Toast`
- Nunca usar `onclick` inline no HTML — eventos via JS
- Nunca converter IDs com `Number()` ou `parseInt()`
- Nunca fazer redirect fora do `auth.js`
- Nunca armazenar `JWT_SECRET` no código — usar Cloudflare Secrets

---

*Documento mantido pelo time de desenvolvimento.*
*Última atualização: Março 2026*