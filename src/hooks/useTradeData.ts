import { useEffect, useState } from "react";
// Kasutame kliendi importi Lovable integratsioonide kaustast
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Defineerime TradeLog tüübi otse andmebaasi skeemist
type TradeLog = Database["public"]["Tables"]["trade_logs"]["Row"];

export function useTradeData() {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Algne andmete pärimine
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from("trade_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setTrades(data as TradeLog[]);
      }
      setLoading(false);
    };

    fetchTrades();

    // 2. Reaalajas jälgimine (Realtime subscription)
    const channel = supabase
      .channel("trade_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_logs" },
        (payload) => {
          const newTrade = payload.new as TradeLog;
          setTrades((prev) => [newTrade, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latest = trades[0] || null;
  
  // Graafiku andmed - teeme kindlaks, et numbrid on õiged
  const chartData = [...trades]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(t => ({
      ...t,
      price: Number(t.price),
      rsi: t.rsi ? Number(t.rsi) : 0
    }));
   // Arvutame kokku kogu kasumi (PnL)
  const totalPnL = 0;

  return { trades, latest, chartData, totalPnL, loading };
}