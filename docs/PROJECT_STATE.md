# Bailado Carioca — PROJECT STATE (SaaS)

## 📌 Visão Geral

O sistema **Bailado Carioca – Gestão de Aulas** é uma aplicação SaaS modular voltada para gestão de escolas de dança, com foco em controle acadêmico, financeiro e operacional.

A arquitetura foi projetada para ser:
- Modular
- Escalável
- Serverless
- Segura
- Orientada a domínio

---

## 🧱 Arquitetura

### 🔹 Frontend

- SPA (Single Page Application) em Vanilla JavaScript modular
- Renderização dinâmica via `innerHTML`
- Router próprio (`router.js`)
- Gerenciamento de estado em memória por módulo (cache local)
- Comunicação com backend via camada centralizada (`api.js`)

📌 Características:
- Baixo acoplamento
- Sem dependência de frameworks
- Controle total do fluxo de renderização

---

### 🔹 Backend

- Cloudflare Workers (TypeScript)
- Arquitetura modular por domínio (Domain-driven structure)
- Middleware de autenticação via JWT
- RBAC (Role-Based Access Control) com perfis:
  - `admin`
  - `operator`
- Tratamento centralizado de CORS

📌 Características:
- Serverless distribuído globalmente
- Baixa latência
- Alta disponibilidade
- Separação clara de responsabilidades por módulo

---

### 🔹 Banco de Dados

- Cloudflare D1 (SQLite)
- Migrations versionadas e incrementais
- Soft delete (`deleted_at`)
- Relacionamentos normalizados entre entidades

📌 Características:
- Integrado ao Worker
- Estrutura preparada para crescimento
- Segurança na persistência de dados

---

## 🧩 Módulos do Sistema

### 🔸 Frontend (Responsabilidades)

| Módulo       | Responsabilidade |
|-------------|-----------------|
| dashboard   | métricas e DRE (resultado financeiro) |
| students    | CRUD de alunos |
| classes     | CRUD de turmas |
| enrollments | vínculo aluno ↔ turma |
| payments    | geração e controle de mensalidades |
| cash        | fluxo de caixa (entradas/saídas) |
| auth        | autenticação e sessão |
| router      | navegação SPA |
| api         | camada de comunicação HTTP |

---

### 🔸 Backend (Contratos de API)

#### Auth
- `POST /api/v1/auth/login` → autenticação e geração de JWT
- `GET /api/v1/auth/me` → validação de sessão

#### Students
- `GET /api/v1/students`
- `POST /api/v1/students`

#### Classes
- `GET /api/v1/classes`
- `POST /api/v1/classes`
- `PUT /api/v1/classes/:id`

#### Enrollments
- `POST /api/v1/enrollments`

#### Payments
- `POST /api/v1/payments/generate`
- `GET /api/v1/payments`

#### Cash
- `GET /api/v1/cash`
- `POST /api/v1/cash`

---

## 🔗 Fluxo de Dados (Pipeline Financeiro)

```txt
Students
   ↓
Enrollments
   ↓
Payments (geração mensal)
   ↓
Cash (entrada financeira real)
   ↓
Dashboard (DRE consolidado)