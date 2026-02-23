import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const usePortfolioData = () => {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Võtame värskeima seisuga portfolio rea
      const { data: portfolioData, error: pError } = await supabase
        .from('portfolio')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (pError) throw pError;

      // 2. Võtame ajaloo (kõik read graafiku jaoks)
      const { data: historyData, error: hError } = await supabase
        .from('portfolio')
        .select('*')
        .order('last_updated', { ascending: true });

      if (hError) throw hError;

      setPortfolio(portfolioData);
      setHistory(historyData);
    } catch (error) {
      console.error("Viga andmete pärimisel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Valikuline: Uuenda andmeid iga 30 sekundi järel, mitte iga millisekund!
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []); // [] tühi massiiv siin on KRIITILINE, see peatab lõputu tsükli

  return { portfolio, history, loading };
};