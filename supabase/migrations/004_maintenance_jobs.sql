-- Migration 004: Maintenance Jobs & Auto-completion Procedures
-- Implements run_booking_maintenance and refresh_booking_statuses.

CREATE OR REPLACE FUNCTION public.run_booking_maintenance()
RETURNS VOID SECURITY DEFINER AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. confirmed where session end < now -> completed
  -- End time of a session: date + start_hour + duration_hours
  -- We construct a timestamp in local timezone. Since Supabase runs in UTC by default,
  -- we calculate ending timestamp for comparison.
  UPDATE public.bookings
  SET status = 'completed'
  WHERE status = 'confirmed'
    AND (
      (date + (start_hour + duration_hours) * INTERVAL '1 hour')::TIMESTAMP AT TIME ZONE 'Asia/Manila' < v_now AT TIME ZONE 'Asia/Manila'
    );

  -- 2. processing without payment_reference and created_at > 30 mins ago -> cancelled
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status = 'processing'
    AND (payment_reference IS NULL OR trim(payment_reference) = '')
    AND created_at < (v_now - INTERVAL '30 minutes');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.refresh_booking_statuses()
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
  -- Check admin permission
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can trigger status refresh';
  END IF;
  
  -- Run the maintenance routine
  PERFORM public.run_booking_maintenance();
END;
$$ LANGUAGE plpgsql;
