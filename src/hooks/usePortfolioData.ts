import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Portfelli andmete liides vastavalt Supabase tabelile 'portfolio'
 */
export interface Portfolio {
  id: number;
  usdt_balance: number;
  btc_balance: number;
  total_value_usdt: number;
  last_updated: string;
}

export const usePortfolioData = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        
        // Kasutame 'last_updated' tulpa, kuna 'created_at' puudub tabelis
        const { data, error: supabaseError } = await supabase
          .from('portfolio')
          .select('*')
          .order('last_updated', { ascending: false }) 
          .limit(1)
          .maybeSingle(); // Võtab ühe rea või tagastab nulli ilma veata

        if (supabaseError) {
          console.error('Supabase fetch error:', supabaseError);
          throw new Error(supabaseError.message);
        }

        if (data) {
          setPortfolio(data as Portfolio);
        } else {
          console.warn('Portfolio table is empty. Please ensure row with ID 1 exists.');
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