-- =============================================================
-- PAP Diagnóstico — Esquema de Base de Datos (Supabase)
-- =============================================================
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema de orquestación multi-tenant
CREATE SCHEMA IF NOT EXISTS _public;

-- =============================================================
-- TABLAS DE ORQUESTACIÓN (sin RLS, lectura global)
-- =============================================================

CREATE TABLE _public.tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    config      JSONB DEFAULT '{}'::jsonb,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE _public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE _public.tenant_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES _public.users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'lab_admin', 'viewer')),
    UNIQUE(tenant_id, user_id)
);

CREATE TABLE _public.settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO _public.settings (key, value) VALUES
    ('app_name', 'PAP Diagnóstico'),
    ('app_domain', 'http://localhost:3000'),
    ('from_email', 'resultados@papdiagnostico.com'),
    ('from_name', 'PAP Diagnóstico')
ON CONFLICT (key) DO NOTHING;

-- Trigger: nuevo tenant → crear bucket de storage
CREATE OR REPLACE FUNCTION _public.create_tenant_bucket()
RETURNS TRIGGER AS $$
BEGIN
    -- El bucket se crea desde la app después del INSERT
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TABLAS DE NEGOCIO (con tenant_id + RLS)
-- =============================================================

CREATE TABLE patient (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    dni         VARCHAR(20) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    birth_date  DATE,
    sex         VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    email       VARCHAR(255),
    phone       VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, dni)
);

CREATE INDEX idx_patient_tenant ON patient(tenant_id);
CREATE INDEX idx_patient_dni ON patient(tenant_id, dni);

CREATE TABLE "order" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES _public.tenants(id),
    patient_id      UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','delivered')),
    pdf_token       UUID DEFAULT gen_random_uuid() UNIQUE,
    pdf_url         TEXT,
    notes           TEXT,
    downloaded_at   TIMESTAMPTZ,
    downloaded_by   UUID REFERENCES _public.users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_tenant ON "order"(tenant_id);
CREATE INDEX idx_order_status ON "order"(tenant_id, status);
CREATE INDEX idx_order_patient ON "order"(patient_id);

CREATE TABLE diagnosis (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES _public.tenants(id),
    order_id          UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    specialist_id     UUID NOT NULL,
    sample_quality    VARCHAR(20) NOT NULL CHECK (sample_quality IN ('adequate', 'inadequate')),
    general_category  VARCHAR(100) NOT NULL,
    descriptive_dx    TEXT NOT NULL,
    macros_used       JSONB DEFAULT '[]'::jsonb,
    is_signed         BOOLEAN DEFAULT false,
    signed_at         TIMESTAMPTZ,
    digital_signature TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE INDEX idx_diagnosis_tenant ON diagnosis(tenant_id);
CREATE INDEX idx_diagnosis_order ON diagnosis(order_id);

CREATE TABLE macros_template (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    shortcode   VARCHAR(20) NOT NULL,
    full_text   TEXT NOT NULL,
    category    VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, shortcode)
);

CREATE INDEX idx_macros_tenant ON macros_template(tenant_id);

CREATE TABLE notification (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES _public.tenants(id),
    order_id        UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
    recipient_role  VARCHAR(20) NOT NULL CHECK (recipient_role IN ('lab', 'patient')),
    recipient       VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','sent','failed','delivered')),
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_tenant ON notification(tenant_id);
CREATE INDEX idx_notification_order ON notification(order_id);

CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID NOT NULL,
    performed_by UUID NOT NULL,
    metadata    JSONB DEFAULT '{}'::jsonb,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_created ON audit_log(tenant_id, created_at DESC);

-- =============================================================
-- FUNCIÓN AUXILIAR RLS
-- =============================================================

CREATE OR REPLACE FUNCTION public.user_tenants()
RETURNS TABLE(tenant_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT tu.tenant_id
  FROM _public.users u
  JOIN _public.tenant_users tu ON tu.user_id = u.id
  WHERE u.email = auth.email();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE macros_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Política genérica: cada usuario ve solo los datos de sus tenants
-- Usa auth.email() → _public.users → tenant_users

CREATE POLICY tenant_access ON patient
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

CREATE POLICY tenant_access ON "order"
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

CREATE POLICY tenant_access ON diagnosis
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

CREATE POLICY tenant_access ON macros_template
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

CREATE POLICY tenant_access ON notification
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

CREATE POLICY tenant_access ON audit_log
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));

-- =============================================================
-- TRIGGER: AUDITORÍA AUTOMÁTICA
-- =============================================================

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (tenant_id, action, entity_type, entity_id, performed_by, metadata, ip_address)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        (SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::UUID),
        jsonb_build_object(
            'old', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
            'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
        ),
        current_setting('request.headers', true)::json->>'x-forwarded-for'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_patient AFTER INSERT OR UPDATE OR DELETE ON patient
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_order AFTER INSERT OR UPDATE OR DELETE ON "order"
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_diagnosis AFTER INSERT OR UPDATE OR DELETE ON diagnosis
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- =============================================================
-- FUNCIÓN: CREAR NUEVO TENANT (esquema + templates)
-- =============================================================

CREATE OR REPLACE FUNCTION _public.create_tenant(
    p_name VARCHAR(255),
    p_slug VARCHAR(100)
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    INSERT INTO _public.tenants (name, slug)
    VALUES (p_name, p_slug)
    RETURNING id INTO v_tenant_id;

    -- Insertar macros por defecto para este tenant
    INSERT INTO public.macros_template (tenant_id, shortcode, full_text, category) VALUES
        (v_tenant_id, '.m1',    'Muestra adecuada para evaluación. Contiene células endocervicales y de la zona de transformación.', 'Muestra'),
        (v_tenant_id, '.m2',    'Muestra adecuada para evaluación. No contiene células endocervicales ni de la zona de transformación.', 'Muestra'),
        (v_tenant_id, '.m3',    'Muestra limitada por escasa celularidad.', 'Muestra'),
        (v_tenant_id, '.m4',    'Muestra limitada por hemorragia.', 'Muestra'),
        (v_tenant_id, '.m5',    'Muestra limitada por inflamación severa.', 'Muestra'),
        (v_tenant_id, '.m6',    'Muestra limitada por falta de celularidad endocervical.', 'Muestra'),
        (v_tenant_id, '.m7',    'Muestra rechazada / no procesada por inadecuada identificación.', 'Muestra'),
        (v_tenant_id, '.m8',    'Muestra rechazada / no procesada por portaobjetos roto.', 'Muestra'),
        (v_tenant_id, '.m9',    'Muestra rechazada / no procesada por fijación inadecuada.', 'Muestra'),
        (v_tenant_id, '.m10',   'Muestra procesada y evaluada. Celularidad escamosa adecuada.', 'Muestra'),
        (v_tenant_id, '.b1',    'Negativo para lesión intraepitelial o malignidad (NILM).', 'Bethesda'),
        (v_tenant_id, '.b2',    'ASC-US: Células escamosas atípicas de significado indeterminado.', 'Escamosas'),
        (v_tenant_id, '.b2a',   'ASC-US: Células escamosas atípicas de significado indeterminado. Sugerente de VPH.', 'Escamosas'),
        (v_tenant_id, '.b2b',   'ASC-US: Células escamosas atípicas de significado indeterminado. Favorece reactivo.', 'Escamosas'),
        (v_tenant_id, '.b2c',   'ASC-US: Células escamosas atípicas de significado indeterminado en contexto de atrofia.', 'Escamosas'),
        (v_tenant_id, '.b3',    'ASC-H: Células escamosas atípicas, no puede excluirse HSIL.', 'Escamosas'),
        (v_tenant_id, '.b3a',   'ASC-H: Células escamosas atípicas, no puede excluirse HSIL. Se sugiere colposcopía.', 'Escamosas'),
        (v_tenant_id, '.b4',    'LSIL: Lesión intraepitelial escamosa de bajo grado (VPH / NIC I).', 'Escamosas'),
        (v_tenant_id, '.b4a',   'LSIL: Lesión intraepitelial escamosa de bajo grado con cambios compatibles con VPH.', 'Escamosas'),
        (v_tenant_id, '.b4b',   'LSIL: Lesión intraepitelial escamosa de bajo grado. Se sugiere seguimiento según guías.', 'Escamosas'),
        (v_tenant_id, '.b5',    'HSIL: Lesión intraepitelial escamosa de alto grado (NIC II / NIC III).', 'Escamosas'),
        (v_tenant_id, '.b5a',   'HSIL: Lesión intraepitelial escamosa de alto grado con sospecha de invasión.', 'Escamosas'),
        (v_tenant_id, '.b5b',   'HSIL: Lesión intraepitelial escamosa de alto grado. Se deriva a colposcopía.', 'Escamosas'),
        (v_tenant_id, '.b6',    'Carcinoma de células escamosas.', 'Escamosas'),
        (v_tenant_id, '.b6a',   'Carcinoma de células escamosas queratinizante.', 'Escamosas'),
        (v_tenant_id, '.b6b',   'Carcinoma de células escamosas no queratinizante.', 'Escamosas'),
        (v_tenant_id, '.b6c',   'Carcinoma escamocelular microinvasor.', 'Escamosas'),
        (v_tenant_id, '.b7',    'AGC: Células glandulares atípicas NOS.', 'Glandulares'),
        (v_tenant_id, '.b7a',   'AGC: Células glandulares atípicas, favor neoplásico.', 'Glandulares'),
        (v_tenant_id, '.b7b',   'AGC: Células glandulares atípicas, probable endocervical.', 'Glandulares'),
        (v_tenant_id, '.b7c',   'AGC: Células glandulares atípicas, probable endometrial.', 'Glandulares'),
        (v_tenant_id, '.b8',    'AIS: Adenocarcinoma in situ endocervical.', 'Glandulares'),
        (v_tenant_id, '.b8a',   'Adenocarcinoma endocervical.', 'Glandulares'),
        (v_tenant_id, '.b8b',   'Adenocarcinoma endometrial.', 'Glandulares'),
        (v_tenant_id, '.b8c',   'Adenocarcinoma extrauterino (metastásico).', 'Glandulares'),
        (v_tenant_id, '.b8d',   'Adenocarcinoma NOS.', 'Glandulares'),
        (v_tenant_id, '.mo1',   'Infección: Trichomonas vaginalis.', 'Microorganismos'),
        (v_tenant_id, '.mo2',   'Infección: Candida spp.', 'Microorganismos'),
        (v_tenant_id, '.mo3',   'Cambios celulares compatibles con virus herpes simple (HSV).', 'Microorganismos'),
        (v_tenant_id, '.mo4',   'Infección: Actinomyces spp.', 'Microorganismos'),
        (v_tenant_id, '.mo5',   'Cambios celulares sugestivos de infección por VPH (sin ASC / LSIL).', 'Microorganismos'),
        (v_tenant_id, '.mo6',   'Flora mixta sugestiva de vaginosis bacteriana.', 'Microorganismos'),
        (v_tenant_id, '.mo7',   'Leucocitos: abundantes. Flora mixta sugestiva de vaginosis bacteriana.', 'Microorganismos'),
        (v_tenant_id, '.mo8',   'Cambios citopáticos compatibles con Chlamydia trachomatis (sugerente).', 'Microorganismos'),
        (v_tenant_id, '.mo9',   'Presencia de Leptothrix spp.', 'Microorganismos'),
        (v_tenant_id, '.mo10',  'Bacilos Döderlein: flora lactobacilar predominante.', 'Microorganismos'),
        (v_tenant_id, '.cr1',   'Cambios celulares reactivos: Inflamación (incluye cambios reparativos).', 'Cambios Reactivos'),
        (v_tenant_id, '.cr2',   'Cambios celulares reactivos: Reparación.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr3',   'Cambios celulares reactivos: Radiación.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr4',   'Cambios celulares reactivos: Dispositivo intrauterino (DIU).', 'Cambios Reactivos'),
        (v_tenant_id, '.cr5',   'Atrofia con inflamación (vaginitis atrófica).', 'Cambios Reactivos'),
        (v_tenant_id, '.cr6',   'Cambios celulares reactivos asociados a post-parto.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr7',   'Cambios celulares reactivos inespecíficos.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr8',   'Metaplasia escamosa inmadura reactiva.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr9',   'Células endocervicales con cambios reactivos.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr10',  'Células endometriales con cambios reactivos.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr11',  'Hiperqueratosis / paraqueratosis reactiva.', 'Cambios Reactivos'),
        (v_tenant_id, '.cr12',  'Cambios asociados a prolapso genital (acantosis / hiperqueratosis).', 'Cambios Reactivos'),
        (v_tenant_id, '.on1',   'Células endometriales en mujer ≥45 años.', 'Otros'),
        (v_tenant_id, '.on2',   'Células endometriales atípicas.', 'Otros'),
        (v_tenant_id, '.on3',   'Células endometriales en mujer <45 años (benignas).', 'Otros'),
        (v_tenant_id, '.on4',   'Tumor maligno de origen incierto.', 'Otros'),
        (v_tenant_id, '.on5',   'Metástasis de adenocarcinoma de mama.', 'Otros'),
        (v_tenant_id, '.on6',   'Células compatibles con sarcoma.', 'Otros'),
        (v_tenant_id, '.on7',   'Linfoma / proceso linfoproliferativo (células atípicas linfoides).', 'Otros'),
        (v_tenant_id, '.on8',   'Melanoma metastásico.', 'Otros'),
        (v_tenant_id, '.in1',   'Leucocitos: escasos.', 'Inflamación'),
        (v_tenant_id, '.in2',   'Leucocitos: moderados.', 'Inflamación'),
        (v_tenant_id, '.in3',   'Leucocitos: abundantes (exudado inflamatorio).', 'Inflamación'),
        (v_tenant_id, '.in4',   'Histiocitos presentes.', 'Inflamación'),
        (v_tenant_id, '.in5',   'Células gigantes multinucleadas presentes.', 'Inflamación'),
        (v_tenant_id, '.in6',   'Material proteináceo / detritus celular inflamatorio.', 'Inflamación'),
        (v_tenant_id, '.in7',   'Eritrocitos: escasos (hemorragia leve).', 'Inflamación'),
        (v_tenant_id, '.in8',   'Eritrocitos: abundantes (hemorragia).', 'Inflamación'),
        (v_tenant_id, '.in9',   'Células epiteliales con cambios inflamatorios reactivos.', 'Inflamación'),
        (v_tenant_id, '.s1',    'Se sugiere repetir PAP en 1 año según guías de tamizaje.', 'Seguimiento'),
        (v_tenant_id, '.s2',    'Se sugiere repetir PAP en 3 años según guías de tamizaje.', 'Seguimiento'),
        (v_tenant_id, '.s3',    'Se sugiere control citológico a los 6 meses.', 'Seguimiento'),
        (v_tenant_id, '.s4',    'Se sugiere derivación a colposcopía.', 'Seguimiento'),
        (v_tenant_id, '.s5',    'Se sugiere test de VPH de seguimiento en 12 meses.', 'Seguimiento'),
        (v_tenant_id, '.s6',    'Se sugiere test de VPH co-testing.', 'Seguimiento'),
        (v_tenant_id, '.s7',    'Se sugiere biopsia dirigida por colposcopía.', 'Seguimiento'),
        (v_tenant_id, '.s8',    'Se sugiere cono diagnóstico / escisión electroquirúrgica (LEEP / CAF).', 'Seguimiento'),
        (v_tenant_id, '.s9',    'Se sugiere estudio endometrial (biopsia / ecografía).', 'Seguimiento'),
        (v_tenant_id, '.s10',   'Se sugiere tratamiento antibiótico según antibiograma.', 'Seguimiento'),
        (v_tenant_id, '.s11',   'Se sugiere tratamiento antifúngico.', 'Seguimiento'),
        (v_tenant_id, '.s12',   'Se sugiere tratamiento anti-Trichomonas.', 'Seguimiento'),
        (v_tenant_id, '.s13',   'Se sugiere tratamiento hormonal (estrógenos vaginales) y repetir PAP.', 'Seguimiento'),
        (v_tenant_id, '.s14',   'Se sugiere seguimiento clínico. Repetir citología en 6-12 meses.', 'Seguimiento'),
        (v_tenant_id, '.s15',   'Se recomienda repetir muestra por inadecuada.', 'Seguimiento'),
        (v_tenant_id, '.s16',   'Derivar a oncología ginecológica para evaluación y tratamiento.', 'Seguimiento'),
        (v_tenant_id, '.iq1',   'p16 positivo (sobreexpresión nuclear y citoplasmática).', 'Inmunocitoquímica'),
        (v_tenant_id, '.iq2',   'p16 negativo (tinción citoplasmática débil o ausente).', 'Inmunocitoquímica'),
        (v_tenant_id, '.iq3',   'Ki67: índice de proliferación elevado.', 'Inmunocitoquímica'),
        (v_tenant_id, '.iq4',   'Doble tinción p16/Ki67 positiva, sugestivo de transformación oncogénica.', 'Inmunocitoquímica'),
        (v_tenant_id, '.h1',    'Células escamosas anucleadas (queratina).', 'Hallazgos'),
        (v_tenant_id, '.h2',    'Células endocervicales presentes.', 'Hallazgos'),
        (v_tenant_id, '.h3',    'Células endometriales presentes.', 'Hallazgos'),
        (v_tenant_id, '.h4',    'Células de metaplasia escamosa presentes.', 'Hallazgos'),
        (v_tenant_id, '.h5',    'Células multinucleadas presentes.', 'Hallazgos'),
        (v_tenant_id, '.h6',    'Cuerpos extraños (restos de DIU, suturas, etc.).', 'Hallazgos'),
        (v_tenant_id, '.h7',    'Espermatozoides presentes.', 'Hallazgos'),
        (v_tenant_id, '.h8',    'Células deciduales (cambios gravídicos).', 'Hallazgos'),
        (v_tenant_id, '.h9',    'Células de epitelio vaginal descamado sin alteraciones.', 'Hallazgos'),
        (v_tenant_id, '.h10',   'Atypia de reparación atípica (AR: atypical repair).', 'Hallazgos'),
        (v_tenant_id, '.h11',   'Cuerpos de psammoma presentes.', 'Hallazgos'),
        (v_tenant_id, '.h12',   'Moco endocervical abundante.', 'Hallazgos'),
        (v_tenant_id, '.f1',    'Resultado dentro de parámetros normales.', 'Cierre'),
        (v_tenant_id, '.f2',    'Resultado anormal: requiere seguimiento.', 'Cierre'),
        (v_tenant_id, '.f3',    'Muestra insuficiente para diagnóstico. Repetir la toma.', 'Cierre'),
        (v_tenant_id, '.f4',    'Evaluación completa. Informe emitido.', 'Cierre');

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
