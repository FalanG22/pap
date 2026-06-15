-- Tabla de configuración global del sistema
CREATE TABLE IF NOT EXISTS _public.settings (
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

-- Grant a anon/authenticated
GRANT SELECT, INSERT, UPDATE ON _public.settings TO anon, authenticated;
