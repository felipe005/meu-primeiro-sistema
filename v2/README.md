# LavaJato SaaS Pro v2

SaaS multiempresa para gestao de lava-jatos com Node.js, Express, PostgreSQL, JWT e Tailwind.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Setup rapido

1. Copie `.env.example` para `.env`
2. Configure `DATABASE_URL` e `JWT_SECRET`
3. Execute:

```bash
npm install
npm run migrate
npm run dev
```

## Arquitetura

- `src/models`: acesso a dados (queries SQL com placeholders)
- `src/services`: regras de negocio e validacao (`zod`)
- `src/controllers`: camada HTTP
- `src/routes`: definicao de rotas
- `src/middleware`: auth JWT, isolamento por empresa, assinatura
- `src/database`: pool e migracoes
- `views`: paginas HTML
- `public/js`: frontend SPA

## Regras de seguranca

- Senhas com `bcryptjs`
- Autenticacao com JWT Bearer Token
- Isolamento multiempresa por `empresa_id` em todas as consultas
- Bloqueio automatico se assinatura vencida/suspensa
- Queries parametrizadas para mitigar SQL injection

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/assinatura`
- `PUT /api/assinatura`
- `GET /api/dashboard`
- CRUD:
  - `/api/clientes`
  - `/api/veiculos`
  - `/api/servicos`
  - `/api/funcionarios`
  - `/api/agendamentos`
  - `/api/caixa`
- Relatorio mensal:
  - `GET /api/caixa/relatorio/mensal?mes=YYYY-MM`

## Deploy Render

Arquivo pronto: `render.yaml`

Variaveis obrigatorias no Render:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (Render injeta automaticamente)
