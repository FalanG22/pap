-- =============================================================
-- FIX: Reasignar diagnósticos al tenant correcto según su orden
-- =============================================================
-- Ejecutar TODO en el SQL Editor de Supabase Dashboard
-- =============================================================

DO $$
DECLARE
    v_count INT;
BEGIN
    -- Deshabilitar trigger de auditoría temporalmente
    EXECUTE 'ALTER TABLE diagnosis DISABLE TRIGGER trg_audit_diagnosis';

    -- Contar diagnósticos incorrectos
    SELECT COUNT(*) INTO v_count
    FROM public.diagnosis d
    JOIN public."order" o ON d.order_id = o.id
    WHERE d.tenant_id != o.tenant_id;

    RAISE NOTICE 'Diagnósticos a corregir: %', v_count;

    -- CORREGIR: actualizar tenant_id de los diagnósticos al de su orden
    UPDATE public.diagnosis d
    SET tenant_id = o.tenant_id
    FROM public."order" o
    WHERE d.order_id = o.id
      AND d.tenant_id != o.tenant_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Actualizados: %', v_count;

    -- Re-habilitar trigger
    EXECUTE 'ALTER TABLE diagnosis ENABLE TRIGGER trg_audit_diagnosis';

    -- Verificar resultado
    SELECT COUNT(*) INTO v_count
    FROM public.diagnosis d
    JOIN public."order" o ON d.order_id = o.id
    WHERE d.tenant_id != o.tenant_id;

    RAISE NOTICE 'Aún incorrectos después del fix: %', v_count;
END $$;

-- 5. Verificación final
SELECT d.id as diagnosis_id, d.tenant_id as diagnosis_tenant, o.tenant_id as order_tenant
FROM public.diagnosis d
JOIN public."order" o ON d.order_id = o.id
WHERE d.tenant_id != o.tenant_id;
