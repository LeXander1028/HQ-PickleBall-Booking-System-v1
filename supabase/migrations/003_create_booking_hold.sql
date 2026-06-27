-- Migration 003: Create Booking Hold Procedure
-- Implements create_booking_hold_auto database RPC.

CREATE OR REPLACE FUNCTION public.create_booking_hold_auto(
  p_date DATE,
  p_start_hour INT,
  p_duration_hours INT,
  p_notes TEXT,
  p_paddles INT,
  p_balls INT,
  p_court_count INT,
  p_trainer_hours INT,
  p_trainer_heads INT,
  p_contact_phone TEXT,
  p_court_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  court_id TEXT,
  total_price NUMERIC(10, 2)
) SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_single_court_price NUMERIC(10, 2);
  v_extras_price NUMERIC(10, 2);
  v_assigned_courts TEXT[] := ARRAY[]::TEXT[];
  v_court_id TEXT;
  v_inserted_id UUID;
  v_i INT;
  v_is_free BOOLEAN;
BEGIN
  -- 1. Get authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be logged in';
  END IF;

  -- 2. Validations
  IF p_contact_phone IS NULL OR trim(p_contact_phone) = '' THEN
    RAISE EXCEPTION 'Validation Error: Contact phone number is required';
  END IF;

  IF p_court_count < 1 OR p_court_count > 3 THEN
    RAISE EXCEPTION 'Validation Error: Court count must be between 1 and 3';
  END IF;

  IF p_trainer_hours > p_duration_hours THEN
    RAISE EXCEPTION 'Validation Error: Trainer hours cannot exceed booking duration';
  END IF;

  IF p_trainer_hours > 0 AND (p_trainer_heads < 1 OR p_trainer_heads > 30) THEN
    RAISE EXCEPTION 'Validation Error: Trainer heads must be between 1 and 30';
  END IF;

  IF p_start_hour + p_duration_hours > 24 THEN
    RAISE EXCEPTION 'Validation Error: Booking cannot exceed midnight boundary';
  END IF;

  -- 3. Calculate Pricing
  v_single_court_price := public.calculate_court_total(p_start_hour, p_duration_hours, p_date);
  v_extras_price := (COALESCE(p_paddles, 0) * 100.00) + 
                     (COALESCE(p_balls, 0) * 100.00) + 
                     (COALESCE(p_trainer_hours, 0) * COALESCE(p_trainer_heads, 0) * 500.00);

  -- 4. Court Allocation
  -- If client specified court IDs, verify they are free and use them
  IF p_court_ids IS NOT NULL AND array_length(p_court_ids, 1) = p_court_count THEN
    FOREACH v_court_id IN ARRAY p_court_ids LOOP
      -- Check overlap against existing bookings
      SELECT NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE court_id = v_court_id
          AND date = p_date
          AND status != 'cancelled'
          AND NOT (
            (start_hour + duration_hours <= p_start_hour) OR 
            (start_hour >= p_start_hour + p_duration_hours)
          )
      ) INTO v_is_free;
      
      IF NOT v_is_free THEN
        RAISE EXCEPTION 'Collision Error: Court % is already booked for this slot', v_court_id;
      END IF;

      -- Check overlap against blocked slots
      SELECT NOT EXISTS (
        SELECT 1 FROM public.blocked_slots
        WHERE court_id = v_court_id
          AND date = p_date
          AND NOT (
            (start_hour + duration_hours <= p_start_hour) OR 
            (start_hour >= p_start_hour + p_duration_hours)
          )
      ) INTO v_is_free;

      IF NOT v_is_free THEN
        RAISE EXCEPTION 'Collision Error: Court % is blocked for maintenance or events', v_court_id;
      END IF;

      v_assigned_courts := array_append(v_assigned_courts, v_court_id);
    END LOOP;
  ELSE
    -- Auto-allocate first N free courts ordered by name
    FOR v_court_id IN (
      SELECT c.id FROM public.courts c
      WHERE c.is_active = true
      ORDER BY c.name ASC
    ) LOOP
      IF array_length(v_assigned_courts, 1) >= p_court_count THEN
        EXIT;
      END IF;

      -- Check bookings
      SELECT NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE court_id = v_court_id
          AND date = p_date
          AND status != 'cancelled'
          AND NOT (
            (start_hour + duration_hours <= p_start_hour) OR 
            (start_hour >= p_start_hour + p_duration_hours)
          )
      ) INTO v_is_free;

      IF NOT v_is_free THEN
        CONTINUE;
      END IF;

      -- Check blocks
      SELECT NOT EXISTS (
        SELECT 1 FROM public.blocked_slots
        WHERE court_id = v_court_id
          AND date = p_date
          AND NOT (
            (start_hour + duration_hours <= p_start_hour) OR 
            (start_hour >= p_start_hour + p_duration_hours)
          )
      ) INTO v_is_free;

      IF NOT v_is_free THEN
        CONTINUE;
      END IF;

      v_assigned_courts := array_append(v_assigned_courts, v_court_id);
    END LOOP;
  END IF;

  -- 5. Ensure we allocated enough courts
  IF array_length(v_assigned_courts, 1) IS NULL OR array_length(v_assigned_courts, 1) < p_court_count THEN
    RAISE EXCEPTION 'Collision Error: Not enough free courts available for this time range';
  END IF;

  -- 6. Insert Bookings
  FOR v_i IN 1 .. p_court_count LOOP
    v_court_id := v_assigned_courts[v_i];
    
    -- Extras attach only to the first court row
    IF v_i = 1 THEN
      INSERT INTO public.bookings (
        user_id, court_id, date, start_hour, duration_hours, 
        total_price, status, notes, contact_phone
      ) VALUES (
        v_user_id, v_court_id, p_date, p_start_hour, p_duration_hours,
        v_single_court_price + v_extras_price, 'processing', p_notes, p_contact_phone
      ) RETURNING id INTO v_inserted_id;
      
      booking_id := v_inserted_id;
      court_id := v_court_id;
      total_price := v_single_court_price + v_extras_price;
      RETURN NEXT;
    ELSE
      INSERT INTO public.bookings (
        user_id, court_id, date, start_hour, duration_hours, 
        total_price, status, notes, contact_phone
      ) VALUES (
        v_user_id, v_court_id, p_date, p_start_hour, p_duration_hours,
        v_single_court_price, 'processing', p_notes, p_contact_phone
      ) RETURNING id INTO v_inserted_id;
      
      booking_id := v_inserted_id;
      court_id := v_court_id;
      total_price := v_single_court_price;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
