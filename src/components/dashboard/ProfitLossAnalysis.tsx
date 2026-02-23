import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface TradeLogData {
  id: string;
  price: number;
  rsi?: number;
  action: string;
  analysis_summary?: string;
  created_at: string;
  symbol: string;
  bot_confidence?: number;
  pnl?: number;
  market_pressure?: number;
}

interface ProfitLossAnalysisProps {
  data: TradeLogData[];
}

interface TradeAnalysis {
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  largestWin: number;
  largestLoss: number;
  bestStreak: number;
  currentStreak: number;
  isWinStreak: boolean;
}

function analyzeTrades(data: TradeLogData[]): TradeAnalysis {
  const trades = data.filter(t => t.action !== 'HOLD' && t.pnl !== null && t.pnl !== undefined);
  
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      profitableTrades: 0,
      losingTrades: 0,
      largestWin: 0,
      largestLoss: 0,
      bestStreak: 0,
      currentStreak: 0,
      isWinStreak: false,
    };
  }

  let profitableTrades = 0;
  let losingTrades = 0;
  let largestWin = -Infinity;
  let largestLoss = Infinity;
  let bestStreak = 0;
  let currentStreak = 0;
  let isWinStreak = false;
  let tempStreak = 0;
  let tempIsWin = false;

  trades.forEach((trade, idx) => {
    const pnl = trade.pnl || 0;

    if (pnl > 0) {
      profitableTrades++;
      largestWin = Math.max(largestWin, pnl);
      
      if (isWinStreak || idx === 0) {
        currentStreak++;
      } else {
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        currentStreak = 1;
      }
      tempIsWin = true;
    } else {
      losingTrades++;
      largestLoss = Math.min(largestLoss, pnl);
      
      if (!isWinStreak || idx === 0) {
        currentStreak++;
      } else {
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        currentStreak = 1;
      }
      tempIsWin = false;
    }

    isWinStreak = tempIsWin;
  });

  if (currentStreak > bestStreak) bestStreak = currentStreak;

  return {
    totalTrades: trades.length,
    profitableTrades,
    losingTrades,
    largestWin: largestWin === -Infinity ? 0 : largestWin,
    largestLoss: largestLoss === Infinity ? 0 : largestLoss,
    bestStreak,
    currentStreak,
    isWinStreak,
  };
}

export function ProfitLossAnalysis({ data }: ProfitLossAnalysisProps) {
  const analysis = analyzeTrades(data);
  const winRate = analysis.totalTrades > 0 ? (analysis.profitableTrades / analysis.totalTrades) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Win Rate */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Võit/Kaotus Suhe</p>
          <Target className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-purple-400 mb-1">{winRate.toFixed(1)}%</div>
        <div className="text-xs text-slate-500">
          {analysis.profitableTrades} võitu / {analysis.losingTrades} kaotust
        </div>
      </div>

      {/* Largest Win */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Suurim Võit</p>
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-green-400 mb-1">
          +{analysis.largestWin.toFixed(2)}%
        </div>
        <div className="text-xs text-slate-500">Parim ühepõhine tehing</div>
      </div>

      {/* Largest Loss */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Suurim Kaotus</p>
          <TrendingDown className="w-4 h-4 text-red-400" />
        </div>
        <div className="text-2xl font-bold text-red-400 mb-1">
          {analysis.largestLoss.toFixed(2)}%
        </div>
        <div className="text-xs text-slate-500">Halvim ühepõhine tehing</div>
      </div>

      {/* Best Streak */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Parim Seeria</p>
          <span className="text-orange-400">🔥</span>
        </div>
        <div className="text-2xl font-bold text-orange-400 mb-1">{analysis.bestStreak}</div>
        <div className="text-xs text-slate-500">Õnnestunud tehingute jada</div>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Praegune Seeria</p>
          <span className={analysis.isWinStreak ? 'text-green-400' : 'text-red-400'}>
            {analysis.isWinStreak ? '📈' : '📉'}
          </span>
        </div>
        <div className={`text-2xl font-bold mb-1 ${analysis.isWinStreak ? 'text-green-400' : 'text-red-400'}`}>
          {analysis.currentStreak}
        </div>
        <div className="text-xs text-slate-500">
          {analysis.isWinStreak ? 'Jätkuv võit sari' : 'Jätkuv kaotus sari'}
        </div>
      </div>

      {/* Total Trades */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tehingud Kokku</p>
          <span className="text-cyan-400">⚡</span>
        </div>
        <div className="text-2xl font-bold text-cyan-400 mb-1">{analysis.totalTrades}</div>
        <div className="text-xs text-slate-500">Kogu analüüsitud periood</div>
      </div>
    </div>
  );
}

export default ProfitLossAnalysis;
