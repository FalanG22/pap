-- =============================================================
-- Fix: cascading deletes for tenant removal
-- El error "order_patient_id_fkey" ocurre porque al eliminar
-- pacientes, aún existen órdenes que los referencian.
-- =============================================================

-- 1. Agregar ON DELETE CASCADE a las FKs que faltan
ALTER TABLE public."order"
  DROP CONSTRAINT IF EXISTS order_patient_id_fkey,
  ADD CONSTRAINT order_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patient(id)
    ON DELETE CASCADE;

ALTER TABLE public.diagnosis
  DROP CONSTRAINT IF EXISTS diagnosis_order_id_fkey,
  ADD CONSTRAINT diagnosis_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public."order"(id)
    ON DELETE CASCADE;

-- 2. Actualizar función delete_tenant para eliminar TODOS los datos asociados
CREATE OR REPLACE FUNCTION _public.delete_tenant(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- Eliminar en orden inverso de dependencias
    DELETE FROM public.send_schedule WHERE tenant_id = p_tenant_id;
    DELETE FROM public.notification WHERE tenant_id = p_tenant_id;
    DELETE FROM public.audit_log WHERE tenant_id = p_tenant_id;
    DELETE FROM public.macros_template WHERE tenant_id = p_tenant_id;
    DELETE FROM public.diagnosis WHERE tenant_id = p_tenant_id;
    DELETE FROM public.invoice WHERE tenant_id = p_tenant_id;
    DELETE FROM public."order" WHERE tenant_id = p_tenant_id;
    DELETE FROM public.patient WHERE tenant_id = p_tenant_id;
    DELETE FROM _public.tenant_billing_config WHERE tenant_id = p_tenant_id;
    DELETE FROM _public.tenant_afip_config WHERE tenant_id = p_tenant_id;
    DELETE FROM _public.tenant_users WHERE tenant_id = p_tenant_id;
    DELETE FROM _public.tenants WHERE id = p_tenant_id;
END;
$$;

-- Recrear wrapper (sin cambios, pero apunta a la nueva función)
CREATE OR REPLACE FUNCTION public.delete_tenant(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    PERFORM _public.delete_tenant(p_tenant_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_tenant(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
