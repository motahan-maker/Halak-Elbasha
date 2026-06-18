
ALTER FUNCTION public.set_booking_number() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
-- These SECURITY DEFINER functions are intentionally exposed; the linter only warns.
