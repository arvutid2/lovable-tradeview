import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface TradeLog {
  id: string; // Muutsin stringiks, kuna UUID on tavaliselt string
  created_at: string;
  symbol: string;
  price: number;
  action: string;
  analysis_summary: string;
  bot_confidence: number;
  market_pressure?: number;
  fear_greed_index?: number;
  is_panic_mode?: boolean;
  rsi?: number;
  pnl?: number | null; // Lisatud pnl tugi
}

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