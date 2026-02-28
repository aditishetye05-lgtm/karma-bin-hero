
-- Add structured classification columns to scans table
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS recyclability text,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS disposal_recommendation text,
  ADD COLUMN IF NOT EXISTS item_type text;

-- Create scan_feedback table for user corrections
CREATE TABLE IF NOT EXISTS public.scan_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  original_category text NOT NULL,
  corrected_category text,
  original_material text,
  corrected_material text,
  feedback_type text NOT NULL DEFAULT 'confirmed',
  notes text,
  city text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback" ON public.scan_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON public.scan_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
