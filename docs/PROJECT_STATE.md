# Bailado Carioca — Gestão Escolar
## Documento de Estado do Projeto (PROJECT_STATE)

> **Versão:** 7.0 — Abril 2026
> **Status:** Produção ativa — Pronto para uso real
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
| Refresh token automático | ✅ Implementado |
| Paginação nas tabelas principais | ✅ Implementado |
| Módulo de administração de usuários | ✅ Implementado |
| Módulo de presença (chamada) | ✅ Implementado |
| Frequência média no dashboard | ✅ Implementado |
| Bolsistas com formulário separado | ✅ Implementado |
| Impacto financeiro de bolsas | ✅ Implementado |
| Layout por turma nas matrículas | ✅ Implementado |
| Responsividade mobile/tablet | ✅ Implementado |
| Tabela turmas em cards no mobile | ✅ Implementado |
| Nome do usuário logado no header | ✅ Implementado |
| Register bloqueado após primeiro admin | ✅ Implementado |
| Validação de email duplicado | ✅ Implementado |
| Caixa — saldo acumulado + entradas/saídas do mês | ✅ Implementado |
| Aulas Particulares — pacotes, sessões, pagamentos | ✅ Implementado |
| Sessões — toggle por aluno / por data colorido | ✅ Implementado |
| Dashboard integrado com aulas particulares | ✅ Implementado |
| Relatórios com DRE consolidado | ✅ Implementado |
| Varredura completa de qualidade do frontend | ✅ Concluído |
| Perfil do aluno com matrículas e total mensal | ✅ Implementado |
| Coluna bolsistas separada na tabela de turmas | ✅ Implementado |
| Alunos externos (origin=private) | ✅ Implementado |
| Aba Alunos Externos em Aulas Particulares | ✅ Implementado |
| Payment automático para aulas avulsas | ✅ Implementado |
| Backup automático D1 via GitHub Actions | ✅ Implementado |
| Proteção contra pagamento duplicado | ✅ Implementado |
| Mensagem amigável ao expirar sessão | ✅ Implementado |

---

# 🧠 2. PRINCÍPIOS ARQUITETURAIS

## 2.1 Backend como fonte única da verdade

- Nenhuma regra crítica reside no frontend
- Toda validação e lógica de negócio são centralizadas no backend
- O frontend é estritamente uma camada de apresentação
- IDs são tratados como **strings (UUID)** em todas as camadas

## 2.2 Separação de responsabilidades

| Camada | Responsabilidade |
|---|---|
| Auth | Sessão e identidade |
| Domínio | Regras de negócio |
| Infra | Comunicação (API, fetch) |
| UI | Renderização e interação |

## 2.3 Controle de fluxo determinístico

- `router.js` é o único ponto de `checkAuth` — módulos nunca chamam `checkAuth`
- `api.js` não manipula `window.location` diretamente
- Redirecionamentos exclusivos do `auth.js`/`router.js`
- Refresh token transparente — fila de requisições aguarda novo token

## 2.4 Regra de ouro de engenharia
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

### Backend
| Camada | Tecnologia |
|---|---|
| Runtime | Cloudflare Workers (edge serverless) |
| Linguagem | TypeScript |
| Banco | Cloudflare D1 — `bailado_carioca_escola_db` (081c69b7-c6ad-441b-98b7-84c555b7d147) |
| Auth | JWT HMAC SHA-256 (crypto.subtle), 8h + refresh automático |
| Backup | GitHub Actions — todo dia 03:00 UTC, artifacts 30 dias |

## 3.2 Estrutura do Frontend
```
bailado-carioca-erp-front/
├── css/pages/
│   ├── private.css       ← títulos por data coloridos
│   ├── students.css      ← perfil do aluno, total mensal
│   ├── teachers.css      ← data-table padronizado
│   ├── units.css         ← espaçamento correto
│   ├── classes.css       ← modal .active, scholarship badge, mobile cards
│   └── ...
├── js/
│   ├── api.js            ← refresh token automático com fila
│   ├── auth.js
│   ├── router.js         ← único ponto de checkAuth
│   ├── students.js       ← perfil do aluno, total mensal
│   ├── classes.js        ← scholarship_count, data-label mobile
│   ├── enrollments.js    ← setupTabs re-registrado, checkOpenEnrollmentModal
│   ├── private.js        ← alunos externos, payment avulsa
│   └── ...
├── students.html         ← modal perfil separado
├── classes.html          ← th Bolsistas
├── private.html          ← aba Alunos Externos
└── ...
```

## 3.3 Estrutura do Backend
```
bailado-carioca-escola-api/
├── .github/workflows/
│   └── backup.yml           ← backup automático D1, todo dia 03:00 UTC
├── src/modules/
│   ├── auth/auth.routes.ts  ← POST /refresh adicionado
│   ├── students/students.routes.ts  ← filtro origin, validação email duplicado
│   ├── classes/classes.routes.ts    ← scholarship_count na query
│   ├── private/private.routes.ts    ← payment automático avulsa
│   └── ...
├── migrations/
│   └── 0026: ALTER TABLE students ADD COLUMN origin TEXT NOT NULL DEFAULT 'school'
└── wrangler.jsonc
```

---

# 🔐 4. SEGURANÇA

- JWT HMAC SHA-256, expiração 8h
- Refresh token: `POST /api/v1/auth/refresh` — renova token transparentemente
- RBAC: `admin` e `operator`
- Register bloqueado após primeiro admin
- `requireAuth` retorna `Response` diretamente
- Validação de email duplicado em alunos e usuários
- Proteção contra pagamento duplicado no backend

## 4.1 Fluxo de sessão
```
Login → token 8h
→ Requisição com token válido → OK
→ Requisição com token expirado → refresh automático → novo token → retry
→ Refresh falhou → Toast "Sessão expirada" → redirect login após 2s
```

## 4.2 Backup

| Item | Detalhe |
|---|---|
| Estratégia | GitHub Actions + Wrangler queries por tabela |
| Frequência | Todo dia às 03:00 UTC (00:00 Brasília) |
| Retenção | 30 dias de artifacts no GitHub |
| Acesso | Actions → run → Artifacts → baixar `.sql` |
| Manual | Actions → Run workflow → Run workflow |
| Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

---

# 🧩 5. MODELO DE DOMÍNIO

## Pipeline central
```
Students (origin=school) → Enrollments → Payments → Cash → Dashboard/Reports
Students (origin=private) → private_packages → private_sessions → private_payments
```

## Alunos — origin

| origin | Descrição |
|---|---|
| `school` | Aluno da escola — aparece em Alunos e pode ser matriculado |
| `private` | Aluno externo — aparece só em Aulas Particulares → Alunos Externos |

## Aulas Particulares

### Regras de negócio
- Pacote: `sessions_used` só incrementa quando sessão marcada como `completed`
- Aula avulsa com `price > 0` → gera `private_payment` automaticamente
- `origin_type = 'package'` para pacotes, `origin_type = 'session'` para avulsas
- Selects mostram **todos** os alunos (escola + externos)

### Fluxo financeiro
```
Pacote criado → private_payment pending (origin_type=package)
Avulsa criada com price > 0 → private_payment pending (origin_type=session)
Marcar pago → private_payment paid → aparece no recebido
```

---

# 💰 6. ARQUITETURA FINANCEIRA

## DRE Consolidado
- Mensalidades (`payments`) + Aulas Particulares (`private_payments`)
- Dashboard: `recebidoTotal = recebido + privPaid`
- Relatórios: DRE com linha separada por origem

## Caixa
- Saldo = acumulado histórico
- Entradas/Saídas = apenas mês corrente

## Bolsistas

| Tipo | `scholarship` | `discount` | Contagem turma |
|---|---|---|---|
| Regular | 0 | qualquer | Coluna Alunos |
| Bolsista | 1 | qualquer | Coluna Bolsistas |
| Integral | 1 | 100% | Coluna Bolsistas, excluído do financeiro |

---

# 🖥️ 7. MÓDULOS — ESTADO ATUAL

## Alunos
- Tabela com status ativo/inativo baseado em matrículas
- **Perfil do aluno** — modal com matrículas, papel, status e total mensal
- Botão "Matricular em outra turma" — navega para Matrículas com aluno pré-selecionado
- Validação de email duplicado no POST e PUT
- Filtro `origin=school` implícito

## Turmas
- Tabela com colunas: Nome, Professor, Unidade, Dia, Horário, Alunos, Bolsistas, Ações
- No mobile: vira cards com `data-label`
- Alunos = regulares (scholarship=0), Bolsistas = scholarship=1

## Matrículas
- Aba Regular + Aba Bolsistas
- `checkOpenEnrollmentModal` abre modal com aluno pré-selecionado vindo do perfil

## Aulas Particulares
- **Pacotes** — cards com barra de progresso
- **Sessões** — toggle Por aluno / Por data com títulos coloridos
- **Pagamentos** — editar + marcar pago, proteção contra duplicado
- **Alunos Externos** — CRUD completo, `origin=private`

## API
- Refresh token transparente com fila de requisições paralelas
- Toast + redirect ao falhar refresh
- Timeout de 10s por requisição

---

# ⚠️ 8. INCIDENTES RESOLVIDOS (SESSÃO 7.0)

| Problema | Correção |
|---|---|
| Sessão expirava sem aviso | Refresh token automático + Toast + redirect |
| Email duplicado em alunos | Validação no POST e PUT de students |
| Tabela turmas cortada no mobile | Cards com `data-label` via CSS |
| Mensagem ao expirar sessão | `tryRefreshToken` mostra Toast antes de redirecionar |
| Pagamento duplicado | Backend rejeita PATCH se `status = paid` |

---

# 🏁 9. STATUS ATUAL

| Área | Status | Detalhe |
|---|---|---|
| Backend | 🟢 Estável | Todos os módulos em produção |
| Frontend | 🟢 Limpo | Varredura completa concluída |
| Autenticação | 🟢 Hardened | JWT 8h + refresh automático + mensagem de expiração |
| Financeiro | 🟢 Avançado | DRE consolidado, avulsas com payment automático |
| Alunos | 🟢 Completo | Perfil, matrículas, total mensal, origin, email único |
| Turmas | 🟢 Completo | Bolsistas separados, mobile em cards |
| Aulas Particulares | 🟢 Completo | Pacotes + sessões + pagamentos + externos |
| Mobile | 🟢 Responsivo | Hamburguer + overlay + cards de turma |
| Deploy | 🟢 Estável | Cloudflare Pages + Workers |
| Backup | 🟢 Automático | GitHub Actions, 03:00 UTC, 30 dias |
| Segurança | 🟢 Reforçada | Email único, pagamento duplicado bloqueado |

---

# 📋 10. USUÁRIOS DO SISTEMA (PRODUÇÃO)

| Email | Role |
|---|---|
| alvessilvaedson125@gmail.com | admin |
| tavarescampos.livia@gmail.com | admin |
| bailadocarioca@gmail.com | operator |
| edson@bailado.com | admin |

---

# 🚀 11. ROADMAP

## Curto prazo
- [ ] Logs estruturados no backend
- [ ] Filtro por unidade nos relatórios
- [ ] Exportação de relatório de frequência

## Médio prazo
- [ ] Notificações de inadimplência
- [ ] Agenda visual (grid semanal)
- [ ] Perfis `teacher` e `financeiro` no RBAC

## Longo prazo
- [ ] Multi-tenant real
- [ ] Billing SaaS
- [ ] PWA / App mobile nativo
- [ ] Integração com gateway de pagamento

---

# 📋 12. REGRAS INVIOLÁVEIS

- Nunca usar `alert()` — usar `Toast`
- Nunca usar `onclick` inline no HTML
- Nunca converter IDs com `Number()` ou `parseInt()`
- Nunca fazer redirect fora do `auth.js`/`router.js`
- `document.addEventListener("click/input/change")` global **proibido**
- `git add .` **proibido**
- `checkAuth()` **proibido** dentro de módulos
- Módulos com `initDone` devem re-registrar eventos ao voltar

---

*Última atualização: 01 de Abril de 2026 — Sessão 7.0*