import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useTradeData } from "@/hooks/useTradeData";
import { HeroStats } from "@/components/dashboard/HeroStats";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SignalsLog } from "@/components/dashboard/SignalsLog";
import { AllInsightFeed } from "@/components/dashboard/AllInsightFeed";

const Index = () => {
  // Toome andmed hookidest
  const { portfolio, history, loading: portfolioLoading } = usePortfolioData();
  const { trades, loading: tradesLoading } = useTradeData();

  // Kui andmeid alles laetakse, näitame laadimisvaadet
  if (portfolioLoading && tradesLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center font-mono">
        <div className="text-green-500 animate-pulse tracking-[0.2em]">
          INITIALIZING_TERMINAL...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-mono selection:bg-green-500/30 pb-10">
      {/* Ülemine navigeerimisriba imitatsioon */}
      <header className="border-b border-green-900/30 p-4 mb-6 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-500 tracking-tighter">
            ARVUTID2 // <span className="text-white opacity-70">TRADEVIEW_V1</span>
          </h1>
          <div className="flex gap-4 text-[10px] text-green-800">
            <span>STATUS: <span className="text-green-500">CONNECTED</span></span>
            <span>SECURE_LINK: <span className="text-green-500">ACTIVE</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Portfelli koondvaade (USDT, BTC, Total) */}
        <HeroStats portfolio={portfolio} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vasak tulp: Graafik ja täiendav feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black/40 border border-green-900/20 rounded-lg p-1">
              <PriceChart data={history} />
            </div>
            
            <div className="bg-black/40 border border-green-900/20 rounded-lg p-4">
              <h3 className="text-[10px] text-green-700 uppercase mb-4 tracking-widest">Market_Insights_AI</h3>
              <AllInsightFeed />
            </div>
          </div>

          {/* Parem tulp: Trade logid (SignalsLog) */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 border border-green-900/20 rounded-lg p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] text-green-700 uppercase tracking-widest">Live_Signal_Log</h3>
                <span className="text-[9px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded animate-pulse">
                  REALTIME
                </span>
              </div>
              
              {/* SIIN ANNAME ANDMED EDASI */}
              <SignalsLog trades={trades} />
            </div>
          </div>
        </div>
      </main>

      {/* Jalus */}
      <footer className="max-w-7xl mx-auto px-4 mt-10 opacity-20 text-[10px] flex justify-between border-t border-green-900/20 pt-4">
        <span>© 2026 ARVUTID2_SYSTEMS</span>
        <span>ENCRYPTED_DATA_FEED</span>
      </footer>
    </div>
  );
};

export default Index;