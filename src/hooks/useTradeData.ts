import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Defineerime täpselt need väljad, mida pildil 6 nägime
export interface TradeLog {
  id: number;
  created_at: string;
  symbol: string;
  price: number;
  vol: number;
  action: string;
  analysis_summary: string;
  bot_confidence: number;
  market_pressure: number;
  fear_greed_index: number;
  is_panic_mode: boolean;
  // LISA NEED READ SIIT:
  pnl?: number | null; 
  rsi?: number | null;
}

export const useTradeData = () => {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      // Teeme päringu ilma tüübi sundimiseta alguses
      const { data, error } = await supabase
        .from('trade_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Supabase error fetching trades:', error);
        return;
      }
      
      // Kasutame 'unknown' vaheetappi, et TypeScript ei pahandaks
      setTrades((data as unknown as TradeLog[]) || []);
    } catch (err) {
      console.error('Unexpected error in useTradeData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000);
    return () => clearInterval(interval);
  }, []);

  return { trades, loading };
};