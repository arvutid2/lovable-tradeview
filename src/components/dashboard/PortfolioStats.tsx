import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, Wallet, Bitcoin, DollarSign } from "lucide-react";

interface PortfolioStatsProps {
  portfolio: {
    usdt_balance: number;
    btc_balance: number;
    total_value_usdt: number;
    last_updated?: string;
  } | null;
}

export const PortfolioStats = ({ portfolio }: PortfolioStatsProps) => {
  // Kui andmeid pole veel laetud, näitame tühje kaste (skeletti)
  if (!portfolio) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-green-900/10 border border-green-900/20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Formaatimise abi-funktsioonid puhta koodi jaoks
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  
  const formatCrypto = (val: number) => 
    (val || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
      {/* KOGUVÄÄRTUS (USDT) */}
      <Card className="bg-black/40 border-green-900/30 p-4 hover:border-green-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-green-700 uppercase tracking-widest">Net Worth (USDT)</span>
          <DollarSign className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-500 tracking-tighter">
          {formatCurrency(portfolio.total_value_usdt)}
        </div>
        <div className="flex items-center mt-1 text-[10px] text-green-800">
          <span className="bg-green-900/20 px-1 rounded text-green-500">LIVE</span>
          <span className="ml-2 opacity-50">STABLE_FEED_ACTIVE</span>
        </div>
      </Card>

      {/* BTC BALANSS */}
      <Card className="bg-black/40 border-green-900/30 p-4 hover:border-green-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-green-700 uppercase tracking-widest">Asset: BTC</span>
          <Bitcoin className="w-4 h-4 text-orange-500/70" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tighter">
          {formatCrypto(portfolio.btc_balance)} <span className="text-xs text-green-900">BTC</span>
        </div>
        <div className="mt-1 text-[10px] text-green-800 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-ping"></div>
          SYNC_OK
        </div>
      </Card>

      {/* USDT BALANSS */}
      <Card className="bg-black/40 border-green-900/30 p-4 hover:border-green-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-green-700 uppercase tracking-widest">Asset: USDT</span>
          <Wallet className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tighter">
          {formatCurrency(portfolio.usdt_balance)}
        </div>
        <div className="mt-1 text-[10px] text-green-800 uppercase italic">
          Liquid_Assets_Primary
        </div>
      </Card>
    </div>
  );
};