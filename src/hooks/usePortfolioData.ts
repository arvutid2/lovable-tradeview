import { useEffect, useState } from "react";
import { supabaseExternal as supabase } from "@/lib/supabaseExternal";

export interface PortfolioRow {
  id: string;
  total_value_usdt: number;
  btc_balance: number;
  usdt_balance: number;
  created_at: string;
}

export function usePortfolioData() {
  const [history, setHistory] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(500);

      if (!error && data) {
        setHistory(data as PortfolioRow[]);
      }
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel("portfolio_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "portfolio" },
        (payload) => {
          const row = payload.new as PortfolioRow;
          setHistory((prev) => [...prev, row].slice(-500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const startingBalance = 10000;
  const pnl = latest ? latest.total_value_usdt - startingBalance : 0;
  const pnlPercent = latest ? ((latest.total_value_usdt - startingBalance) / startingBalance) * 100 : 0;

  return { history, latest, pnl, pnlPercent, loading };
}
