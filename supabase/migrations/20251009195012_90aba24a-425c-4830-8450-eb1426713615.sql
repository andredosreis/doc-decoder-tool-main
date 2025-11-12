-- Add thumbnail_url column to modules table
ALTER TABLE public.modules 
ADD COLUMN thumbnail_url text;