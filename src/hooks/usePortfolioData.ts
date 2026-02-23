import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePortfolioData = () => {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPortfolio = async () => {
    try {
      console.log("Fetching portfolio data...");
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        // KASUTAME 'last_updated' tulpa, sest sinu pildil on see olemas
        .order('last_updated', { ascending: false }) 
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Portfolio data received:", data);
      setPortfolio(data);
    } catch (error: any) {
      console.error('Error fetching portfolio:', error.message);
      toast({
        variant: "destructive",
        title: "Viga andmete laadimisel",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();

    // Uuenda andmeid iga 30 sekundi järel
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  return { portfolio, loading, refetch: fetchPortfolio };
};