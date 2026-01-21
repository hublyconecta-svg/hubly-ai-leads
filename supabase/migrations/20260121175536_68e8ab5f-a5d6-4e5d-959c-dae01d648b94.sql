-- Add WhatsApp/phone number to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS whatsapp TEXT;