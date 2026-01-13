-- Create lead_sites table to store generated site versions per lead
CREATE TABLE IF NOT EXISTS public.lead_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  html text NOT NULL,
  css text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on lead_sites
ALTER TABLE public.lead_sites ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can manage only their own generated sites
CREATE POLICY "Users can select own lead sites"
ON public.lead_sites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead sites"
ON public.lead_sites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead sites"
ON public.lead_sites
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead sites"
ON public.lead_sites
FOR DELETE
USING (auth.uid() = user_id);

-- Attach generic updated_at trigger if not already used
CREATE TRIGGER set_lead_sites_updated_at
BEFORE UPDATE ON public.lead_sites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();