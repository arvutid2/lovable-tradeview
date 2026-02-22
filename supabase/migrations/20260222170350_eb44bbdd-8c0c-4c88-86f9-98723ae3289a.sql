
-- Restrict INSERT to authenticated users only (service_role bypasses RLS anyway)
DROP POLICY "Service can insert trade_logs" ON public.trade_logs;
CREATE POLICY "Authenticated users can insert trade_logs"
  ON public.trade_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
