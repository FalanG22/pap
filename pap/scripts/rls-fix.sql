-- =============================================================
-- Fix RLS policies: usar auth.email() en lugar de JWT tenant_id
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- Función auxiliar: retorna los tenant_ids del usuario autenticado
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

-- Eliminar policies viejas
DROP POLICY IF EXISTS tenant_access ON patient;
DROP POLICY IF EXISTS tenant_access ON "order";
DROP POLICY IF EXISTS tenant_access ON diagnosis;
DROP POLICY IF EXISTS tenant_access ON macros_template;
DROP POLICY IF EXISTS tenant_access ON notification;
DROP POLICY IF EXISTS tenant_access ON audit_log;
DROP POLICY IF EXISTS tenant_access ON send_schedule;

-- Recrear usando user_tenants()
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

CREATE POLICY tenant_access ON send_schedule
    FOR ALL USING (tenant_id IN (SELECT public.user_tenants()));
