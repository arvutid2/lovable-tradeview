import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useTradeData } from "@/hooks/useTradeData";
import { HeroStats } from "@/components/dashboard/HeroStats";
import { SignalsLog } from "@/components/dashboard/SignalsLog"; // Eeldusel, et see on su logi nimi

const Index = () => {
  const { portfolio, loading: pLoading } = usePortfolioData();
  const { trades, loading: tLoading } = useTradeData();

  if (pLoading) return <div className="bg-black h-screen text-green-500 p-10 font-mono animate-pulse">BOOTING_SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-black p-6 font-mono text-white">
      <h1 className="text-xl mb-8 border-b border-green-900 pb-2 text-green-500 tracking-[0.3em]">
        TERMINAL_V1.0.4 // NO_ACCESS_RESTRICTIONS
      </h1>
      
      <HeroStats portfolio={portfolio} />
      
      <div className="mt-10">
        <h3 className="text-xs text-green-800 mb-4 uppercase">Recent_Activity_Logs</h3>
        {/* Siia pane komponent, mis näitab trade_logs andmeid */}
        <pre className="text-[10px] text-green-600/70">
          {JSON.stringify(trades.slice(0, 5), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default Index;