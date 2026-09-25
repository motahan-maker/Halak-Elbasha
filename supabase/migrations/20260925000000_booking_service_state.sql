-- =========================================================
-- Per-booking service state
--   bookings.started_at   -> barber pressed "ابدأ الخدمة"
--   bookings.completed_at -> barber pressed "إنهاء"
-- Replaces the single global barbers.is_working flag with
-- per-appointment tracking so several appointments can be
-- handled in sequence without blocking the whole dashboard.
-- =========================================================

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- keep completed_at consistent with the status enum
UPDATE public.bookings
SET completed_at = COALESCE(completed_at, now())
WHERE status = 'completed' AND completed_at IS NULL;

-- =========================================================
-- start_booking_service
-- =========================================================
CREATE OR REPLACE FUNCTION public.start_booking_service(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.bookings WHERE id = _booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الموعد غير موجود';
  END IF;

  -- allowed: the assigned barber, or an admin
  IF NOT (
    public.has_role(_uid, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = _row.barber_id AND b.user_id = _uid
    )
  ) THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  IF _row.status <> 'booked' THEN
    RAISE EXCEPTION 'لا يمكن بدء خدمة على موعد %', _row.status;
  END IF;

  UPDATE public.bookings
  SET started_at = COALESCE(started_at, now())
  WHERE id = _booking_id;

  -- mark the barber as busy for the rest of the app
  UPDATE public.barbers
  SET is_working = true
  WHERE id = _row.barber_id;

  PERFORM pg_notify('pgrst', 'reload schema');

  RETURN jsonb_build_object('ok', true, 'booking_id', _booking_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_booking_service(uuid) TO authenticated, service_role;

-- =========================================================
-- complete_booking_service
-- =========================================================
CREATE OR REPLACE FUNCTION public.complete_booking_service(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.bookings%ROWTYPE;
  _remaining int;
BEGIN
  SELECT * INTO _row FROM public.bookings WHERE id = _booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الموعد غير موجود';
  END IF;

  IF NOT (
    public.has_role(_uid, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = _row.barber_id AND b.user_id = _uid
    )
  ) THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  UPDATE public.bookings
  SET status = 'completed',
      completed_at = now(),
      started_at = COALESCE(started_at, now())
  WHERE id = _booking_id;

  -- free the barber only when nothing else is in progress
  SELECT count(*) INTO _remaining
  FROM public.bookings
  WHERE barber_id = _row.barber_id
    AND status = 'booked'
    AND started_at IS NOT NULL
    AND completed_at IS NULL
    AND id <> _booking_id;

  IF _remaining = 0 THEN
    UPDATE public.barbers SET is_working = false WHERE id = _row.barber_id;
  END IF;

  PERFORM pg_notify('pgrst', 'reload schema');

  RETURN jsonb_build_object('ok', true, 'booking_id', _booking_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_booking_service(uuid) TO authenticated, service_role;

-- =========================================================
-- cancel_booking_by_customer / cancel_booking_by_barber
-- (re-created if missing so a fresh project has them too)
-- =========================================================
CREATE OR REPLACE FUNCTION public.cancel_booking_by_customer(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.bookings WHERE id = _booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الموعد غير موجود';
  END IF;

  IF NOT (public.has_role(_uid, 'admin') OR _row.customer_id = _uid) THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  IF _row.status <> 'booked' THEN
    RAISE EXCEPTION 'لا يمكن إلغاء موعد %', _row.status;
  END IF;

  IF _row.started_at IS NOT NULL THEN
    RAISE EXCEPTION 'الخدمة بدأت بالفعل — تواصل مع الصالون';
  END IF;

  UPDATE public.bookings SET status = 'cancelled_by_customer' WHERE id = _booking_id;

  PERFORM pg_notify('pgrst', 'reload schema');

  RETURN jsonb_build_object('ok', true, 'booking_id', _booking_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_booking_by_customer(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_booking_by_barber(_booking_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.bookings%ROWTYPE;
  _remaining int;
BEGIN
  SELECT * INTO _row FROM public.bookings WHERE id = _booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الموعد غير موجود';
  END IF;

  IF NOT (
    public.has_role(_uid, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = _row.barber_id AND b.user_id = _uid
    )
  ) THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  IF _row.status <> 'booked' THEN
    RAISE EXCEPTION 'لا يمكن إلغاء موعد %', _row.status;
  END IF;

  UPDATE public.bookings SET status = 'cancelled_by_barber' WHERE id = _booking_id;

  SELECT count(*) INTO _remaining
  FROM public.bookings
  WHERE barber_id = _row.barber_id
    AND status = 'booked'
    AND started_at IS NOT NULL
    AND completed_at IS NULL;

  IF _remaining = 0 THEN
    UPDATE public.barbers SET is_working = false WHERE id = _row.barber_id;
  END IF;

  PERFORM pg_notify('pgrst', 'reload schema');

  RETURN jsonb_build_object('ok', true, 'booking_id', _booking_id, 'reason', _reason);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_booking_by_barber(uuid, text) TO authenticated, service_role;
