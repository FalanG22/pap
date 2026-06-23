-- =============================================================
-- Módulo de Facturación — PAP Diagnóstico
-- =============================================================
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

-- =============================================================
-- 1. CONFIGURACIÓN DE FACTURACIÓN POR TENANT (_public)
-- =============================================================

CREATE TABLE _public.tenant_billing_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES _public.tenants(id) ON DELETE CASCADE,
    cost_per_diagnosis  NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(3) NOT NULL DEFAULT 'ARS',
    billing_email       VARCHAR(255),
    billing_frequency   VARCHAR(20) NOT NULL DEFAULT 'monthly'
                        CHECK (billing_frequency IN ('weekly', 'biweekly', 'monthly', 'custom')),
    billing_day         INTEGER DEFAULT 1,
    custom_days         INTEGER[] DEFAULT '{}',
    next_billing_date   DATE,
    last_billing_date   DATE,
    invoice_prefix      VARCHAR(20) DEFAULT 'FAC-',
    invoice_counter     INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN DEFAULT false,
    notes               TEXT,
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION _public.trg_billing_config_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_billing_config_updated
    BEFORE UPDATE ON _public.tenant_billing_config
    FOR EACH ROW EXECUTE FUNCTION _public.trg_billing_config_updated();

-- =============================================================
-- 2. TABLA DE FACTURAS (public, con RLS)
-- =============================================================

CREATE TABLE invoice (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES _public.tenants(id),
    invoice_number  VARCHAR(50) NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    total_diagnoses INTEGER NOT NULL DEFAULT 0,
    unit_cost       NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'paid', 'cancelled')),
    sent_at         TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_invoice_tenant ON invoice(tenant_id);
CREATE INDEX idx_invoice_status ON invoice(tenant_id, status);
CREATE INDEX idx_invoice_period ON invoice(tenant_id, period_start, period_end);

-- =============================================================
-- ROW LEVEL SECURITY para invoice
-- =============================================================

ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_access ON invoice
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

-- =============================================================
-- TRIGGER: AUDITORÍA para invoice
-- =============================================================

CREATE TRIGGER trg_audit_invoice AFTER INSERT OR UPDATE OR DELETE ON invoice
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.trg_invoice_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_updated
    BEFORE UPDATE ON invoice
    FOR EACH ROW EXECUTE FUNCTION trg_invoice_updated();

-- =============================================================
-- 3. VINCULAR DIAGNÓSTICOS A FACTURAS
-- =============================================================
-- Agregar columna invoice_id a la tabla diagnosis
ALTER TABLE diagnosis ADD COLUMN invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL;
CREATE INDEX idx_diagnosis_invoice ON diagnosis(invoice_id);
CREATE INDEX idx_diagnosis_invoice_tenant ON diagnosis(tenant_id, invoice_id);

-- =============================================================
-- 4. FUNCIÓN PARA GENERAR NÚMERO DE FACTURA
-- =============================================================

CREATE OR REPLACE FUNCTION _public.generate_invoice_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_config _public.tenant_billing_config%ROWTYPE;
    v_number VARCHAR(50);
BEGIN
    SELECT * INTO v_config FROM _public.tenant_billing_config
    WHERE tenant_id = p_tenant_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_config.invoice_counter := v_config.invoice_counter + 1;

    UPDATE _public.tenant_billing_config
    SET invoice_counter = v_config.invoice_counter
    WHERE tenant_id = p_tenant_id;

    v_number := v_config.invoice_prefix || LPAD(v_config.invoice_counter::TEXT, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
