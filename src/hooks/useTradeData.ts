import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface TradeLog {
  id: number;
  symbol: string;
  price: number;
  action: string;
  bot_confidence: number;
  pnl: number | null;
  created_at: string; // trade_logs tabelis on see olemas
  analysis_summary: string;
}

export const useTradeData = () => {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const { data, error } = await supabase
          .from('trade_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
    
    // LIVE UPDATE: Tellime teavitused uute tehingute kohta
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_logs' }, 
        (payload) => {
          setTrades((prev) => [payload.new as TradeLog, ...prev]);
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { trades, loading };
};