-- Fix foreign key constraints to allow deletion of barbers and services
-- Change RESTRICT to CASCADE so bookings are deleted when barber/service is removed

-- For barbers
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_barber_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_barber_id_fkey 
  FOREIGN KEY (barber_id) REFERENCES public.barbers(id) ON DELETE CASCADE;

-- For services
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_id_fkey 
  FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
