-- =============================================================
-- Función para eliminar un tenant y todos sus datos
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

CREATE OR REPLACE FUNCTION _public.delete_tenant(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.send_schedule WHERE tenant_id = p_tenant_id;
    DELETE FROM public.notification WHERE tenant_id = p_tenant_id;
    DELETE FROM public.diagnosis WHERE tenant_id = p_tenant_id;
    DELETE FROM public."order" WHERE tenant_id = p_tenant_id;
    DELETE FROM public.patient WHERE tenant_id = p_tenant_id;
    DELETE FROM public.audit_log WHERE tenant_id = p_tenant_id;
    DELETE FROM public.macros_template WHERE tenant_id = p_tenant_id;
    DELETE FROM _public.tenant_users WHERE tenant_id = p_tenant_id;
    DELETE FROM _public.tenants WHERE id = p_tenant_id;
END;
$$;

-- Wrapper público SECURITY DEFINER (bypass RLS para el caller autenticado)
CREATE OR REPLACE FUNCTION public.delete_tenant(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    PERFORM _public.delete_tenant(p_tenant_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_tenant(UUID) TO authenticated;

-- Refrescar el cache de esquemas de PostgREST para que la función sea visible
NOTIFY pgrst, 'reload schema';
