-- Create table for storing generated logos per lead
CREATE TABLE IF NOT EXISTS public.lead_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  images JSONB NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_logos ENABLE ROW LEVEL SECURITY;

-- RLS policies mirroring other lead-related tables
CREATE POLICY "Users can select own lead_logos"
ON public.lead_logos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead_logos"
ON public.lead_logos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead_logos"
ON public.lead_logos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead_logos"
ON public.lead_logos
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to keep updated_at in sync
CREATE TRIGGER set_lead_logos_updated_at
BEFORE UPDATE ON public.lead_logos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-logos', 'lead-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read, owners manage their own files
CREATE POLICY "Public read access to lead logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lead-logos');

CREATE POLICY "Users can upload their own lead logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lead-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own lead logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'lead-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own lead logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'lead-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);