import { useState, useEffect } from 'react';
// Kasutame Lovable'i vaikimisi klienti
import { supabase } from "@/integrations/supabase/client";

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
      
      setTrades(data as TradeLog[] || []);
    } catch (err) {
      console.error('Unexpected error fetching trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000); // 15 sekundi järel on piisav
    return () => clearInterval(interval);
  }, []);

  return { trades, loading };
};