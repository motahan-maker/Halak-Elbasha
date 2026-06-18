-- =====================================================
-- RESET: Delete all data from tables (keeps schema)
-- Run this in Supabase SQL Editor to start fresh
-- =====================================================

-- Delete in order respecting foreign keys
DELETE FROM public.reviews;
DELETE FROM public.bookings;
DELETE FROM public.services;
DELETE FROM public.barbers;
DELETE FROM public.offers;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- Reset settings to defaults
DELETE FROM public.settings;
INSERT INTO public.settings (id, shop_name, whatsapp)
VALUES (1, 'حلاق الباشا', '+201018172606');

-- Reset booking sequence
ALTER SEQUENCE public.booking_seq RESTART WITH 1;

-- Delete all auth users except system users
DELETE FROM auth.users;

-- Re-seed default services
INSERT INTO public.services (name, description, price, is_active)
VALUES
  ('قص شعر', 'قص شعر كلاسيكي أو موديرن', 80, true),
  ('حلاقة ذقن', 'تشكيل وحلاقة الذقن', 50, true),
  ('قص شعر + ذقن', 'باقة كاملة', 120, true),
  ('صبغة شعر', 'صبغة شعر احترافية', 200, true),
  ('حمام كريم', 'حمام كريم وعناية', 100, true);
