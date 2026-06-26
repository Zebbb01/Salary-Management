-- Migration to add is_gifted column to borrowings table
ALTER TABLE public.borrowings ADD COLUMN IF NOT EXISTS is_gifted BOOLEAN NOT NULL DEFAULT false;
