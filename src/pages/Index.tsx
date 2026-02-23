import { HeroStats } from "@/components/dashboard/HeroStats";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SignalsLog } from "@/components/dashboard/SignalsLog";
import { AIInsightFeed } from "@/components/dashboard/AIInsightFeed";
import { PortfolioStats } from "@/components/dashboard/PortfolioStats";
import { useTradeData } from "@/hooks/useTradeData";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const Index = () => {
  // Me lisasime useTradeData-sse varem 'totalPnL', võtame selle ka siit välja
  const { trades, latest, chartData, loading } = useTradeData();
  const portfolio = usePortfolioData();

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--neon-green))] animate-pulse" />
            <h1 className="text-lg font-mono font-bold tracking-tight">
              <span className="text-[hsl(var(--neon-green))]">CRYPTO</span>
              <span className="text-muted-foreground">::</span>
              <span className="text-foreground">TERMINAL</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="hidden sm:inline">LIVE STATUS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--neon-green))] animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Kasutame div-ümbriseid, et vältida Ref-vigu */}
        <div className="stats-wrapper">
          <PortfolioStats
            latest={portfolio.latest}
            history={portfolio.history}
            pnl={portfolio.pnl}
            pnlPercent={portfolio.pnlPercent}
            loading={portfolio.loading}
          />
        </div>

        <div className="hero-wrapper">
          <HeroStats latest={latest} loading={loading} />
        </div>

        <div className="chart-wrapper">
          {/* PriceChart vajab andmeid. Kui chartData on tühi, näidatakse tühjust */}
          <PriceChart data={chartData} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="logs-wrapper">
            <SignalsLog trades={trades} />
          </div>
          <div className="insight-wrapper">
            <AIInsightFeed latest={latest} trades={trades} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 md:px-8 py-3 mt-8">
        <div className="max-w-7xl mx-auto text-center text-xs font-mono text-muted-foreground">
          v10.1 Sentinel Active • Database: {latest ? 'CONNECTED' : 'WAITING...'}
        </div>
      </footer>
    </div>
  );
};

export default Index;