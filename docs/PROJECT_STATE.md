# Bailado Carioca — Gestão Escolar
## Documento de Estado do Projeto (PROJECT_STATE)

> **Versão:** 3.0 — Março 2026
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
│   │   ├── payments.css       ← NOVO
│   │   ├── reports.css
│   │   ├── students.css
│   │   ├── teachers.css
│   │   └── units.css
│   ├── base.css
│   ├── components.css
│   ├── layout.css             ← responsividade mobile/tablet
│   ├── style.css
│   └── variables.css
├── js/
│   ├── api.js
│   ├── auth.js                ← role salvo no localStorage
│   ├── attendance.js          ← NOVO
│   ├── cash.js
│   ├── classes.js
│   ├── dashboard.js
│   ├── enrollments.js         ← abas Matrículas/Bolsistas
│   ├── finance.js             ← bolsistas integrais excluídos
│   ├── payments.js
│   ├── reports.js
│   ├── router.js              ← checkAuth com name+role, menu RBAC
│   ├── students.js
│   ├── teachers.js
│   ├── toast.js
│   ├── units.js
│   └── utils.js
├── admin.html
├── app.html                   ← hamburguer mobile, sidebar overlay
├── attendance.html            ← NOVO
├── cash.html
├── classes.html
├── dashboard.html
├── enrollments.html           ← abas + modal bolsa separado
├── index.html
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
│   │   │   └── admin.routes.ts
│   │   ├── attendance/
│   │   │   └── attendance.routes.ts   ← NOVO — chamada + /dashboard
│   │   ├── auth/
│   │   │   └── auth.routes.ts         ← register bloqueado, name no /me
│   │   ├── classes/
│   │   │   └── classes.routes.ts
│   │   ├── enrollments/
│   │   │   └── enrollments.routes.ts  ← JOIN com units, operator pode criar
│   │   ├── payments/
│   │   │   ├── payments.routes.ts
│   │   │   ├── payments.service.ts    ← bolsistas integrais pulados
│   │   │   ├── cash.routes.ts         ← requireRole adicionado
│   │   │   └── cash.service.ts        ← Response.json, date normalizada
│   │   ├── students/
│   │   │   └── students.routes.ts
│   │   ├── teachers/
│   │   │   └── teachers.routes.ts     ← validação name, verificação existência
│   │   └── units/
│   │       └── units.routes.ts        ← verificação existência no PUT/DELETE
│   ├── security/
│   │   ├── authorize.ts               ← requireAuth retorna Response direto
│   │   └── jwt.ts
│   └── index.ts                       ← ordem corrigida, cash autenticado
├── migrations/
│   ├── 0001 a 0021 ...
│   └── 0022_add_date_to_cash_entries.sql  ← NOVO
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

## 4.3 Controle de menu no frontend

- `user_role` salvo no `localStorage` após login e atualizado em cada `checkAuth`
- Menu "Administração" oculto para operadores via classe `.menu-admin-only`
- `admin.js` bloqueia acesso direto para operadores com mensagem visual

---

# 🧩 5. MODELO DE DOMÍNIO

## Pipeline central
```
Students → Enrollments (regular + scholarship) → Payments → Cash → Dashboard/Reports
```

## Entidades principais

### Enrollments (Matrículas)
- **Dois fluxos separados:** matrículas regulares e bolsistas
- Campo `scholarship` (0/1) diferencia os dois tipos
- Bolsistas integrais (`scholarship=1 AND final_amount=0`) excluídos dos cálculos financeiros
- 4 papéis com gênero: `conductor_m`, `conductor_f`, `follower_f`, `follower_m`
- Layout por turma na visualização (cards agrupados)

### Attendance (Presença) — NOVO
- Tabela `attendance` criada na migration 0021
- Registro de chamada por turma + data em lote
- Histórico de frequência por aluno com % e badge
- Endpoint `/api/v1/attendance/dashboard` para frequência média geral

### Cash (Caixa)
- Coluna `date` adicionada na migration 0022
- Data normalizada para `YYYY-MM-DD`
- Verificação de existência antes de cancelar

---

# 💰 6. ARQUITETURA FINANCEIRA

## Bolsistas

| Tipo | `scholarship` | `discount` | Impacto financeiro |
|---|---|---|---|
| Regular | 0 | qualquer | Entra nos cálculos |
| Bolsa parcial | 1 | 1-99% | Entra com desconto |
| Bolsa integral | 1 | 100% | **Excluído dos cálculos** |

- Impacto mensal calculado e exibido nos cards de bolsistas
- Stat "Impacto bolsas" no header da tela de matrículas

---

# 🖥️ 7. MÓDULOS DO SISTEMA

## Dashboard
- KPIs: Recebido, Esperado, Eficiência, Inadimplência
- Saúde: Caixa, Total Consolidado, **Frequência Média**, Status Geral
- Gráfico: Recebido vs Esperado — últimos 6 meses
- Ranking de turmas por eficiência

## Matrículas — EVOLUÍDO
- **Aba Matrículas:** layout por turma em cards, sem tabela
- **Aba Bolsistas:** cards com impacto financeiro detalhado
- Dois formulários separados: Nova Matrícula / Nova Bolsa
- Stats: Total, Ativas, Inativas, Bolsistas, Impacto bolsas

## Presença — NOVO
- Seleção de turma + data
- Registro de chamada em lote (presente/ausente)
- Botão "Todos presentes"
- Histórico de frequência por turma com % e badges

## Relatórios — EVOLUÍDO
- Exportação **CSV** (resumo + ranking + pagamentos)
- Exportação **PDF** via `window.print()`

## Pagamentos — EVOLUÍDO
- Layout profissional com `payments.css` dedicado
- KPIs com borda colorida (sem fundo sólido)
- Paginação 15/pág

---

# 📱 8. RESPONSIVIDADE MOBILE/TABLET — NOVO

## Breakpoints

| Breakpoint | Comportamento |
|---|---|
| > 1024px | Layout desktop completo |
| 768px–1024px | Tablet: sidebar 200px, grids 2 colunas |
| < 768px | Mobile: sidebar overlay + hamburguer |

## Funcionalidades mobile

- Menu hamburguer (☰) no header
- Sidebar como overlay com backdrop escuro
- Fecha automaticamente ao navegar
- Grids de KPIs 2×2
- Formulários em coluna única
- Modais fullscreen (95vw)
- Tabelas com scroll horizontal
- Cards de matrícula adaptados

---

# ⚠️ 9. INCIDENTES CRÍTICOS RESOLVIDOS (SESSÃO 3.0)

## 9.1 Cash sem autenticação
- **Causa:** `cashRoutes` não recebia `user` e não chamava `requireRole`
- **Correção:** `user` passado via `index.ts`, `requireRole` adicionado em cada endpoint

## 9.2 `requireAuth` retornava `{ error: Response }` em vez de `Response`
- **Causa:** Wrapping desnecessário quebrando `instanceof Response` no `index.ts`
- **Correção:** `requireAuth` retorna `Response` diretamente em caso de erro

## 9.3 Coluna `date` ausente em `cash_entries`
- **Causa:** `cash.service.ts` refatorado para usar coluna `date` que não existia
- **Correção:** Migration 0022 adicionou a coluna e migrou dados de `created_at`

## 9.4 `throw err` antes de `skipped++` em `payments.service.ts`
- **Causa:** Código morto após `throw` — erro interrompia geração inteira
- **Correção:** `try/catch` por registro, erro loga e pula sem interromper

## 9.5 Register aberto permitia qualquer pessoa criar conta
- **Causa:** Endpoint público sem restrição
- **Correção:** Register bloqueado após primeiro admin criado

## 9.6 Modal turmas não abria (`.hidden` vs `.active`)
- **Causa:** CSS usava `.active` para mostrar, JS removia `.hidden`
- **Correção:** JS usa `classList.add("active")` e CSS tem `display:flex` em `.active`

## 9.7 `initDone` sem recarregar dados ao voltar para a página
- **Causa:** `if(initDone) return` sem chamar `loadData()` ou re-registrar botões
- **Correção:** Ao voltar, chama `loadData()` + `setupBtn()` antes de retornar

---

# 🏁 10. STATUS ATUAL DO SISTEMA

| Área | Status | Detalhe |
|---|---|---|
| Backend | 🟢 Estável | Todos os módulos em produção, varredura completa |
| Autenticação | 🟢 Hardened | JWT 8h, register bloqueado, name no /me |
| Frontend | 🟢 Estabilizado | SPA sem race conditions |
| Financeiro | 🟢 Avançado | DRE + bolsistas + exportação |
| Presença | 🟢 Ativo | Chamada + histórico + dashboard |
| Mobile | 🟢 Responsivo | Hamburguer + overlay + grids adaptados |
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
- [ ] Tela login mobile — card pequeno (login.css responsivo)
- [ ] Tabela Turmas/Professores no mobile — colunas cortadas
- [ ] Relatórios — header duplicado no mobile
- [ ] Refresh token
- [ ] Logs estruturados no backend

## Médio prazo
- [ ] Filtro por unidade nos relatórios
- [ ] Exportação de relatório de frequência
- [ ] Notificações de inadimplência
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

---

*Documento mantido pelo time de desenvolvimento.*
*Última atualização: 30 de Março de 2026 — Sessão 3.0*