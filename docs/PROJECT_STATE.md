# Bailado Carioca — Estado do Projeto (SaaS)

## 🧱 Arquitetura Atual

- Frontend: SPA (HTML, CSS, JS puro)
- Backend: Cloudflare Workers (TypeScript)
- Banco: Cloudflare D1 (SQLite)
- Infraestrutura: Serverless (Cloudflare)

---

## 🧩 Módulos Existentes

### Frontend
- dashboard.js
- students.js
- classes.js
- enrollments.js
- payments.js
- cash.js
- router.js
- auth.js
- api.js

### Backend
- auth
- students
- classes
- enrollments
- payments
- cash

---

## 🔗 Fluxo de Dados (Financeiro)

Enrollments → Payments → Cash → Dashboard (DRE)

- Matrícula gera mensalidades
- Pagamentos atualizam status
- Caixa registra entradas/saídas
- Dashboard consolida (DRE)

---

## 📡 Endpoints Principais

### Auth
- POST /api/v1/auth/login
- GET /api/v1/auth/me

### Students
- GET /api/v1/students
- POST /api/v1/students

### Payments
- POST /api/v1/payments/generate
- GET /api/v1/payments

### Cash
- GET /api/v1/cash
- POST /api/v1/cash

---

## 🔐 Segurança

- JWT (Bearer Token)
- RBAC: admin / operator
- Futuro: JWT assinado (criptográfico)

---

## ⚙️ Decisões Arquiteturais

- SPA sem framework
- Router próprio (router.js)
- API REST padrão { success, data }
- Sem funções globais duplicadas
- Módulos isolados

---

## ⚠️ Problemas Já Resolvidos

- conflito de escopo entre dashboard e payments
- erro de inicialização de módulos
- inconsistência entre "in/out" vs "entrada/saida"
- erro de migration local vs remote

---

## 🚧 Estado Atual

- Payments: OK
- Cash: OK (com DRE)
- Dashboard: OK (métricas + financeiro)
- Auth: OK
- Router: OK

---

## 🚀 Próximos Passos

### Curto prazo
- padronizar init() em todos módulos
- melhorar UI dashboard
- melhorar validação backend

### Médio prazo
- relatórios financeiros
- filtros avançados
- exportação CSV/PDF

### Longo prazo
- multi-tenant (tenant_id)
- billing SaaS
- analytics avançado

---

## 🧠 Regras do Projeto

- SEMPRE fazer backup antes de mudar DB
- mudanças incrementais
- evitar gambiarras
- um passo por vez
- validar sempre em produção (wrangler deploy)
