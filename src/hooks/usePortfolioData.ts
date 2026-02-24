import { useState, useEffect } from 'react';
import { supabaseExternal as supabase } from "@/lib/supabaseExternal";

/**
 * Portfelli andmete liides vastavalt Supabase tabelile 'portfolio'
 */
export interface Portfolio {
  id: string;
  usdt_balance?: number | null;
  btc_balance?: number | null;
  total_value_usdt: number;
  created_at: string;
}

export const usePortfolioData = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        
        // Kasutame 'created_at' tulpa
        const { data, error: supabaseError } = await supabase
          .from('portfolio')
          .select('*')
          .order('created_at', { ascending: false }) 
          .limit(1)
          .maybeSingle(); // Võtab ühe rea või tagastab nulli ilma veata

        if (supabaseError) {
          console.error('Supabase fetch error:', supabaseError);
          throw new Error(supabaseError.message);
        }

        if (data) {
          setPortfolio(data as Portfolio);
        } else {
          console.warn('Portfolio table is empty.');
        }

      } catch (err: any) {
        setError(err.message);
        console.error('Error in usePortfolioData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();

    // Tellime reaalajas uuendused, et Dashboard püsiks värske
    const subscription = supabase
      .channel('portfolio-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'portfolio' }, 
        (payload) => {
          setPortfolio(payload.new as Portfolio);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { portfolio, loading, error };
};