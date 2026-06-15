-- Agregar modos manual y daily
ALTER TABLE send_schedule DROP CONSTRAINT IF EXISTS send_schedule_mode_check;
ALTER TABLE send_schedule ADD CONSTRAINT send_schedule_mode_check
  CHECK (mode IN ('manual', 'immediate', 'daily', 'weekly', 'biweekly', 'monthly', 'custom_dates'));

-- Actualizar función de cálculo de próxima fecha
CREATE OR REPLACE FUNCTION calculate_next_send(p_mode VARCHAR(20), p_custom_dates INTEGER[])
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_next TIMESTAMPTZ;
    v_day INTEGER;
    v_month_end INTEGER;
BEGIN
    CASE p_mode
        WHEN 'manual' THEN
            RETURN NULL;
        WHEN 'immediate' THEN
            RETURN v_now;
        WHEN 'daily' THEN
            RETURN v_now + INTERVAL '1 day';
        WHEN 'weekly' THEN
            RETURN v_now + INTERVAL '7 days';
        WHEN 'biweekly' THEN
            RETURN v_now + INTERVAL '14 days';
        WHEN 'monthly' THEN
            RETURN v_now + INTERVAL '1 month';
        WHEN 'custom_dates' THEN
            FOREACH v_day IN ARRAY p_custom_dates LOOP
                v_month_end := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', v_now) + INTERVAL '1 MONTH - 1 DAY'));
                IF v_day <= v_month_end THEN
                    v_next := DATE_TRUNC('MONTH', v_now) + (v_day - 1) * INTERVAL '1 day';
                    IF v_next > v_now THEN RETURN v_next; END IF;
                END IF;
            END LOOP;
            IF array_length(p_custom_dates, 1) > 0 THEN
                RETURN DATE_TRUNC('MONTH', v_now + INTERVAL '1 month') + (p_custom_dates[1] - 1) * INTERVAL '1 day';
            END IF;
            RETURN NULL;
    END CASE;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Actualizar trigger
CREATE OR REPLACE FUNCTION trg_calc_next_send()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mode = 'manual' THEN
        NEW.next_send_at := NULL;
    ELSIF NEW.mode != 'immediate' THEN
        NEW.next_send_at := calculate_next_send(NEW.mode, NEW.custom_dates);
    ELSE
        NEW.next_send_at := NULL;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
