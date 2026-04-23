CREATE TABLE IF NOT EXISTS resellers (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  slug            VARCHAR(80) NOT NULL UNIQUE,
  whatsapp_phone  VARCHAR(20) NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id              SERIAL PRIMARY KEY,
  reseller_id     INTEGER REFERENCES resellers(id) ON DELETE SET NULL,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(30) NOT NULL DEFAULT 'operator',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  reseller_id     INTEGER NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  code            VARCHAR(30) NOT NULL,
  name            VARCHAR(120) NOT NULL,
  description     TEXT NOT NULL,
  aliases         JSONB NOT NULL DEFAULT '[]',
  price_cents     INTEGER NOT NULL,
  stock_units     INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (reseller_id, code)
);

CREATE TABLE IF NOT EXISTS delivery_areas (
  id              SERIAL PRIMARY KEY,
  reseller_id     INTEGER NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  neighborhood    VARCHAR(120) NOT NULL,
  fee_cents       INTEGER NOT NULL DEFAULT 0,
  eta_minutes     INTEGER NOT NULL DEFAULT 45,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (reseller_id, neighborhood)
);

CREATE TABLE IF NOT EXISTS sessions (
  phone           VARCHAR(20) PRIMARY KEY,
  reseller_id     INTEGER NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  state           VARCHAR(50) NOT NULL DEFAULT 'INICIO',
  data            JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  reseller_id     INTEGER NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  phone           VARCHAR(20) NOT NULL,
  product_code    VARCHAR(30),
  produto         VARCHAR(120),
  endereco        TEXT,
  area_name       VARCHAR(120),
  area_fee_cents  INTEGER NOT NULL DEFAULT 0,
  pagamento       VARCHAR(50),
  subtotal_cents  INTEGER NOT NULL DEFAULT 0,
  total_cents     INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'novo',
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_events (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status          VARCHAR(30) NOT NULL,
  note            TEXT,
  actor_type      VARCHAR(30) NOT NULL,
  actor_name      VARCHAR(120),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_logs (
  id              SERIAL PRIMARY KEY,
  phone           VARCHAR(20) NOT NULL,
  direction       VARCHAR(20) NOT NULL,
  message         TEXT NOT NULL,
  status          VARCHAR(30) NOT NULL,
  attempt         INTEGER NOT NULL DEFAULT 1,
  error           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_reseller_status ON orders (reseller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_reseller_active ON products (reseller_id, active);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_reseller_active ON delivery_areas (reseller_id, active);
