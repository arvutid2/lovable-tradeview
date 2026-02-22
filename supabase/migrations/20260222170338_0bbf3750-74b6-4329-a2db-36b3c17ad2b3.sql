
-- Create trade_logs table
CREATE TABLE public.trade_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price NUMERIC NOT NULL,
  rsi NUMERIC,
  action TEXT NOT NULL DEFAULT 'HOLD',
  analysis_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  symbol TEXT NOT NULL DEFAULT 'BTC/USDT'
);

-- Enable RLS (public read for dashboard, insert for service role / bot)
ALTER TABLE public.trade_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read trade logs (public dashboard)
CREATE POLICY "Anyone can view trade_logs"
  ON public.trade_logs
  FOR SELECT
  USING (true);

-- Allow anyone to insert (your Python bot uses service_role key)
CREATE POLICY "Service can insert trade_logs"
  ON public.trade_logs
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_logs;
