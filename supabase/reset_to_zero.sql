-- صفر النظام بالكامل — شغّل في Supabase SQL Editor
DELETE FROM public.push_subscriptions;
DELETE FROM public.reviews;
DELETE FROM public.bookings;
DELETE FROM public.services;
DELETE FROM public.barbers;
DELETE FROM public.offers;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.settings;
DELETE FROM auth.users;

INSERT INTO public.settings (id, shop_name, whatsapp)
VALUES (1, 'حلاق الباشا', '+201018172606');

ALTER SEQUENCE public.booking_seq RESTART WITH 1;

INSERT INTO public.services (name, description, price, is_active)
VALUES
  ('قص شعر', 'قص شعر كلاسيكي أو موديرن', 80, true),
  ('حلاقة ذقن', 'تشكيل وحلاقة الذقن', 50, true),
  ('قص شعر + ذقن', 'باقة كاملة', 120, true),
  ('صبغة شعر', 'صبغة شعر احترافية', 200, true),
  ('حمام كريم', 'حمام كريم وعناية', 100, true);
