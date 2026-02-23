import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PortfolioRow {
  id: number;
  total_value_usdt: number;
  btc_balance: number;
  usdt_balance: number;
}

export function usePortfolioData() {
  const [history, setHistory] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    // EEMALDATUD order() ja limit(), et vältida Error 400
    const { data, error } = await supabase
      .from("portfolio")
      .select("id, total_value_usdt, btc_balance, usdt_balance");

    if (!error && data) {
      setHistory(data as PortfolioRow[]);
    } else {
      console.error("Supabase error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolio();

    const channel = supabase
      .channel("portfolio_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio" }, 
      () => fetchPortfolio())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const latest = history.length > 0 ? history[0] : null;
  const startingBalance = 100; // Sinu algne summa
  const pnl = latest ? Number(latest.total_value_usdt) - startingBalance : 0;
  const pnlPercent = latest ? (pnl / startingBalance) * 100 : 0;

  return { history, latest, pnl, pnlPercent, loading };
}