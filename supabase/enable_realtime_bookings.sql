-- Enable Realtime on bookings table so barber page gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
