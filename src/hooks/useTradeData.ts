import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTradeData() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from("trade_logs")
      .select("*")
      .order("id", { ascending: false }) // KASUTAME 'id' tulpa sorteerimiseks, see on alati olemas!
      .limit(50);

    if (!error && data) {
      setTrades(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrades();
    const channel = supabase
      .channel("trades_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "trade_logs" }, 
      () => fetchTrades())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const chartData = [...trades].reverse().map(t => ({
    ...t,
    price: Number(t.price),
    pnl: t.pnl ? Number(t.pnl) : 0
  }));

  return { trades, latest: trades[0], chartData, loading };
}