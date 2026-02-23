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
      console.log("Fetching portfolio...");
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('last_updated', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Teisendame kõik väljad numbriteks, et vältida "string" vigu
        const formattedData = data.map(row => ({
          ...row,
          usdt_balance: Number(row.usdt_balance),
          btc_balance: Number(row.btc_balance),
          total_value_usdt: Number(row.total_value_usdt)
        }));

        setHistory(formattedData);
        setPortfolio(formattedData[formattedData.length - 1]);
        console.log("Portfolio updated:", formattedData[formattedData.length - 1]);
      }
    } catch (error: any) {
      console.error('Error fetching portfolio:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 5000); // Lühendame intervalli 5 sekundi peale testiks
    return () => clearInterval(interval);
  }, []);

  return { portfolio, history, loading };
};