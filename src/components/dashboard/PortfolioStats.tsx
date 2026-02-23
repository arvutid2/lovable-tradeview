import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface PortfolioRow {
  id: number;
  usdt_balance: number;
  btc_balance: number;
  total_value_usdt: number;
  last_updated: string;
}

export const usePortfolioData = () => {
  const [portfolio, setPortfolio] = useState<PortfolioRow | null>(null);
  const [history, setHistory] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      // 1. Võtame kogu ajaloo (viimased 20 kirjet) graafiku jaoks
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('last_updated', { ascending: true }) // Graafik tahab kronoloogilist järjekorda
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setHistory(data);
        // Viimane rida massiivis on meie "latest"
        setPortfolio(data[data.length - 1]);
      }
    } catch (error: any) {
      console.error('Error fetching portfolio:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 10000);
    return () => clearInterval(interval);
  }, []);

  return { portfolio, history, loading };
};