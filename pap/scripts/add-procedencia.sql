-- Add procedencia (origin/source) column to patient table
ALTER TABLE public.patient
  ADD COLUMN IF NOT EXISTS procedencia TEXT;
