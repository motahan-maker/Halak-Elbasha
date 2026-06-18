-- =====================================================
-- FULL RESET: حذف كل البيانات + إعادة تهيئة السيستم
-- شغّل هذا في Supabase SQL Editor
-- =====================================================

-- 1. حذف كل البيانات بالترتيب ( respecting foreign keys )
DELETE FROM public.reviews;
DELETE FROM public.bookings;
DELETE FROM public.services;
DELETE FROM public.barbers;
DELETE FROM public.offers;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- 2. إعادة ضبط الإعدادات
DELETE FROM public.settings;
INSERT INTO public.settings (id, shop_name, whatsapp)
VALUES (1, 'حلاق الباشا', '+201018172606');

-- 3. إعادة ضبط تسلسل أرقام الحجز
ALTER SEQUENCE public.booking_seq RESTART WITH 1;

-- 4. حذف كل المستخدمين
DELETE FROM auth.users;

-- 5. إعادة إدخال الخدمات الافتراضية
INSERT INTO public.services (name, description, price, is_active)
VALUES
  ('قص شعر', 'قص شعر كلاسيكي أو موديرن', 80, true),
  ('حلاقة ذقن', 'تشكيل وحلاقة الذقن', 50, true),
  ('قص شعر + ذقن', 'باقة كاملة', 120, true),
  ('صبغة شعر', 'صبغة شعر احترافية', 200, true),
  ('حمام كريم', 'حمام كريم وعناية', 100, true);
