-- =========================================================
-- حلاق الباشا — Full Schema for Fresh Supabase Project
-- Run this in Supabase SQL Editor
-- =========================================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'barber', 'customer');
CREATE TYPE public.booking_status AS ENUM ('booked', 'completed', 'cancelled');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_phone_key ON public.profiles(phone);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'barber' THEN 2 ELSE 3 END LIMIT 1
$$;

-- Profile policies
CREATE POLICY "Profiles self read" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'barber'));
CREATE POLICY "Profiles self insert" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "Roles self read" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- BARBERS
-- =========================================================
CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  specialization text,
  is_active boolean NOT NULL DEFAULT true,
  working_days int[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,6],
  start_time time NOT NULL DEFAULT '10:00',
  end_time time NOT NULL DEFAULT '23:00',
  break_start time,
  break_end time,
  slot_minutes int NOT NULL DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbers TO authenticated;
GRANT ALL ON public.barbers TO service_role;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbers readable to all auth" ON public.barbers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Barbers admin write" ON public.barbers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Barbers admin update" ON public.barbers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Barbers admin delete" ON public.barbers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SERVICES
-- =========================================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services readable to all auth" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Services admin write" ON public.services FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default services
INSERT INTO public.services (name, description, price, is_active) VALUES
  ('قص شعر', 'قص شعر كلاسيكي أو موديرن', 80, true),
  ('حلاقة ذقن', 'تشكيل وحلاقة الذقن', 50, true),
  ('قص شعر + ذقن', 'باقة كاملة', 120, true),
  ('صبغة شعر', 'صبغة شعر احترافية', 200, true),
  ('حمام كريم', 'حمام كريم وعناية', 100, true);

-- =========================================================
-- BOOKINGS
-- =========================================================
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name text NOT NULL,
  service_price numeric(10,2) NOT NULL DEFAULT 0,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_no_double UNIQUE (barber_id, booking_date, booking_time)
);
CREATE INDEX bookings_customer_idx ON public.bookings(customer_id);
CREATE INDEX bookings_barber_idx ON public.bookings(barber_id);
CREATE INDEX bookings_date_idx ON public.bookings(booking_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings customer read own" ON public.bookings FOR SELECT TO authenticated
USING (
  customer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = bookings.barber_id AND b.user_id = auth.uid())
);
CREATE POLICY "Bookings customer create" ON public.bookings FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Bookings update" ON public.bookings FOR UPDATE TO authenticated
USING (
  (customer_id = auth.uid() AND status = 'booked')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = bookings.barber_id AND b.user_id = auth.uid())
);
CREATE POLICY "Bookings admin delete" ON public.bookings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Booking number sequence
CREATE SEQUENCE public.booking_seq START 1;
CREATE OR REPLACE FUNCTION public.set_booking_number() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK-' || lpad(nextval('public.booking_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_set_booking_number BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_number();

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_barber_idx ON public.reviews(barber_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews readable to all auth" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reviews customer create" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.bookings b
              WHERE b.customer_id = auth.uid() AND b.barber_id = reviews.barber_id AND b.status = 'completed')
);
CREATE POLICY "Reviews admin delete" ON public.reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR customer_id = auth.uid());

-- =========================================================
-- OFFERS
-- =========================================================
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_percent int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers readable to all auth" ON public.offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Offers admin write" ON public.offers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SETTINGS
-- =========================================================
CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name text NOT NULL DEFAULT 'حلاق الباشا',
  address text DEFAULT '',
  whatsapp text DEFAULT '+201018172606',
  facebook text DEFAULT '',
  instagram text DEFAULT '',
  tiktok text DEFAULT '',
  working_days int[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  start_time time NOT NULL DEFAULT '12:00',
  end_time time NOT NULL DEFAULT '23:00',
  break_start time DEFAULT '19:00',
  break_end time DEFAULT '20:00',
  slot_minutes int NOT NULL DEFAULT 40,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO authenticated;
GRANT INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings readable to all auth" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings admin write" ON public.settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (id, shop_name, whatsapp)
VALUES (1, 'حلاق الباشا', '+201018172606')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FUNCTIONS
-- =========================================================

-- Transactional booking (prevents double booking)
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
      AND booking_time = _booking_time AND status <> 'cancelled'
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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'full_name' AND NEW.raw_user_meta_data ? 'phone' THEN
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer'))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SECURITY: Revoke from anon, grant to authenticated
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, uuid, date, time) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, date, time) TO authenticated;

-- =========================================================
-- DOUBLE BOOKING PREVENTION (partial unique index)
-- =========================================================
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_idx
ON public.bookings (barber_id, booking_date, booking_time)
WHERE status <> 'cancelled';
