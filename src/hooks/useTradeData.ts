import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TradeLog = Tables<"trade_logs">;

export const useTradeData = () => {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trade_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      // Teisendame andmed ja tagame, et pnl on olemas
      const transformedData: TradeLog[] = (data || []).map((item: any) => ({
        ...item,
        pnl: item.pnl !== undefined ? item.pnl : null,
        rsi: item.rsi || 0
      }));

      setTrades(transformedData);
    } catch (err) {
      console.error('Error fetching trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, []);

  return { trades, loading };
};