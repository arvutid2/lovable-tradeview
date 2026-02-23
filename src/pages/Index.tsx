import { HeroStats } from "@/components/dashboard/HeroStats";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SignalsLog } from "@/components/dashboard/SignalsLog";
import { AIInsightFeed } from "@/components/dashboard/AIInsightFeed";
import { PortfolioStats } from "@/components/dashboard/PortfolioStats";
import { useTradeData } from "@/hooks/useTradeData";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const Index = () => {
  const { trades, loading: tradesLoading } = useTradeData();
  // Võtame hookist välja ka 'history'
  const { portfolio, history, loading: portfolioLoading } = usePortfolioData();

  const latestTrade = trades && trades.length > 0 ? trades[0] : null;
  
  // Algkapital on 10 000. Kasutame Number(), et olla kindlad, et arvutame numbritega
  const initialCapital = 10000;
  const currentTotalValue = portfolio ? Number(portfolio.total_value_usdt) : 0;
  const pnl = currentTotalValue > 0 ? currentTotalValue - initialCapital : 0;
  const pnlPercent = currentTotalValue > 0 ? (pnl / initialCapital) * 100 : 0;

  // Graafiku andmed trade_logs tabelist
  const chartData = trades && trades.length > 0 
    ? [...trades].reverse().map((t) => ({
        time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: Number(t.price),
        value: Number(t.price)
      }))
    : [];

  const loading = tradesLoading || portfolioLoading;

  return (
    <div className="min-h-screen bg-background bg-grid">
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

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        <div className="stats-wrapper">
          <PortfolioStats
            latest={portfolio}
            history={history || []} // Nüüd on history päriselt olemas
            pnl={pnl}
            pnlPercent={pnlPercent}
            loading={portfolioLoading}
          />
        </div>

        <div className="hero-wrapper">
          <HeroStats latest={latestTrade} loading={loading} />
        </div>

        <div className="chart-wrapper">
          <PriceChart data={chartData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="logs-wrapper">
            <SignalsLog trades={trades} />
          </div>
          <div className="insight-wrapper">
            <AIInsightFeed latest={latestTrade} trades={trades} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 px-4 md:px-8 py-3 mt-8">
        <div className="max-w-7xl mx-auto text-center text-xs font-mono text-muted-foreground">
          v10.1 Sentinel Active • Database: {portfolio ? 'CONNECTED' : 'WAITING...'}
        </div>
      </footer>
    </div>
  );
};

export default Index;