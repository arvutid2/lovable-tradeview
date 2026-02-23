import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const usePortfolioData = () => {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      // Võtame ainult kõige viimase seisuga rea
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPortfolio(data[0]);
      }

      // Võtame kõik read graafiku jaoks
      const { data: historyData, error: historyError } = await supabase
        .from('portfolio')
        .select('*')
        .order('last_updated', { ascending: true });

      if (historyError) throw historyError;
      setHistory(historyData || []);

    } catch (error) {
      console.error("Viga andmete pärimisel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    // Uuendame andmeid iga 60 sekundi järel
    const interval = setInterval(fetchPortfolio, 60000);
    return () => clearInterval(interval);
  }, []); // <--- See [] on väga oluline!

  return { portfolio, history, loading };
};