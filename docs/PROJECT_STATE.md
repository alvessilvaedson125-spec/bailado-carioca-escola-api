# Bailado Carioca — Gestão Escolar
## Documento de Estado do Projeto (PROJECT_STATE)

> **Versão:** 5.0 — Março 2026
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
| Exportação CSV e PDF | ✅ Implementado |
| Autenticação JWT com HMAC SHA-256 | ✅ Implementado |
| Paginação nas tabelas principais | ✅ Implementado |
| Módulo de administração de usuários | ✅ Implementado |
| Módulo de presença (chamada) | ✅ Implementado |
| Frequência média no dashboard | ✅ Implementado |
| Bolsistas com formulário separado | ✅ Implementado |
| Impacto financeiro de bolsas | ✅ Implementado |
| Layout por turma nas matrículas | ✅ Implementado |
| Responsividade mobile/tablet | ✅ Implementado |
| Nome do usuário logado no header | ✅ Implementado |
| Register bloqueado após primeiro admin | ✅ Implementado |
| Caixa — saldo acumulado + entradas/saídas do mês | ✅ Implementado |
| Aulas Particulares — pacotes, sessões, pagamentos | ✅ Implementado |
| Sessões — toggle por aluno / por data | ✅ Implementado |
| Dashboard integrado com aulas particulares | ✅ Implementado |
| Relatórios com DRE consolidado (mensalidades + particulares) | ✅ Implementado |
| Varredura completa de qualidade do frontend | ✅ Concluído |

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
- `router.js` é o único ponto de `checkAuth` — módulos nunca chamam `checkAuth`
- `api.js` não manipula `window.location` em nenhuma circunstância

## 2.4 Evolução sem ruptura

- Deploy incremental
- Versionamento disciplinado com commits atômicos por feature
- Migrações idempotentes
- Compatibilidade retroativa sempre que possível

## 2.5 Segurança progressiva

- JWT assinado com **HMAC SHA-256** via `crypto.subtle` (Web Crypto API)
- Expiração em **8 horas** (segundos, padrão RFC 7519)
- RBAC ativo com perfis `admin` e `operator`
- Expiração de sessão baseada em status HTTP 401
- Controle de sessão centralizado em `router.js` (checkAuth)
- Register público bloqueado após criação do primeiro admin
- Cash routes exigem autenticação obrigatória

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
| Banco de dados | Cloudflare D1 (SQLite serverless) — `bailado_carioca_escola_db` (UUID: 081c69b7-c6ad-441b-98b7-84c555b7d147) |
| Autenticação | JWT HMAC SHA-256 (crypto.subtle) |

## 3.2 Estrutura do Frontend
```
bailado-carioca-erp-front/
├── css/
│   ├── pages/
│   │   ├── admin.css
│   │   ├── attendance.css
│   │   ├── cash.css
│   │   ├── classes.css
│   │   ├── dashboard.css
│   │   ├── enrollments.css
│   │   ├── finance.css
│   │   ├── login.css
│   │   ├── payments.css
│   │   ├── private.css
│   │   ├── reports.css
│   │   ├── students.css
│   │   ├── teachers.css
│   │   └── units.css
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   ├── style.css
│   └── variables.css
├── js/
│   ├── api.js               ← typo signal corrigido
│   ├── auth.js
│   ├── attendance.js        ← checkAuth removido
│   ├── cash.js              ← eventos globais removidos
│   ├── classes.js
│   ├── dashboard.js         ← integrado com particulares
│   ├── enrollments.js       ← setupTabs re-registrado, scholarship Number()
│   ├── finance.js           ← privatePayments no cálculo consolidado
│   ├── payments.js          ← loadCashflow sem requisição dupla
│   ├── private.js
│   ├── reports.js           ← checkAuth removido, initDone adicionado
│   ├── router.js
│   ├── students.js          ← checkAuth removido
│   ├── teachers.js          ← alert→Toast, onclick inline removido
│   ├── toast.js
│   ├── units.js             ← checkAuth removido
│   └── utils.js
├── admin.html
├── app.html
├── attendance.html
├── cash.html                ← onclick inline removido
├── classes.html             ← tag modal corrigida
├── dashboard.html           ← h2→h1
├── enrollments.html
├── index.html
├── payments.html
├── private.html
├── reports.html
├── students.html
├── teachers.html            ← page-header padronizado
└── units.html
```

## 3.3 Estrutura do Backend
```
bailado-carioca-escola-api/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   └── admin.routes.ts
│   │   ├── attendance/
│   │   │   └── attendance.routes.ts
│   │   ├── auth/
│   │   │   └── auth.routes.ts
│   │   ├── classes/
│   │   │   └── classes.routes.ts  ← roles conductor_m/f, follower_f/m corrigidos
│   │   ├── enrollments/
│   │   │   └── enrollments.routes.ts
│   │   ├── payments/
│   │   │   ├── payments.routes.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── cash.routes.ts
│   │   │   └── cash.service.ts
│   │   ├── private/
│   │   │   └── private.routes.ts
│   │   ├── students/
│   │   │   └── students.routes.ts
│   │   ├── teachers/
│   │   │   └── teachers.routes.ts
│   │   └── units/
│   │       └── units.routes.ts
│   ├── security/
│   │   ├── authorize.ts
│   │   └── jwt.ts
│   └── index.ts
├── migrations/
│   ├── 0001 a 0022 ...
│   ├── 0023_create_private_packages.sql
│   ├── 0024_create_private_sessions.sql
│   └── 0025_create_private_payments.sql
├── docs/
│   └── PROJECT_STATE.md
└── wrangler.jsonc
```

---

# 🔐 4. SEGURANÇA

## 4.1 Autenticação JWT

- Expiração: **8 horas**
- Assinatura: HMAC SHA-256
- `requireAuth` retorna `Response` diretamente (não `{ error: Response }`)
- Register público bloqueado após primeiro admin criado

## 4.2 RBAC

| Perfil | Permissões |
|---|---|
| `admin` | Leitura e escrita em todos os módulos, gestão de usuários |
| `operator` | Leitura geral + criar/editar alunos e matrículas + marcar pagamentos + presença |

---

# 🧩 5. MODELO DE DOMÍNIO

## Pipeline central
```
Students → Enrollments (regular + scholarship) → Payments → Cash → Dashboard/Reports
                                                                          ↑
Private: Students → private_packages → private_sessions → private_payments
```

## Aulas Particulares

### Regras de negócio
- Pacote padrão = 4 aulas (configurável)
- `sessions_used` só incrementa quando sessão é marcada como **completed**
- Pacote muda para `completed` automaticamente quando `sessions_used >= total_sessions`
- Se sessão cancelada/no_show: decrementa `sessions_used` **apenas se estava completed**
- Pagamento gerado automaticamente ao criar pacote (status `pending`)
- Aula avulsa: `package_id = null`
- Dois locais fixos: `bailado_laranjeiras` | `student_home`
- Dois professores por sessão: `teacher_1_id` (obrigatório) + `teacher_2_id` (nullable)

---

# 💰 6. ARQUITETURA FINANCEIRA

## DRE Consolidado
- **Mensalidades** — `payments` table, geradas automaticamente
- **Aulas Particulares** — `private_payments` table, separado
- **Dashboard** — soma os dois: `recebidoTotal = recebido + privPaid`
- **Relatórios** — DRE com linha separada por origem + total geral

## Caixa
- **Saldo atual** = acumulado histórico
- **Entradas/Saídas** = apenas mês corrente

## Bolsistas
| Tipo | `scholarship` | `discount` | Impacto financeiro |
|---|---|---|---|
| Regular | 0 | qualquer | Entra nos cálculos |
| Bolsa parcial | 1 | 1-99% | Entra com desconto |
| Bolsa integral | 1 | 100% | **Excluído dos cálculos** |

---

# 📱 7. RESPONSIVIDADE MOBILE/TABLET

| Breakpoint | Comportamento |
|---|---|
| > 1024px | Layout desktop completo |
| 768px–1024px | Tablet: sidebar 200px, grids 2 colunas |
| < 768px | Mobile: sidebar overlay + hamburguer |

---

# ⚠️ 8. INCIDENTES CRÍTICOS RESOLVIDOS (SESSÃO 5.0)

## 8.1 Varredura completa do frontend

| Arquivo | Problema corrigido |
|---|---|
| `api.js` | Typo `controller.signala` → `controller.signal` |
| `students.js` | `checkAuth` no init removido |
| `reports.js` | `checkAuth` + duplo registro de eventos removidos |
| `attendance.js` | `checkAuth` no init removido |
| `admin.js` | `checkAuth` no init removido |
| `units.js` | `checkAuth` no init removido |
| `cash.js` | `document.addEventListener` globais removidos |
| `cash.html` | `onclick` inline removido |
| `teachers.js` | `alert()` → `Toast`, `onclick` inline removido |
| `teachers.html` | `page-header` padronizado, `onclick` inline removido |
| `classes.html` | Tag modal fechada prematuramente corrigida |
| `dashboard.html` | `h2` → `h1` no page-header |
| `enrollments.js` | `setupTabs` re-registrado no `initDone`, `scholarship` com `Number()` |
| `payments.js` | `loadCashflow` usa cache em vez de requisição dupla |

## 8.2 Contagem de alunos por turma incorreta
- **Causa:** Subquery usava `role IN ('leader','conductor')` — roles antigos
- **Correção:** Adicionados `conductor_m`, `conductor_f`, `follower_f`, `follower_m`

## 8.3 Aba Bolsistas não abria ao voltar para a página
- **Causa:** `setupTabs` não era chamado quando `initDone = true`
- **Correção:** `setupTabs()` adicionado no bloco `if(initDone)`

## 8.4 `scholarship` comparação falhava
- **Causa:** SQLite retorna inteiro, JS comparava com `=== 1` mas recebia string em alguns casos
- **Correção:** `Number(e.scholarship) === 1` em todos os pontos

---

# 🏁 9. STATUS ATUAL DO SISTEMA

| Área | Status | Detalhe |
|---|---|---|
| Backend | 🟢 Estável | Todos os módulos em produção, varredura completa |
| Frontend | 🟢 Limpo | Varredura completa — checkAuth, alert, onclick inline, eventos globais corrigidos |
| Autenticação | 🟢 Hardened | JWT 8h, register bloqueado, name no /me |
| Financeiro | 🟢 Avançado | DRE consolidado mensalidades + particulares |
| Presença | 🟢 Ativo | Chamada + histórico + dashboard |
| Mobile | 🟢 Responsivo | Hamburguer + overlay + login corrigido |
| Aulas Particulares | 🟢 Ativo | Pacotes + sessões + pagamentos + toggle de visão |
| Deploy | 🟢 Estável | Cloudflare Pages + Workers |

---

# 📋 10. USUÁRIOS DO SISTEMA (PRODUÇÃO)

| Email | Role | Observação |
|---|---|---|
| alvessilvaedson125@gmail.com | admin | Usuário principal |
| tavarescampos.livia@gmail.com | admin | |
| bailadocarioca@gmail.com | operator | Senha: bailado_operador |
| edson@bailado.com | admin | |

---

# 🚀 11. ROADMAP EVOLUTIVO

## Pendente curto prazo
- [ ] Tabela Turmas/Professores no mobile — colunas cortadas
- [ ] Refresh token
- [ ] Logs estruturados no backend

## Médio prazo
- [ ] Filtro por unidade nos relatórios
- [ ] Exportação de relatório de frequência
- [ ] Notificações de inadimplência
- [ ] Agenda visual (grid semanal por professor/aluno)
- [ ] Perfis `teacher` e `financeiro` no RBAC

## Longo prazo
- [ ] Multi-tenant real
- [ ] Billing SaaS
- [ ] PWA / App mobile nativo
- [ ] Integração com gateway de pagamento

---

# 📋 12. PROCESSO DE DESENVOLVIMENTO

## Padrão de commit
```
feat: nova funcionalidade
fix: correção de bug
refactor: melhoria sem mudança de comportamento
migration: alteração no banco de dados
docs: atualização de documentação
```

## Regras invioláveis

- Nunca commitar código não testado
- Nunca usar `alert()` — usar `Toast`
- Nunca usar `onclick` inline no HTML — eventos via `addEventListener` no JS
- Nunca converter IDs com `Number()` ou `parseInt()`
- Nunca fazer redirect fora do `auth.js`/`router.js`
- Nunca armazenar `JWT_SECRET` no código
- `document.addEventListener("click/input/change")` global **proibido**
- `git add .` **proibido** — sempre especificar arquivos explicitamente
- `checkAuth()` **proibido** dentro de módulos — exclusivo do `router.js`
- Módulos com `initDone` **devem** re-registrar eventos e recarregar dados ao voltar

---

*Documento mantido pelo time de desenvolvimento.*
*Última atualização: 31 de Março de 2026 — Sessão 5.0*