# GásFácil

Monorepo com duas aplicações:

- `web/`: landing page e painel operacional em Next.js 14
- `bot/`: backend Express + bot de WhatsApp + APIs admin

## Estrutura

```text
gasfacil/
├── web/
├── bot/
└── README.md
```

## 1. Landing Page e Painel Admin

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Acesse:

- Landing page: `http://localhost:3000`
- Login admin: `http://localhost:3000/admin/login`

Variavel esperada em `web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 2. Bot WhatsApp e Backend

```bash
cd bot
npm install
cp .env.example .env
```

Preencha o `.env` com seus dados reais.

Crie o banco:

```bash
psql -U postgres -c "CREATE DATABASE gasfacil"
psql -U postgres -d gasfacil -f src/db/schema.sql
```

Suba o backend:

```bash
npm run dev
```

Servidor esperado em `http://localhost:3001`

## 3. Credenciais iniciais

No primeiro boot, o backend garante automaticamente:

- revendedor padrao
- catalogo inicial de botijoes
- bairros iniciais de entrega
- usuario admin padrao

Credenciais iniciais:

- Email: `admin@gasfacil.local`
- Senha: `admin123`

Troque isso no `.env` antes de publicar.

## 4. Configurar Webhook na Z-API

- Acesse o painel da Z-API
- Em `Webhooks`, configure: `POST https://seudominio.com/webhook`
- Para testes locais use: `ngrok http 3001`

## 5. O que esta implementado

### Web

- Landing page comercial mobile-first
- Painel admin com login
- Dashboard com metricas de operacao
- Edicao de pedidos, produtos, bairros e usuarios
- Gestao basica de multi-revendedor

### Bot e Backend

- Webhook compativel com Z-API
- Fluxo de pedido por WhatsApp com estados
- Consulta de status e cancelamento pelo cliente
- Areas de entrega por bairro
- Catalogo e estoque dinamicos via banco
- Autenticacao admin via token assinado
- APIs operacionais para pedidos, produtos, areas, usuarios e revendedores
- Logs de mensagens enviadas/recebidas
- Retry simples no envio para o WhatsApp

## 6. Variaveis importantes do backend

Exemplo em `bot/.env.example`:

```env
WHATSAPP_API_URL=https://api.z-api.io/instances/SEU_INSTANCE/token/SEU_TOKEN
WHATSAPP_TOKEN=SEU_TOKEN_AQUI
DATABASE_URL=postgresql://user:password@localhost:5432/gasfacil
PORT=3001
WEBHOOK_SECRET=segredo_qualquer
JWT_SECRET=troque_este_token
WEB_ALLOWED_ORIGIN=http://localhost:3000
DEFAULT_RESELLER_SLUG=matriz
DEFAULT_RESELLER_NAME=GasFacil Matriz
DEFAULT_RESELLER_PHONE=5531999999999
DEFAULT_ADMIN_NAME=Administrador
DEFAULT_ADMIN_EMAIL=admin@gasfacil.local
DEFAULT_ADMIN_PASSWORD=admin123
```

## 7. Proximo nivel recomendado

Se for publicar para operacao real, os proximos incrementos mais valiosos sao:

- gateway de pagamento
- observabilidade centralizada
- politica de SLA por bairro/turno
- eventos de entrega integrados com motoboy
- trilha de auditoria mais detalhada para operacao
