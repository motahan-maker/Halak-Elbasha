-- Add unique index to strictly prevent double bookings at the database level
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_idx 
ON public.bookings (barber_id, booking_date, booking_time) 
WHERE status <> 'cancelled';
