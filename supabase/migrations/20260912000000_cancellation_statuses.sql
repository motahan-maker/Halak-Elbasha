-- Migration to support cancelled_by_customer and cancelled_by_barber statuses
DO $$
BEGIN
  -- Add enum values if booking_status is an ENUM type
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    BEGIN
      ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cancelled_by_customer';
      ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cancelled_by_barber';
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Update get_booked_times RPC function to ignore all cancelled statuses
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
    AND b.status NOT IN ('cancelled', 'cancelled_by_customer', 'cancelled_by_barber');
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_times(uuid, date) TO authenticated;

-- Update create_booking RPC function to check status NOT IN ('cancelled', 'cancelled_by_customer', 'cancelled_by_barber')
CREATE OR REPLACE FUNCTION public.create_booking(
  _barber_id uuid,
  _service_id uuid,
  _booking_date date,
  _booking_time time
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_service public.services;
  v_booking public.bookings;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF v_profile IS NULL THEN RAISE EXCEPTION 'PROFILE_MISSING'; END IF;
  SELECT * INTO v_service FROM public.services WHERE id = _service_id AND is_active = true;
  IF v_service IS NULL THEN RAISE EXCEPTION 'SERVICE_INVALID'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE barber_id = _barber_id AND booking_date = _booking_date
      AND booking_time = _booking_time AND status NOT IN ('cancelled', 'cancelled_by_customer', 'cancelled_by_barber')
  ) THEN
    RAISE EXCEPTION 'SLOT_TAKEN';
  END IF;

  INSERT INTO public.bookings (
    customer_id, customer_name, customer_phone, barber_id, service_id,
    service_name, service_price, booking_date, booking_time
  ) VALUES (
    v_uid, v_profile.full_name, v_profile.phone, _barber_id, _service_id,
    v_service.name, v_service.price, _booking_date, _booking_time
  ) RETURNING * INTO v_booking;

  RETURN v_booking;
END $$;

GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, date, time) TO authenticated;

-- Update partial index for double booking prevention
DROP INDEX IF EXISTS public.bookings_no_double_idx;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_idx 
ON public.bookings (barber_id, booking_date, booking_time) 
WHERE status NOT IN ('cancelled', 'cancelled_by_customer', 'cancelled_by_barber');

-- Update RLS policies for update so barbers can update any status of their bookings (like cancelling)
DROP POLICY IF EXISTS "Bookings update" ON public.bookings;
CREATE POLICY "Bookings update" ON public.bookings FOR UPDATE TO authenticated
USING (
  (customer_id = auth.uid() AND status = 'booked')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = bookings.barber_id AND b.user_id = auth.uid())
);
