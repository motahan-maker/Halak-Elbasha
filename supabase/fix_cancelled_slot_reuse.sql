-- Drop the table-level UNIQUE constraint that blocks rebooking cancelled slots
-- The partial index bookings_no_double_idx already handles this correctly
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_double;
