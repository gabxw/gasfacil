# GásFácil

Plataforma para digitalizar a operação de distribuidoras de gás, reunindo **catálogo, pedidos, painel administrativo, estoque e atendimento via WhatsApp** em um único fluxo.

O projeto foi construído como um monorepo com uma aplicação web e um backend responsável pelas APIs operacionais e pelo bot de atendimento.

## Visão geral

```text
Cliente no WhatsApp
        │
        ▼
   Webhook Z-API
        │
        ▼
 Express / TypeScript
        │
  ┌─────┴───────────────┐
  ▼                     ▼
PostgreSQL          APIs administrativas
  │                     │
  └──────────┬──────────┘
             ▼
       Painel Next.js
```

## Principais funcionalidades

### Operação

- fluxo de pedidos pelo WhatsApp
- catálogo e estoque persistidos em PostgreSQL
- áreas de entrega e taxas por bairro
- consulta e cancelamento de pedidos
- histórico de status do pedido
- logs de mensagens enviadas e recebidas
- retry simples no envio de mensagens

### Painel administrativo

- autenticação administrativa
- dashboard operacional
- gestão de pedidos
- gestão de produtos e estoque
- gestão de áreas de entrega
- gestão de usuários
- suporte básico a múltiplos revendedores

## Stack

### Web
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- integração com Z-API

### Engenharia
- APIs REST
- webhooks
- autenticação por token
- modelagem relacional
- logs operacionais
- CI com GitHub Actions

## Estrutura do repositório

```text
gasfacil/
├── web/      # landing page e painel administrativo
├── bot/      # backend, webhook, bot e APIs
└── README.md
```

## Modelagem

O banco inclui entidades para:

- revendedores
- usuários administrativos
- produtos
- áreas de entrega
- sessões de conversa
- pedidos
- eventos de pedido
- logs de mensagens

Índices foram adicionados para consultas frequentes de pedidos, produtos e áreas por revendedor/status.

## Rodando localmente

### Pré-requisitos

- Node.js
- npm
- PostgreSQL
- Git

### 1. Banco de dados

```bash
psql -U postgres -c "CREATE DATABASE gasfacil"
psql -U postgres -d gasfacil -f bot/src/db/schema.sql
```

### 2. Backend

```bash
cd bot
npm install
cp .env.example .env
npm run dev
```

Revise todas as variáveis do arquivo `.env` antes de iniciar a aplicação.

Servidor esperado:

```text
http://localhost:3001
```

### 3. Web

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Aplicação web:

```text
http://localhost:3000
```

## Variáveis de ambiente

O projeto fornece apenas valores de exemplo em `bot/.env.example`.

Credenciais reais, tokens de WhatsApp e segredos de autenticação **não devem ser commitados**.

Exemplo:

```env
WHATSAPP_API_URL=https://api.z-api.io/instances/SEU_INSTANCE/token/SEU_TOKEN
WHATSAPP_TOKEN=SEU_TOKEN_AQUI
DATABASE_URL=postgresql://user:password@localhost:5432/gasfacil

PORT=3001
WEBHOOK_SECRET=troque-este-segredo
JWT_SECRET=troque-este-token
WEB_ALLOWED_ORIGIN=http://localhost:3000

DEFAULT_RESELLER_SLUG=matriz
DEFAULT_RESELLER_NAME=GasFacil Matriz
DEFAULT_RESELLER_PHONE=5531999999999
DEFAULT_ADMIN_NAME=Administrador
DEFAULT_ADMIN_EMAIL=admin@gasfacil.local
DEFAULT_ADMIN_PASSWORD=troque-esta-senha
```

## Integração com WhatsApp

Para utilizar o webhook com a Z-API, configure:

```text
POST https://seu-dominio.com/webhook
```

Em desenvolvimento local, um túnel HTTP pode ser utilizado para receber os eventos externamente.

## Segurança

Este repositório é um projeto de demonstração/portfólio e não deve ser publicado em produção sem revisão adicional.

Antes de uma operação real:

- gere segredos fortes para JWT e webhook
- utilize senha administrativa exclusiva
- mantenha arquivos `.env` fora do Git
- utilize HTTPS
- adicione rate limiting
- revise autorização por revendedor
- configure backup e rotação de credenciais

## CI

O repositório possui uma pipeline no GitHub Actions que instala dependências e valida o build das duas aplicações a cada push e pull request.

## Próximas evoluções

- testes automatizados de backend e frontend
- Docker Compose para ambiente completo
- observabilidade com logs estruturados e tracing
- fila para processamento assíncrono de mensagens
- auditoria administrativa mais detalhada
- integração com gateway de pagamento
- eventos de entrega e motoboy
- políticas de SLA por região/turno

## Objetivo técnico

Além de resolver um problema operacional real, o projeto serve para explorar integração entre **frontend, APIs, banco de dados e mensageria externa**, mantendo responsabilidades separadas entre experiência web e processamento do atendimento via WhatsApp.
