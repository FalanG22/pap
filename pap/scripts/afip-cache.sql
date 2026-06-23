-- Add cache columns for WSAA Ticket de Acceso
ALTER TABLE _public.tenant_afip_config
  ADD COLUMN IF NOT EXISTS wsaa_token text,
  ADD COLUMN IF NOT EXISTS wsaa_sign text,
  ADD COLUMN IF NOT EXISTS wsaa_token_expires_at timestamptz;
