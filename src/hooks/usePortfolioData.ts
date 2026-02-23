import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Defineerime tüübi otse andmebaasi skeemist
type PortfolioRow = Database["public"]["Tables"]["portfolio"]["Row"];

export function usePortfolioData() {
  const [history, setHistory] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      // Eemaldasime .order("created_at"), et vältida Error 400
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("id", 1); // Võtame boti põhiseisu

      if (error) {
        console.error("Portfolio fetch error:", error);
      } else if (data) {
        setHistory(data as PortfolioRow[]);
      }
    } catch (err) {
      console.error("Unexpected error fetching portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Algne pärimine
    fetchPortfolio();

    // 2. Reaalajas uuendamine (kui bot teeb UPDATE käsu)
    const channel = supabase
      .channel("portfolio_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "portfolio" },
        () => {
          fetchPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latest = history.length > 0 ? history[0] : null;
  
  // Arvutame PnL tuginedes 100 USDT alginvesteeringule (või muuda see oma summaks)
  const startingBalance = 100; 
  const currentTotal = latest ? Number(latest.total_value_usdt || 0) : startingBalance;
  
  const pnl = currentTotal - startingBalance;
  const pnlPercent = (pnl / startingBalance) * 100;

  return { 
    history, 
    latest, 
    pnl: Number(pnl.toFixed(2)), 
    pnlPercent: Number(pnlPercent.toFixed(2)), 
    loading 
  };
}