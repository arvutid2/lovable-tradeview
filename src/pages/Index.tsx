import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useTradeData } from "@/hooks/useTradeData";
import { HeroStats } from "@/components/dashboard/HeroStats";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SignalsLog } from "@/components/dashboard/SignalsLog";
import { AllInsightFeed } from "@/components/dashboard/AllInsightFeed";
import { Loader2 } from "lucide-react";

const Index = () => {
  // 1. Toome andmed hookidest
  const { trades, loading: tradesLoading } = useTradeData();
  const { portfolio, history, loading: portfolioLoading } = usePortfolioData();

  // Derive latest market price from trades or history to compute BTC holdings when not provided
  const latestPrice = trades?.[0]?.price ?? (history && history.length ? (history[history.length - 1] as any).price : null);

  // 2. Laadimisvaade (et vältida tühja lehte)
  if (portfolioLoading && tradesLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center font-mono">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
        <div className="text-green-500 animate-pulse tracking-[0.2em] text-xs">
          ESTABLISHING_SECURE_CONNECTION...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-mono selection:bg-green-500/30 pb-10">
      {/* HEADER / TERMINAL STATUS */}
      <header className="border-b border-green-900/30 p-4 mb-6 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-green-500 tracking-tighter">
              ARVUTID2 // <span className="text-white opacity-70 font-light">SYSTEM_DASHBOARD</span>
            </h1>
          </div>
          <div className="flex gap-6 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-green-900 uppercase">Status:</span>
              <span className="text-green-500 animate-pulse">● ONLINE</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-green-900 uppercase">Network:</span>
              <span className="text-green-500 text-xs">MAINNET_V1</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 space-y-6">
        {/* TOP STATS: Balanss, BTC hind jne */}
        <HeroStats portfolio={portfolio} latestPrice={latestPrice} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE: Graafik ja Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black/60 border border-green-900/20 rounded-lg p-1 shadow-2xl shadow-green-900/5">
              <PriceChart data={history} />
            </div>
            
            <div className="bg-black/60 border border-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 border-b border-green-900/10 pb-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <h3 className="text-[10px] text-green-700 uppercase tracking-widest">Neural_Insight_Feed</h3>
              </div>
              <AllInsightFeed />
            </div>
          </div>

          {/* RIGHT SIDE: Live Trade Logid */}
          <div className="lg:col-span-1">
            <div className="bg-black/60 border border-green-900/20 rounded-lg p-4 h-full shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-green-900/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 animate-pulse rounded-full" />
                  <h3 className="text-[10px] text-green-700 uppercase tracking-widest font-bold">Live_Signal_Log</h3>
                </div>
                <span className="text-[9px] text-green-900">
                  REFRESH: 10S
                </span>
              </div>
              
              {/* ANDMETE SAATMINE KOMPONENTI */}
              <SignalsLog trades={trades} />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 opacity-30 text-[9px] flex justify-between border-t border-green-900/20 pt-4 font-light italic">
        <span>© 2026 ARVUTID2_CORP</span>
        <span className="uppercase">End_to_end_encrypted_terminal_access</span>
      </footer>
    </div>
  );
};

export default Index;