# Bailado Carioca — PROJECT STATE (SaaS)

## 🧱 Arquitetura Atual

### Frontend
- SPA (Vanilla JS modular)
- Renderização dinâmica via innerHTML
- Router próprio (router.js)
- Estado em memória (cache local por módulo)

### Backend
- Cloudflare Workers (TypeScript)
- Arquitetura modular por domínio
- Middleware de autenticação (JWT)
- RBAC básico (admin / operator)

### Banco
- Cloudflare D1 (SQLite)
- Migrations versionadas
- Soft delete (deleted_at)

---

## 🧩 Módulos do Sistema

### Frontend (Responsabilidade)

| Módulo       | Responsabilidade |
|-------------|-----------------|
| dashboard   | métricas + DRE |
| students    | CRUD alunos |
| classes     | CRUD turmas |
| enrollments | vínculo aluno ↔ turma |
| payments    | mensalidades |
| cash        | fluxo de caixa |
| auth        | login + sessão |
| router      | navegação SPA |
| api         | camada HTTP |

---

### Backend (Contratos)

#### Auth
- POST /auth/login → retorna JWT
- GET /auth/me → valida sessão

#### Students
- GET /students
- POST /students

#### Classes
- GET /classes
- POST /classes
- PUT /classes/:id

#### Enrollments
- POST /enrollments

#### Payments
- POST /payments/generate
- GET /payments

#### Cash
- GET /cash
- POST /cash

---

## 🔗 Fluxo de Dados (Pipeline Financeiro)

```txt
Students
   ↓
Enrollments
   ↓
Payments (geração mensal)
   ↓
Cash (entrada real)
   ↓
Dashboard (DRE)