import { Card } from "@/components/ui/card";
import { TrendingUp, Wallet, ArrowUpRight } from "lucide-react";

interface HeroStatsProps {
  portfolio: {
    total_value_usdt: number;
    btc_balance?: number;
    usdt_balance?: number;
  } | null;
  latestPrice?: number | null;
}

export const HeroStats = ({ portfolio, latestPrice }: HeroStatsProps) => {
  const formatUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const btcDisplay = portfolio?.btc_balance !== undefined
    ? (portfolio.btc_balance).toFixed(4)
    : latestPrice && portfolio?.total_value_usdt
    ? (portfolio.total_value_usdt / latestPrice).toFixed(4)
    : "0.0000";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-black/60 border-green-900/40 p-5 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-green-700 font-mono tracking-widest uppercase">Net Asset Value</p>
            <h2 className="text-3xl font-bold text-green-500 font-mono mt-1">
              {formatUSD(portfolio?.total_value_usdt || 0)}
            </h2>
          </div>
          <TrendingUp className="text-green-500 w-5 h-5 opacity-50" />
        </div>
      </Card>

      <Card className="bg-black/60 border-green-900/40 p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-green-700 font-mono tracking-widest uppercase">BTC Holdings</p>
            <h2 className="text-2xl font-bold text-white font-mono mt-1">
              {btcDisplay} <span className="text-xs text-green-900">BTC</span>
            </h2>
          </div>
          <ArrowUpRight className="text-green-700 w-5 h-5" />
        </div>
      </Card>

      <Card className="bg-black/60 border-green-900/40 p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-green-700 font-mono tracking-widest uppercase">Available USDT</p>
            <h2 className="text-2xl font-bold text-white font-mono mt-1">
              {formatUSD(portfolio?.usdt_balance ?? portfolio?.total_value_usdt ?? 0)}
            </h2>
          </div>
          <Wallet className="text-green-700 w-5 h-5" />
        </div>
      </Card>
    </div>
  );
};