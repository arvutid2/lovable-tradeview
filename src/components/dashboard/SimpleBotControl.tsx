import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Zap, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BotStatus {
  running: boolean;
  lastTradeTime?: string;
  lastTradeAction?: string;
  lastTradePrice?: number;
  lastTradePnl?: number;
  totalTrades: number;
  lastUpdate: string;
}

export function SimpleBotControl() {
  const [status, setStatus] = useState<BotStatus>({
    running: false,
    totalTrades: 0,
    lastUpdate: 'Pole andmeid',
  });
  const [loading, setLoading] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  // Kontrolli bot staatus - AINULT Supabase'ist (ei API-d!)
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const { data: logs, error } = await supabase
          .from('trade_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const { data: allTrades } = await supabase
          .from('trade_logs')
          .select('*');

        if (logs && logs.length > 0) {
          const lastTrade = logs[0];
          const timeSinceLastTrade = Date.now() - new Date(lastTrade.created_at).getTime();
          const isActive = timeSinceLastTrade < 180000; // 3 min - bot on aktiivne

          setStatus({
            running: isActive,
            lastTradeTime: new Date(lastTrade.created_at).toLocaleTimeString('et-EE'),
            lastTradeAction: lastTrade.action,
            lastTradePrice: lastTrade.price,
            lastTradePnl: lastTrade.pnl,
            totalTrades: allTrades?.length || 0,
            lastUpdate: new Date().toLocaleTimeString('et-EE'),
          });

          setRecentTrades(logs.slice(0, 5));
        }
      } catch (error) {
        console.error('Supabase fetch error:', error);
      }
    };

    checkBotStatus();
    const interval = setInterval(checkBotStatus, 2000); // Kontrolli iga 2 sek
    return () => clearInterval(interval);
  }, []);

  const handleStartBot = () => {
    setLoading(true);
    const command = 'cd /workspaces/lovable-tradeview && python bot/bot.py';
    alert(`💡 Bot käivitamine:\n\nTerminalis käivita:\n\n${command}`);
    // Copy to clipboard
    navigator.clipboard.writeText(command);
    setLoading(false);
  };

  const handleStopBot = () => {
    alert('⏹️ Bot peatamine:\n\nTerminalis vajuta: Ctrl+C');
  };

  const handleBacktest = async () => {
    setBacktestLoading(true);
    const command = 'cd /workspaces/lovable-tradeview/bot && python backtester.py';
    alert(`💡 Backtest käivitamine:\n\nTerminalis käivita:\n\n${command}`);
    navigator.clipboard.writeText(command);
    setBacktestLoading(false);
  };

  const handleTrainModel = () => {
    setLoading(true);
    const command = 'cd /workspaces/lovable-tradeview/bot && python brain.py';
    alert(`💡 Model training:\n\nTerminalis käivita:\n\n${command}`);
    navigator.clipboard.writeText(command);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          🤖 Boti Juhtimine
        </h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          status.running 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${status.running ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          {status.running ? '🟢 Aktiivne' : '⚪ Seisab'}
        </div>
      </div>

      {/* Info alert */}
      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-blue-300 text-sm mb-4 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        <span>
          ✅ <strong>Supabase ühendus aktiivne!</strong> Bot andmed värskendatakse reaalajas.
        </span>
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Viimane tehing</p>
          <p className="text-sm font-mono">
            {status.lastTradeTime || 'Pole andmeid'}
          </p>
          {status.lastTradeAction && (
            <p className="text-xs text-slate-400 mt-1">
              {status.lastTradeAction} @ {status.lastTradePrice?.toFixed(0)} USDT
            </p>
          )}
        </div>
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Tehinguid kokku</p>
          <p className="text-2xl font-bold text-cyan-400">{status.totalTrades}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Viimase tehingu P&L</p>
          <p className={`text-lg font-bold ${status.lastTradePnl && status.lastTradePnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {status.lastTradePnl ? (status.lastTradePnl > 0 ? '+' : '') + status.lastTradePnl.toFixed(2) + '%' : 'N/A'}
          </p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Viimati uuendatud</p>
          <p className="text-sm font-mono">{status.lastUpdate}</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleStartBot}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
        >
          <Play className="w-4 h-4" />
          Käivita
        </button>
        
        <button
          onClick={handleStopBot}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
        >
          <Square className="w-4 h-4" />
          Peata
        </button>

        <button
          onClick={handleTrainModel}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Treeni
        </button>

        <button
          onClick={handleBacktest}
          disabled={backtestLoading}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          {backtestLoading ? 'Testib...' : 'Backtest'}
        </button>
      </div>

      {/* Recent Trades Live Feed */}
      {recentTrades.length > 0 && (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6">
          <p className="text-sm text-cyan-400 font-semibold mb-3">📊 Viimased tehingud (reaalajas):</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentTrades.map((trade, idx) => (
              <div key={idx} className="bg-slate-800 p-2 rounded text-xs flex justify-between items-center">
                <div>
                  <span className={`font-semibold ${trade.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.action}
                  </span>
                  <span className="text-slate-400"> @ {trade.price?.toFixed(0)} USDT</span>
                </div>
                <span className={`font-bold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnl > 0 ? '+' : ''}{trade.pnl?.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backtest Results */}
      {backtestResult && (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mt-4">
          <p className="text-sm text-blue-400 font-semibold mb-3">📊 Backtest Tulemused:</p>
          {backtestResult.error ? (
            <div className="text-red-400 text-sm">❌ {backtestResult.error}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 text-xs">Tehingud</p>
                <p className="text-cyan-400 font-bold">{backtestResult.total_trades}</p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 text-xs">Võidud / Kaotused</p>
                <p className="text-green-400 font-bold">
                  {backtestResult.winning_trades} / <span className="text-red-400">{backtestResult.losing_trades}</span>
                </p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 text-xs">Win Rate</p>
                <p className={`font-bold ${(backtestResult.win_rate || 0) > 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {(backtestResult.win_rate || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
