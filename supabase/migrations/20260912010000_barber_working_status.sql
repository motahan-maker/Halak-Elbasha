-- Ensure is_working column exists on barbers table
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS is_working boolean NOT NULL DEFAULT false;

-- Create RPC function to set barber working status safely
CREATE OR REPLACE FUNCTION public.set_barber_working_status(
  _barber_id uuid,
  _is_working boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add column if missing dynamically
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'is_working'
  ) THEN
    EXECUTE 'ALTER TABLE public.barbers ADD COLUMN is_working boolean NOT NULL DEFAULT false';
  END IF;

  -- Update status
  UPDATE public.barbers
  SET is_working = _is_working
  WHERE id = _barber_id;

  -- Reload PostgREST schema cache
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_barber_working_status(uuid, boolean) TO authenticated, service_role;
