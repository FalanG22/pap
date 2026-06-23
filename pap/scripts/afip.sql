-- =============================================================
-- Módulo AFIP — Factura Electrónica
-- =============================================================
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

CREATE TABLE _public.tenant_afip_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES _public.tenants(id) ON DELETE CASCADE,
    cuit                VARCHAR(11) NOT NULL DEFAULT '',
    environment         VARCHAR(20) NOT NULL DEFAULT 'homologacion'
                        CHECK (environment IN ('homologacion', 'produccion')),
    punto_venta         INTEGER NOT NULL DEFAULT 1,
    certificate_crt     TEXT,
    certificate_key     TEXT,
    certificate_key_pass VARCHAR(255),
    is_active           BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

CREATE OR REPLACE FUNCTION _public.trg_afip_config_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_afip_config_updated
    BEFORE UPDATE ON _public.tenant_afip_config
    FOR EACH ROW EXECUTE FUNCTION _public.trg_afip_config_updated();
