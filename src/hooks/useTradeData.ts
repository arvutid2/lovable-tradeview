import { useEffect, useState } from "react";
import { supabaseExternal as supabase } from "@/lib/supabaseExternal";
import type { Tables } from "@/integrations/supabase/types";

type TradeLog = Tables<"trade_logs">;

export function useTradeData() {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from("trade_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setTrades(data);
      }
      setLoading(false);
    };

    fetchTrades();

    // Realtime subscription
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
  const chartData = [...trades].reverse();

  return { trades, latest, chartData, loading };
}
