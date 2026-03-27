
# 🧭 1. VISÃO ESTRATÉGICA

O sistema **Bailado Carioca – Gestão Escolar** evoluiu para um **SaaS modular em estado de produção**, com base arquitetural preparada para:

* Operação multiusuário (ativa)
* Expansão multiunidade (suportada)
* Escalabilidade comercial (SaaS)
* Gestão financeira estruturada e auditável

O sistema já ultrapassa o estágio de CRUD e opera como **plataforma de gestão especializada**.

---

# 🧠 2. PRINCÍPIOS ARQUITETURAIS

## 2.1 Backend como fonte única da verdade

* Nenhuma regra crítica reside no frontend
* Toda validação e lógica de negócio são centralizadas no backend
* O frontend é estritamente uma camada de apresentação

---

## 2.2 Separação de responsabilidades

| Camada  | Responsabilidade               |
| ------- | ------------------------------ |
| Auth    | Sessão e identidade            |
| Domínio | Regras de negócio              |
| Infra   | Comunicação (API, fetch, etc.) |
| UI      | Renderização                   |

---

## 2.3 Controle de fluxo determinístico

* Nenhuma decisão crítica deve ocorrer em múltiplos pontos
* Navegação e autenticação possuem **pontos únicos de decisão**

---

## 2.4 Evolução sem ruptura

* Deploy incremental
* Versionamento disciplinado
* Migrações idempotentes
* Compatibilidade retroativa sempre que possível

---

## 2.5 Segurança progressiva

* JWT (em transição para assinatura real)
* RBAC ativo
* Expiração baseada em status HTTP (401)
* Controle de sessão centralizado

---

# 🧱 3. ARQUITETURA DO SISTEMA

---

## 🔹 3.1 FRONTEND — SPA CONTROLADA

### Stack

* HTML + CSS + JavaScript puro
* Cloudflare Pages
* Arquitetura SPA manual (router custom)

---

## 🔒 3.1.1 Pipeline de execução (OBRIGATÓRIO)

Ordem de carregamento:

```html
CORE → AUTH → ROUTER → MÓDULOS → DASHBOARD
```

### Garantias:

* Evita race conditions
* Evita execução fora de ordem
* Mantém previsibilidade total

---

## 🔒 3.1.2 Isolamento de contextos

### index.html (login)

* NÃO executa router
* NÃO chama `/auth/me`
* Responsável apenas por autenticação inicial

### app.html (sistema)

* Executa router
* Executa validação de sessão
* Renderiza módulos

---

## 🔒 3.1.3 Fluxo oficial de autenticação

```txt
Login → Token → App → /auth/me → Renderização
```

---

## 🔒 3.1.4 Gestão de sessão

* Token armazenado em `localStorage`
* Validação sempre via backend
* 401 → invalidação de sessão

---

## ⚠️ 3.1.5 HARDENING DE SPA (CRÍTICO)

Durante a evolução, foi identificado e corrigido um risco estrutural clássico:

### 🔥 Problema identificado

* Loop de autenticação
* Re-render contínuo
* Chamadas repetidas ao backend
* Conflito entre camadas (API vs Auth vs Router)

---

### ✅ Padrões obrigatórios definidos

#### 🔒 Single source of redirect

Apenas **auth.js** pode redirecionar:

```txt
auth.js → único responsável por navegação de sessão
```

❌ api.js NÃO redireciona
❌ router.js NÃO redireciona

---

#### 🔒 API desacoplada de navegação

* api.js NÃO manipula `window.location`
* api.js apenas:

  * envia requisição
  * retorna dados
  * lança erro

---

#### 🔒 Controle de chamadas de sessão

* `/auth/me`:

  * executa 1 vez por carregamento
  * nunca em loop
  * nunca no login

---

#### 🔒 Proteção contra re-execução

* Router executa apenas após validação
* Eventos são controlados (sem duplicação)
* Uso de flags (`isLoading`) para evitar concorrência

---

## 🔹 3.2 BACKEND — SERVERLESS MODULAR

### Stack

* Cloudflare Workers
* TypeScript
* D1 (SQLite serverless)
* Arquitetura modular

---

## 📦 3.2.1 Estrutura

```bash
src/
  modules/
    auth/
    students/
    classes/
    enrollments/
    payments/
    cash/
  middleware/
    auth.ts
    rbac.ts
  db/
  utils/
```

---

## 🔐 3.2.2 Autenticação

### Atual

* JWT simples

### Evolução planejada

* JWT assinado (HMAC/RSA)
* Verificação criptográfica
* Refresh token (opcional)

---

## 🔐 3.2.3 RBAC

Perfis atuais:

* admin
* operator

Expansão futura:

* teacher
* financeiro

---

# 🧩 4. MODELO DE DOMÍNIO

---

## 🔗 Pipeline central

```txt
Students → Enrollments → Payments → Cash → Dashboard
```

---

## 💡 Característica-chave

O sistema já implementa:

* Motor financeiro estruturado
* Congelamento de valores
* Geração automática de mensalidades
* DRE operacional

👉 Isso caracteriza um **SaaS de gestão real**, não apenas CRUD.

---

# 💰 5. ARQUITETURA FINANCEIRA

---

## 📌 Modelo de pagamentos

Campos:

* gross_amount
* discount_percent
* discount_amount
* final_amount
* status

---

## ✔️ Regra crítica

* Valores são imutáveis após geração
* Garante integridade contábil

---

## 📊 DRE

* Receitas
* Despesas
* Resultado

✔ Já implementado

---

# ⚠️ 6. PONTOS CRÍTICOS DE ARQUITETURA

---

## 6.1 Controle de fluxo SPA

Risco:

* múltiplos controladores de navegação

Mitigação:

* centralização em auth.js

---

## 6.2 Execução de scripts

Risco:

* ordem incorreta → comportamento imprevisível

Mitigação:

* pipeline fixo documentado

---

## 6.3 Acoplamento front-back

Risco:

* lógica duplicada
* inconsistência

Mitigação:

* backend como fonte única

---

## 6.4 Infra vs Domínio

Risco:

* API controlando fluxo de UI

Mitigação:

* api.js desacoplado (sem redirect)

---

 ## 6.5 Integridade de Tipos entre Camadas (CRÍTICO)
Problema identificado

Durante a implementação da navegação entre módulos (Students → Enrollments), foi identificado um erro crítico de tipagem:

const studentId = Number(selectedStudentId);

O sistema utiliza IDs como string (UUID), porém houve tentativa de conversão para número.

Efeito observado

Exemplo real:

selectedStudentId = "c7b8-uuid"
Number("c7b8-uuid") → NaN

Impacto direto:

String(e.student_id) === String(studentId)

Se torna:

"c7b8-uuid" === "NaN"

Consequências:

Filtros retornando listas vazias
Tela de matrículas sem dados
Quebra de fluxo entre módulos
Falso diagnóstico de erro de API/backend
Causa raiz

Violação de contrato de tipo:

Frontend assumindo número
Backend operando com string (UUID)
Correção aplicada

Substituição direta:

const studentId = Number(selectedStudentId);

por:

const studentId = selectedStudentId;
Resultado
Filtro funcional restaurado
Navegação entre módulos estabilizada
Dados corretamente associados
Eliminação de falsos negativos no frontend
Regra arquitetural definida (OBRIGATÓRIA)
IDs são tratados como strings em TODAS as camadas

Proibido:

Number(id)
parseInt(id)
qualquer coerção implícita
Justificativa técnica

O sistema utiliza:

UUID
IDs não sequenciais
Identificadores externos

Logo:

Conversão numérica destrói a identidade do dado
Classificação do problema
Tipo	Nível
Bug de tipagem	Crítico
Impacto	Alto
Detecção	Difícil (silencioso)
Aprendizado consolidado
Erros de tipo não geram exceção → geram inconsistência silenciosa

Isso é mais perigoso que erro explícito.

🎯 IMPACTO ARQUITETURAL (IMPORTANTE)

Esse ajuste reforça diretamente:

✔ Backend como fonte da verdade
✔ Tipagem consistente entre camadas
✔ Previsibilidade de filtros e queries
✔ Integridade do domínio

## 6.6 Incidentes Críticos Resolvidos


### 🔥 Incidente 1 — Race condition no router

- Sintoma: tela travando em "Carregando..."
- Causa: init executando antes do módulo carregar
- Correção: waitForModule()
- Impacto: estabilidade do SPA restaurada

---

### 🔥 Incidente 2 — RBAC bloqueando enrollments

- Sintoma: 403 na API
- Causa: requireRole restritivo
- Correção: ajuste de permissões
- Impacto: fluxo de dados restabelecido

---

### 🔥 Incidente 3 — Hash incorreto (#/enrollments)

- Sintoma: módulo não carregava
- Causa: rota incompatível com router
- Correção: uso de window.location.hash
- Impacto: navegação estabilizada

---

### 🔥 Incidente 4 — Tipagem de ID (CRÍTICO)

- Sintoma: dados não apareciam
- Causa: Number() em UUID
- Correção: uso de string
- Impacto: correção total do fluxo

# 🚀 7. ROADMAP EVOLUTIVO

---

## 🔥 Curto prazo

* Estabilização completa do SPA
* Padronização de navegação
* Auditoria completa pós-auth (conforme sua regra)

---

## 🔥 Médio prazo

* JWT assinado (obrigatório)
* Logs estruturados
* Observabilidade (erros e uso)

---

## 🔥 Longo prazo

* Multi-tenant real
* Billing SaaS
* Planos e cobrança recorrente

---

# 🧠 8. PADRÃO DE ENGENHARIA

---

## 🔒 Regra de ouro (oficial do projeto)

* Um passo por vez
* Commit antes de mudar
* Testar antes de avançar
* Nunca quebrar fluxo existente

---

## 🔄 Processo padrão

1. Diagnóstico
2. Proposta
3. Aprovação
4. Execução controlada

---

# 🏁 9. STATUS ATUAL DO SISTEMA

| Área        | Status          |
| ----------- | --------------- |
| Backend     | 🟢 Estável      |
| Financeiro  | 🟢 Avançado     |
| Deploy      | 🟢 Estável      |
| Frontend    | 🟢 Estabilizado |
| Auth Flow   | 🟢 Hardened     |
| Arquitetura | 🟢 Sólida       |

---

# 📌 10. NOTA TÉCNICA FINAL

O sistema passou recentemente por um processo de **hardenização crítica do fluxo SPA**, resolvendo:

* loops de autenticação
* conflitos entre camadas
* redirects concorrentes
* instabilidade de renderização

👉 Isso elevou o projeto para um nível de **arquitetura confiável para produção SaaS**.
