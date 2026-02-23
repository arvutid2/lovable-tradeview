import { useState, useEffect } from 'react';
// VEA PARANDUS 1: Veendu, et import viitab õigele asukohale. 
// Tavaliselt on see @/lib/supabase või @/integrations/supabase/client
import { supabase } from "@/lib/supabase"; 

// Defineerime Trade tüübi, et vältida "implicit any" vigu
export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  total: number;
  created_at: string;
}

export const useTradeData = () => {
  const [trades, setTrades] = useState<Trade[]>([]); // Kasutame tüüpi any asemel
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trade_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Valikuline: Teisendame andmed, kui baasist tulevad nimed erinevad
      setTrades((data as Trade[]) || []);
    } catch (err: any) {
      console.error('Error fetching trades:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, []);

  return { trades, loading };
};