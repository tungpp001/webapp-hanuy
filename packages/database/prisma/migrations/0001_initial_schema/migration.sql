-- =============================================================================
-- OcPOS SaaS - Initial Non-Destructive Schema Migration (PostgreSQL)
-- Enforces: Integer VND currency, explicit price inheritance modes,
-- immutable transaction history (no hard delete triggers), and idempotency keys.
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  brand_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  logo_url TEXT,
  primary_color VARCHAR(32) NOT NULL DEFAULT '#D9381E',
  cover_image_url TEXT,
  banner_url TEXT,
  custom_domain VARCHAR(255) UNIQUE,
  config_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  billing_cycle VARCHAR(32) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  warning_days_before INTEGER[] NOT NULL DEFAULT '{30,14,7,3,1}',
  terms_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  signed_license_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(32),
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  business_day_start_hour INTEGER NOT NULL DEFAULT 4 CHECK (business_day_start_hour BETWEEN 0 AND 23),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  active_menu_version INTEGER NOT NULL DEFAULT 1,
  primary_server_id VARCHAR(128) NOT NULL,
  standby_server_id VARCHAR(128) NOT NULL,
  cluster_epoch INTEGER NOT NULL DEFAULT 1,
  last_cloud_sync_at TIMESTAMPTZ,
  last_backup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category_name VARCHAR(128) NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  selling_unit VARCHAR(32) NOT NULL,
  is_weight_based BOOLEAN NOT NULL DEFAULT FALSE,
  standard_price_vnd BIGINT NOT NULL CHECK (standard_price_vnd >= 0),
  standard_price_per_kg_vnd BIGINT CHECK (standard_price_per_kg_vnd IS NULL OR standard_price_per_kg_vnd >= 0),
  standard_estimated_cost_vnd BIGINT CHECK (standard_estimated_cost_vnd IS NULL OR standard_estimated_cost_vnd >= 0),
  standard_estimated_cost_per_kg_vnd BIGINT CHECK (standard_estimated_cost_per_kg_vnd IS NULL OR standard_estimated_cost_per_kg_vnd >= 0),
  standard_prep_minutes INTEGER NOT NULL DEFAULT 15,
  allowed_prep_notes TEXT[] NOT NULL DEFAULT '{}',
  default_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
  version INTEGER NOT NULL DEFAULT 1,
  copied_from_item_id UUID,
  has_transactions BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS branch_menu_configs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  price_mode VARCHAR(16) NOT NULL CHECK (price_mode IN ('INHERITED', 'OVERRIDE')),
  override_price_vnd BIGINT CHECK (override_price_vnd IS NULL OR override_price_vnd >= 0),
  override_price_per_kg_vnd BIGINT CHECK (override_price_per_kg_vnd IS NULL OR override_price_per_kg_vnd >= 0),
  cost_mode VARCHAR(16) NOT NULL DEFAULT 'INHERITED' CHECK (cost_mode IN ('INHERITED', 'OVERRIDE')),
  override_estimated_cost_vnd BIGINT CHECK (override_estimated_cost_vnd IS NULL OR override_estimated_cost_vnd >= 0),
  availability_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
  prep_minutes_override INTEGER,
  synced_menu_version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (branch_id, menu_item_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  table_session_id UUID NOT NULL,
  parent_invoice_id UUID REFERENCES invoices(id),
  split_index INTEGER,
  split_total_parts INTEGER,
  display_code VARCHAR(64) NOT NULL,
  business_date DATE NOT NULL,
  subtotal_vnd BIGINT NOT NULL CHECK (subtotal_vnd >= 0),
  discount_type VARCHAR(16) NOT NULL DEFAULT 'NONE',
  discount_value INTEGER NOT NULL DEFAULT 0,
  discount_amount_vnd BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount_vnd >= 0),
  discount_reason TEXT,
  adjustment_amount_vnd BIGINT NOT NULL DEFAULT 0,
  total_amount_vnd BIGINT NOT NULL CHECK (total_amount_vnd >= 0),
  paid_amount_vnd BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount_vnd >= 0),
  refunded_amount_vnd BIGINT NOT NULL DEFAULT 0 CHECK (refunded_amount_vnd >= 0),
  debt_amount_vnd BIGINT NOT NULL DEFAULT 0 CHECK (debt_amount_vnd >= 0),
  status VARCHAR(32) NOT NULL,
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  tenant_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  endpoint VARCHAR(128) NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  durability_state VARCHAR(64) NOT NULL,
  response_status_code INTEGER NOT NULL,
  response_body_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, branch_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  branch_id UUID,
  actor_user_id UUID NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  support_grant_id UUID,
  action VARCHAR(128) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(128) NOT NULL,
  reason TEXT,
  before_json JSONB,
  after_json JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
