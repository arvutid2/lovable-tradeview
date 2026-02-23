-- Insert sample portfolio data for testing
-- Käivita see Supabase SQL Editoaris

INSERT INTO public.portfolio (id, created_at, total_value_usdt, btc_balance, usdt_balance)
VALUES 
  (
    gen_random_uuid(),
    NOW(),
    47250.50,
    0.5,
    4500.50
  )
ON CONFLICT DO NOTHING;

-- Verifiteeri:
SELECT * FROM public.portfolio ORDER BY created_at DESC LIMIT 1;
