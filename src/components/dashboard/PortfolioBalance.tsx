import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, Bitcoin } from 'lucide-react';

interface Portfolio {
  id: string;
  created_at: string;
  total_value_usdt: number;
  btc_balance?: number | null;
  usdt_balance?: number | null;
}

export function PortfolioBalance() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('portfolio')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (supabaseError) {
        console.error('Portfolio fetch error:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      if (data) {
        setPortfolio(data as Portfolio);
        setError(null);
      } else {
        setError('Portfolio andmeid ei leitud');
      }
    } catch (err: any) {
      console.error('Portfolio error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    
    // Uuenda iga 10 sekundiga
    const interval = setInterval(fetchPortfolio, 10000);
    
    // Subscribe real-time updates
    const subscription = supabase
      .channel('portfolio-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio' },
        (payload) => {
          setPortfolio(payload.new as Portfolio);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading && !portfolio) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-slate-400">Portfelli andmete laadimine...</p>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-slate-900 p-6 rounded-xl border border-red-700/50 shadow-xl">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <span>⚠️</span>
          <p className="font-semibold">Portfelli laadimise viga</p>
        </div>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={fetchPortfolio}
          className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          Proovi uuesti
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-slate-400 text-center">Portfelli andmeid pole saadaval</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-green-400" />
          Portfelli Bilanss
        </h2>
        <div className="text-xs text-slate-500">
          Uuendatud: {portfolio.created_at 
            ? new Date(portfolio.created_at).toLocaleTimeString('et-EE')
            : 'N/A'
          }
        </div>
      </div>

      {/* Main balance card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-lg border border-slate-600 mb-4">
        <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Kogu väärtus USDT-s</p>
        <p className="text-4xl font-bold text-green-400">
          ${portfolio.total_value_usdt.toLocaleString('en-US', { 
            maximumFractionDigits: 2,
            minimumFractionDigits: 2 
          })}
        </p>
      </div>

      {/* Asset breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BTC Balance */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Bitcoin className="w-5 h-5 text-orange-400" />
            <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">BTC</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">
            {portfolio.btc_balance !== null && portfolio.btc_balance !== undefined
              ? portfolio.btc_balance.toFixed(6)
              : '—'
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">Bitcoin</p>
        </div>

        {/* USDT Balance */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">USDT</p>
          </div>
          <p className="text-2xl font-bold text-green-400">
            ${portfolio.usdt_balance !== null && portfolio.usdt_balance !== undefined
              ? portfolio.usdt_balance.toLocaleString('en-US', { 
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2 
                })
              : '—'
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">Likviidsus</p>
        </div>
      </div>

      {/* Info message */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded text-blue-400 text-xs">
        💡 Bilanss uueneb iga 10 sekundi tagant. Bot uuendab andmeid automaatselt.
      </div>
    </div>
  );
}

export default PortfolioBalance;
