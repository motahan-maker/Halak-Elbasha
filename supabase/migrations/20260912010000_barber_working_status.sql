-- Add is_working column to barbers table
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS is_working boolean NOT NULL DEFAULT false;
