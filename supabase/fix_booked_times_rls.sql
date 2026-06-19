-- SECURITY DEFINER function to get booked times for a barber on a date
-- Bypasses RLS so customers can see all bookings (not just their own)
-- to correctly determine slot availability
CREATE OR REPLACE FUNCTION public.get_booked_times(
  _barber_id uuid,
  _booking_date date
)
RETURNS TABLE(booking_time time)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.booking_time
  FROM public.bookings b
  WHERE b.barber_id = _barber_id
    AND b.booking_date = _booking_date
    AND b.status != 'cancelled';
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_times(uuid, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_booked_times(uuid, date) FROM PUBLIC, anon;
