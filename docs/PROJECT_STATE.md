# Bailado Carioca — Gestão Escolar
## Documento de Estado do Projeto (PROJECT_STATE)

> **Versão:** 6.0 — Abril 2026
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
| Sessões — toggle por aluno / por data colorido | ✅ Implementado |
| Dashboard integrado com aulas particulares | ✅ Implementado |
| Relatórios com DRE consolidado | ✅ Implementado |
| Varredura completa de qualidade do frontend | ✅ Concluído |
| Perfil do aluno com matrículas e total mensal | ✅ Implementado |
| Coluna bolsistas separada na tabela de turmas | ✅ Implementado |
| Alunos externos (origin=private) | ✅ Implementado |
| Aba Alunos Externos em Aulas Particulares | ✅ Implementado |
| Payment automático para aulas avulsas | ✅ Implementado |

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
- `api.js` não manipula `window.location`
- Redirecionamentos exclusivos do `auth.js`/`router.js`

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
| Auth | JWT HMAC SHA-256 (crypto.subtle) |

## 3.2 Estrutura do Frontend
```
bailado-carioca-erp-front/
├── css/pages/
│   ├── private.css       ← títulos por data coloridos
│   ├── students.css      ← perfil do aluno, total mensal
│   ├── teachers.css      ← data-table padronizado
│   ├── units.css         ← espaçamento correto
│   ├── classes.css       ← modal .active, scholarship badge
│   └── ...
├── js/
│   ├── api.js            ← signal corrigido
│   ├── auth.js
│   ├── router.js         ← único ponto de checkAuth
│   ├── students.js       ← perfil do aluno, total mensal
│   ├── classes.js        ← scholarship_count na tabela
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
├── src/modules/
│   ├── students/students.routes.ts  ← filtro origin, POST aceita origin
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
- RBAC: `admin` e `operator`
- Register bloqueado após primeiro admin
- `requireAuth` retorna `Response` diretamente

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
- Aula avulsa com `price > 0` → gera `private_payment` automaticamente com `status = pending`
- `origin_type = 'package'` para pacotes, `origin_type = 'session'` para avulsas
- Selects de pacote/sessão mostram **todos** os alunos (escola + externos)

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
- **Perfil do aluno** — modal com todas as matrículas, papel, status e total mensal
- Botão "Matricular em outra turma" — navega para Matrículas com aluno pré-selecionado
- Filtro `origin=school` implícito (alunos externos não aparecem aqui)

## Turmas
- Tabela com colunas: Nome, Professor, Unidade, Dia, Horário, **Alunos**, **Bolsistas**, Ações
- Alunos = regulares (scholarship=0)
- Bolsistas = scholarship=1, badge amarelo

## Matrículas
- Aba Regular + Aba Bolsistas
- `checkOpenEnrollmentModal` abre modal automaticamente vindo do perfil do aluno
- Aluno pré-selecionado e bloqueado quando vindo do perfil

## Aulas Particulares
- **Pacotes** — cards com barra de progresso
- **Sessões** — toggle Por aluno / Por data (títulos coloridos: hoje=vermelho, semana=amarelo, próximas=verde, passadas=cinza)
- **Pagamentos** — tabela com botão editar e marcar pago
- **Alunos Externos** — CRUD completo, `origin=private`

---

# ⚠️ 8. INCIDENTES RESOLVIDOS (SESSÃO 6.0)

| Problema | Correção |
|---|---|
| Aula avulsa não gerava payment | POST sessão cria `private_payment` se `!package_id && price > 0` |
| Bolsista contado nos alunos regulares | Subquery separa `scholarship=0` dos alunos, `scholarship=1` na coluna bolsistas |
| Aba bolsistas não abria ao voltar | `setupTabs` re-registrado no `if(initDone)` |
| Modal turmas abre junto com a página | Tag `</div>` do modal fechada prematuramente |
| Botão Ver aluno navegava para matrículas | Substituído por modal de perfil inline |
| Alunos externos misturados com escola | Campo `origin` na tabela `students`, filtro por querystring |
| `teachers.css` sem espaçamento | Reescrito com `data-table` padrão do sistema |
| `units.css` sem espaçamento | Reescrito com espaçamento correto |

---

# 🏁 9. STATUS ATUAL

| Área | Status | Detalhe |
|---|---|---|
| Backend | 🟢 Estável | Todos os módulos em produção |
| Frontend | 🟢 Limpo | Varredura completa concluída |
| Financeiro | 🟢 Avançado | DRE consolidado, avulsas com payment automático |
| Alunos | 🟢 Completo | Perfil, matrículas, total mensal, origin |
| Turmas | 🟢 Completo | Bolsistas separados na contagem |
| Aulas Particulares | 🟢 Completo | Pacotes + sessões + pagamentos + externos |
| Mobile | 🟢 Responsivo | Hamburguer + overlay |
| Deploy | 🟢 Estável | Cloudflare Pages + Workers |

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
- [ ] Tabela Turmas/Professores no mobile — colunas cortadas
- [ ] Refresh token
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

*Última atualização: 01 de Abril de 2026 — Sessão 6.0*