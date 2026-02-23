
-- Add BTC and USDT balance columns to portfolio
ALTER TABLE public.portfolio
  ADD COLUMN IF NOT EXISTS btc_balance NUMERIC,
  ADD COLUMN IF NOT EXISTS usdt_balance NUMERIC DEFAULT 0;
