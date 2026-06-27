-- Migration 002: Pricing Functions
-- Porting JavaScript pricing logic to database functions.

CREATE OR REPLACE FUNCTION public.get_rate_for_hour(p_hour INT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN 600.00;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.calculate_court_total(p_start_hour INT, p_duration_hours INT, p_date DATE DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC := 0.00;
  v_hour INT;
  v_i INT;
  v_dow INT;
  v_is_promo BOOLEAN := false;
BEGIN
  IF p_date IS NOT NULL THEN
    v_dow := EXTRACT(DOW FROM p_date);
    IF v_dow >= 1 AND v_dow <= 4 THEN
      v_is_promo := true;
    END IF;
  END IF;

  FOR v_i IN 0 .. (p_duration_hours - 1) LOOP
    v_hour := (p_start_hour + v_i) % 24;
    IF v_is_promo AND v_hour >= 6 AND v_hour < 12 THEN
      v_total := v_total + 300.00;
    ELSE
      v_total := v_total + public.get_rate_for_hour(v_hour);
    END IF;
  END LOOP;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
