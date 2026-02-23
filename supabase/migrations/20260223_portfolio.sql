
-- Create portfolio table
CREATE TABLE public.portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_value_usdt NUMERIC NOT NULL DEFAULT 0
);

-- Enable RLS (public read for dashboard)
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read portfolio
CREATE POLICY "Anyone can view portfolio"
  ON public.portfolio
  FOR SELECT
  USING (true);

-- Allow anyone to insert
CREATE POLICY "Anyone can insert portfolio"
  ON public.portfolio
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
