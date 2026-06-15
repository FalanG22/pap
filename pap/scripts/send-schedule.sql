-- =============================================================
-- Programación de envíos automáticos de diagnósticos
-- =============================================================

CREATE TABLE send_schedule (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES _public.tenants(id),
    mode            VARCHAR(20) NOT NULL DEFAULT 'immediate'
                    CHECK (mode IN ('immediate', 'weekly', 'biweekly', 'monthly', 'custom_dates')),
    custom_dates    INTEGER[] DEFAULT '{}',
    last_sent_at    TIMESTAMPTZ,
    next_send_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE INDEX idx_send_schedule_tenant ON send_schedule(tenant_id);
CREATE INDEX idx_send_schedule_next ON send_schedule(next_send_at) WHERE next_send_at IS NOT NULL;

ALTER TABLE send_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_access ON send_schedule
    FOR ALL USING (tenant_id = (SELECT (current_setting('request.jwt.claims', true)::json->>'tenant_id')::UUID));

-- Función para calcular próxima fecha de envío
CREATE OR REPLACE FUNCTION calculate_next_send(p_mode VARCHAR(20), p_custom_dates INTEGER[])
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_next TIMESTAMPTZ;
    v_day INTEGER;
    v_month_end INTEGER;
BEGIN
    CASE p_mode
        WHEN 'immediate' THEN
            RETURN v_now;
        WHEN 'weekly' THEN
            RETURN v_now + INTERVAL '7 days';
        WHEN 'biweekly' THEN
            RETURN v_now + INTERVAL '14 days';
        WHEN 'monthly' THEN
            RETURN v_now + INTERVAL '1 month';
        WHEN 'custom_dates' THEN
            -- Buscar el próximo día del mes en custom_dates
            FOREACH v_day IN ARRAY p_custom_dates
            LOOP
                v_month_end := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', v_now) + INTERVAL '1 MONTH - 1 DAY'));
                IF v_day <= v_month_end THEN
                    v_next := DATE_TRUNC('MONTH', v_now) + (v_day - 1) * INTERVAL '1 day';
                    IF v_next > v_now THEN
                        RETURN v_next;
                    END IF;
                END IF;
            END LOOP;
            -- Si no hay fecha próxima este mes, ir al próximo
            RETURN DATE_TRUNC('MONTH', v_now + INTERVAL '1 month') + (p_custom_dates[1] - 1) * INTERVAL '1 day';
    END CASE;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: al insertar o actualizar send_schedule, calcular next_send_at automáticamente
CREATE OR REPLACE FUNCTION trg_calc_next_send()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mode != 'immediate' THEN
        NEW.next_send_at := calculate_next_send(NEW.mode, NEW.custom_dates);
    ELSE
        NEW.next_send_at := NULL;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_send_schedule_calc
    BEFORE INSERT OR UPDATE ON send_schedule
    FOR EACH ROW EXECUTE FUNCTION trg_calc_next_send();
