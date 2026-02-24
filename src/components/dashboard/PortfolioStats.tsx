import { Card } from "@/components/ui/card";
import { DollarSign, Bitcoin, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface PortfolioStatsProps {
  portfolio: {
    usdt_balance: number;
    btc_balance: number;
    total_value_usdt: number;
    last_updated?: string;
  } | null;
  initialBalance?: number;
}

export const PortfolioStats = ({ portfolio, initialBalance = 10000 }: PortfolioStatsProps) => {
  if (!portfolio) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-[#1e2329] border border-[#30363d] rounded-lg" />
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const formatCrypto = (val: number) =>
    (val || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });

  const pnl = (portfolio.total_value_usdt || 0) - initialBalance;
  const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;
  const isProfit = pnl >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
      {/* Total Balance */}
      <Card className="bg-[#1e2329] border-[#30363d] p-4 hover:border-[#f0b90b]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Total Balance</span>
          <DollarSign className="w-4 h-4 text-[#f0b90b]" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tighter">
          {formatCurrency(portfolio.total_value_usdt)}
        </div>
        <div className="flex items-center mt-1 text-[10px] text-gray-600">
          <span className="bg-green-900/20 px-1 rounded text-green-500 text-[8px]">LIVE</span>
        </div>
      </Card>

      {/* P/L */}
      <Card className="bg-[#1e2329] border-[#30363d] p-4 hover:border-[#f0b90b]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Profit / Loss</span>
          {isProfit ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
        </div>
        <div className={`text-2xl font-bold tracking-tighter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
          {isProfit ? '+' : ''}{formatCurrency(pnl)}
        </div>
        <p className={`text-[10px] mt-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}% vs {formatCurrency(initialBalance)}
        </p>
      </Card>

      {/* Assets */}
      <Card className="bg-[#1e2329] border-[#30363d] p-4 hover:border-[#f0b90b]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Assets</span>
          <Bitcoin className="w-4 h-4 text-orange-500/70" />
        </div>
        <div className="text-sm font-bold text-white">
          {formatCrypto(portfolio.btc_balance)} <span className="text-[10px] text-gray-500">BTC</span>
        </div>
        <div className="text-sm font-bold text-white mt-1">
          {formatCurrency(portfolio.usdt_balance)} <span className="text-[10px] text-gray-500">USDT</span>
        </div>
      </Card>

      {/* Equity mini chart placeholder - needs history data */}
      <Card className="bg-[#1e2329] border-[#30363d] p-4 hover:border-[#f0b90b]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Equity Curve</span>
          <Wallet className="w-4 h-4 text-[#a78bfa]" />
        </div>
        <div className="text-[10px] text-gray-600 italic">See main chart equity line</div>
      </Card>
    </div>
  );
};
