-- Otorgar permisos sobre el schema _public
GRANT USAGE ON SCHEMA _public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA _public TO anon, authenticated;

-- Wrapper para create_tenant (accesible desde public)
CREATE OR REPLACE FUNCTION public.create_tenant(p_name text, p_slug text)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_id UUID;
BEGIN
  SELECT _public.create_tenant(p_name, p_slug) INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant(text, text) TO anon, authenticated;
