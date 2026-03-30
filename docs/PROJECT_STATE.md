# Bailado Carioca — Gestão Escolar
## Documento de Estado do Projeto (PROJECT_STATE)

> **Versão:** 4.0 — Março 2026
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
│   │   ├── private.css        ← NOVO
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
│   ├── api.js
│   ├── auth.js
│   ├── attendance.js
│   ├── cash.js                ← saldo acumulado, entradas/saídas do mês
│   ├── classes.js
│   ├── dashboard.js
│   ├── enrollments.js
│   ├── finance.js
│   ├── payments.js
│   ├── private.js             ← NOVO
│   ├── reports.js
│   ├── router.js              ← rota private adicionada
│   ├── students.js
│   ├── teachers.js
│   ├── toast.js
│   ├── units.js
│   └── utils.js
├── admin.html
├── app.html
├── attendance.html
├── cash.html
├── classes.html
├── dashboard.html
├── enrollments.html
├── index.html
├── payments.html
├── private.html               ← NOVO
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
│   │   │   └── admin.routes.ts
│   │   ├── attendance/
│   │   │   └── attendance.routes.ts
│   │   ├── auth/
│   │   │   └── auth.routes.ts
│   │   ├── classes/
│   │   │   └── classes.routes.ts
│   │   ├── enrollments/
│   │   │   └── enrollments.routes.ts
│   │   ├── payments/
│   │   │   ├── payments.routes.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── cash.routes.ts
│   │   │   └── cash.service.ts
│   │   ├── private/
│   │   │   └── private.routes.ts  ← NOVO
│   │   ├── students/
│   │   │   └── students.routes.ts
│   │   ├── teachers/
│   │   │   └── teachers.routes.ts
│   │   └── units/
│   │       └── units.routes.ts
│   ├── security/
│   │   ├── authorize.ts
│   │   └── jwt.ts
│   └── index.ts               ← private routes registrado
├── migrations/
│   ├── 0001 a 0022 ...
│   ├── 0023_create_private_packages.sql   ← NOVO
│   ├── 0024_create_private_sessions.sql   ← NOVO
│   └── 0025_create_private_payments.sql   ← NOVO
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

## Aulas Particulares — NOVO

### Tabelas criadas
- `private_packages` — pacote vendido ao aluno
- `private_sessions` — cada aula individual
- `private_payments` — pagamentos separados de mensalidades

### Regras de negócio
- Pacote padrão = 4 aulas (configurável)
- `sessions_used` só incrementa quando sessão é marcada como **completed** — nunca ao agendar
- Pacote muda para `completed` automaticamente quando `sessions_used >= total_sessions`
- Se sessão cancelada/no_show: decrementa `sessions_used` **apenas se estava completed**
- Pagamento gerado automaticamente ao criar pacote (status `pending`)
- Aula avulsa: `package_id = null`
- Dois locais fixos: `bailado_laranjeiras` | `student_home`
- Dois professores por sessão: `teacher_1_id` (obrigatório) + `teacher_2_id` (nullable)

### Fluxo financeiro
```
Criar pacote → payment gerado (pending)
     ↓
Agendar sessões → sessions_used NÃO muda
     ↓
Marcar sessão como completed → sessions_used++
     ↓
Marcar payment como paid → valor entra no recebido
```

### Endpoints
- `GET/POST /api/v1/private/packages`
- `PUT/DELETE /api/v1/private/packages/:id`
- `GET/POST /api/v1/private/sessions`
- `PATCH /api/v1/private/sessions/:id` — atualiza status
- `GET /api/v1/private/payments`
- `PATCH /api/v1/private/payments/:id` — marca como pago
- `GET /api/v1/private/payments/summary`

### Frontend
- Página `private.html` com 3 abas: Pacotes / Sessões / Pagamentos
- **Aba Sessões** tem toggle: "Por aluno" | "Por data"
  - **Por aluno:** cards agrupados por aluno com todas as sessões dentro
  - **Por data:** grupos Hoje / Esta semana / Próximas / Passadas
- KPIs: Pacotes ativos, Sessões agendadas, Recebido, Pendente
- Barra de progresso no card do pacote reflete apenas aulas realizadas

---

# 💰 6. ARQUITETURA FINANCEIRA

## Caixa — EVOLUÍDO
- **Saldo atual** = acumulado histórico (todas as entradas - todas as saídas)
- **Entradas do mês** = apenas entradas do mês corrente
- **Saídas do mês** = apenas saídas do mês corrente
- Cards zerados automaticamente ao virar o mês (filtro por mês no frontend)

## Bolsistas
| Tipo | `scholarship` | `discount` | Impacto financeiro |
|---|---|---|---|
| Regular | 0 | qualquer | Entra nos cálculos |
| Bolsa parcial | 1 | 1-99% | Entra com desconto |
| Bolsa integral | 1 | 100% | **Excluído dos cálculos** |

---

# 🖥️ 7. MÓDULOS DO SISTEMA

## Aulas Particulares — NOVO
- **Aba Pacotes:** cards com barra de progresso, professores, local, preço total e por aula
- **Aba Sessões:** toggle Por aluno / Por data — ações inline (✓ Realizada / ✖ Cancelar)
- **Aba Pagamentos:** tabela com status, tipo (pacote/avulsa), botão marcar pago

---

# 📱 8. RESPONSIVIDADE MOBILE/TABLET

## Breakpoints
| Breakpoint | Comportamento |
|---|---|
| > 1024px | Layout desktop completo |
| 768px–1024px | Tablet: sidebar 200px, grids 2 colunas |
| < 768px | Mobile: sidebar overlay + hamburguer |

---

# ⚠️ 9. INCIDENTES CRÍTICOS RESOLVIDOS (SESSÃO 4.0)

## 9.1 `sessions_used` incrementava ao agendar em vez de ao completar
- **Causa:** Lógica de incremento no POST de sessão
- **Correção:** Removido do POST, adicionado no PATCH quando `status = completed`
- **Impacto:** Barra de progresso reflete apenas aulas realizadas, não agendadas

## 9.2 Caixa mostrava acumulado histórico em entradas/saídas
- **Causa:** Sem filtro de período nos cards de entradas/saídas
- **Correção:** Saldo = acumulado histórico; Entradas/Saídas = apenas mês corrente

## 9.3 Abas de Aulas Particulares fora do padrão visual
- **Causa:** Classe `.private-tab` sem CSS definido
- **Correção:** Substituído por `.enrollment-tab` que já tem estilo correto

## 9.4 Login mobile — card pequeno em tela escura
- **Causa:** `height: 100vh` não funciona corretamente em alguns browsers mobile
- **Correção:** `html, body { height: 100%; min-height: -webkit-fill-available }` + `width: 100%` no card

---

# 🏁 10. STATUS ATUAL DO SISTEMA

| Área | Status | Detalhe |
|---|---|---|
| Backend | 🟢 Estável | Todos os módulos em produção, varredura completa |
| Autenticação | 🟢 Hardened | JWT 8h, register bloqueado, name no /me |
| Frontend | 🟢 Estabilizado | SPA sem race conditions |
| Financeiro | 🟢 Avançado | DRE + bolsistas + exportação + caixa por mês |
| Presença | 🟢 Ativo | Chamada + histórico + dashboard |
| Mobile | 🟢 Responsivo | Hamburguer + overlay + login corrigido |
| Aulas Particulares | 🟢 Ativo | Pacotes + sessões + pagamentos + toggle de visão |
| Deploy | 🟢 Estável | Cloudflare Pages + Workers |
| Segurança | 🟢 Reforçada | Varredura completa de todas as rotas |

---

# 📋 11. USUÁRIOS DO SISTEMA (PRODUÇÃO)

| Email | Role | Observação |
|---|---|---|
| alvessilvaedson125@gmail.com | admin | Usuário principal |
| tavarescampos.livia@gmail.com | admin | |
| bailadocarioca@gmail.com | operator | Senha: bailado_operador |
| edson@bailado.com | admin | |

---

# 🚀 12. ROADMAP EVOLUTIVO

## Pendente curto prazo
- [ ] Integrar aulas particulares no Dashboard (receita consolidada)
- [ ] Integrar aulas particulares nos Relatórios
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

# 📋 13. PROCESSO DE DESENVOLVIMENTO

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
- Nunca usar `onclick` inline no HTML — eventos via JS
- Nunca converter IDs com `Number()` ou `parseInt()`
- Nunca fazer redirect fora do `auth.js`/`router.js`
- Nunca armazenar `JWT_SECRET` no código
- `document.addEventListener("click")` global **proibido** — causa interferência entre módulos
- `git add .` **proibido** — sempre especificar arquivos explicitamente

---

*Documento mantido pelo time de desenvolvimento.*
*Última atualização: 30 de Março de 2026 — Sessão 4.0*