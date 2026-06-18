
-- Per-barber schedule for automatic slot generation (40-min slots)
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS working_days int[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,6],
  ADD COLUMN IF NOT EXISTS start_time time NOT NULL DEFAULT '10:00',
  ADD COLUMN IF NOT EXISTS end_time time NOT NULL DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS break_start time,
  ADD COLUMN IF NOT EXISTS break_end time,
  ADD COLUMN IF NOT EXISTS slot_minutes int NOT NULL DEFAULT 40;

-- Seed default services if none exist
INSERT INTO public.services (name, description, price, is_active)
SELECT * FROM (VALUES
  ('قص شعر', 'قص شعر كلاسيكي أو موديرن', 80, true),
  ('حلاقة ذقن', 'تشكيل وحلاقة الذقن', 50, true),
  ('قص شعر + ذقن', 'باقة كاملة', 120, true),
  ('صبغة شعر', 'صبغة شعر احترافية', 200, true),
  ('حمام كريم', 'حمام كريم وعناية', 100, true)
) AS v(name, description, price, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.services);
