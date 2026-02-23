import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Zap, Activity, AlertCircle } from 'lucide-react';

interface BotStatus {
  running: boolean;
  started_at?: string;
  last_trade?: any;
  total_trades: number;
  error?: string;
}

interface BacktestResult {
  status?: string;
  error?: string;
  total_trades?: number;
  winning_trades?: number;
  losing_trades?: number;
  win_rate?: number;
  total_pnl?: number;
  avg_pnl_per_trade?: number;
  price_start?: number;
  price_end?: number;
  price_change_percent?: number;
  output?: string;
}

const API_URL = 'http://localhost:3001';

export function BotControl() {
  const [status, setStatus] = useState<BotStatus>({
    running: false,
    total_trades: 0,
  });
  const [loading, setLoading] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');

  // Polling boti staatus
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bot/status`, {
          signal: AbortSignal.timeout(5000), // 5 sekundi timeout
        });
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          setConnectionError('');
        } else {
          setConnectionError('API server pole jooksul');
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setConnectionError('Ühenduse viga API serveriga');
          console.error('Status fetch error:', error);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Uuenda 5 sekundiga
    return () => clearInterval(interval);
  }, []);

  const startBot = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bot/start`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({ ...prev, running: true, started_at: data.started_at }));
      } else {
        const error = await response.json();
        alert(`Viga: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Ühenduse viga: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stopBot = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bot/stop`, {
        method: 'POST',
      });
      if (response.ok) {
        setStatus(prev => ({ ...prev, running: false }));
      } else {
        const error = await response.json();
        alert(`Viga: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Ühenduse viga: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async () => {
    setBacktestLoading(true);
    setBacktestResult(null);
    try {
      const response = await fetch(`${API_URL}/api/bot/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 500 }),
      });
      if (response.ok) {
        const data = await response.json();
        setBacktestResult(data);
      } else {
        const error = await response.json();
        setBacktestResult({ error: error.error });
      }
    } catch (error: any) {
      setBacktestResult({ error: `Ühenduse viga: ${error.message}` });
    } finally {
      setBacktestLoading(false);
    }
  };

  const trainBrain = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bot/brain/train`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.output || 'Mudel treenitud edukalt!');
      } else {
        const error = await response.json();
        alert(`Viga: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Ühenduse viga: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          Boti Juhtimine
        </h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          status.running 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${status.running ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {status.running ? 'Jookseb' : 'Seisab'}
        </div>
      </div>

      {/* API Ühenduse kontroll */}
      {connectionError && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-orange-400 text-sm mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {connectionError}
          <br />
          <span className="text-xs mt-1">💡 Käivita API: <code className="bg-black/30 px-2 py-1 rounded">python api.py</code></span>
        </div>
      )}

      {/* Staatus info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Käivitatud</p>
          <p className="text-sm font-mono">
            {status.started_at 
              ? new Date(status.started_at).toLocaleString('et-EE')
              : 'Pole käivitatud'
            }
          </p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Tehinguid kokku</p>
          <p className="text-2xl font-bold text-cyan-400">{status.total_trades}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Viimane tehing</p>
          <p className="text-sm">
            {status.last_trade
              ? new Date(status.last_trade.created_at).toLocaleTimeString('et-EE')
              : 'Pole veel'
            }
          </p>
        </div>
      </div>

      {/* Control nupud */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={startBot}
          disabled={status.running || loading}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
        >
          <Play className="w-4 h-4" />
          Käivita
        </button>
        
        <button
          onClick={stopBot}
          disabled={!status.running || loading}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
        >
          <Square className="w-4 h-4" />
          Peata
        </button>

        <button
          onClick={trainBrain}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
        >
          <Activity className="w-4 h-4" />
          Treeni Mudel
        </button>

        <button
          onClick={runBacktest}
          disabled={backtestLoading}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          {backtestLoading ? 'Testib...' : 'Backtest'}
        </button>
      </div>

      {/* Backtest tulemused */}
      {backtestResult && (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mt-4">
          <p className="text-sm text-blue-400 font-semibold mb-3">📊 Backtest Tulemused:</p>
          
          {backtestResult.error ? (
            <div className="text-red-400 text-sm">
              ❌ Viga: {backtestResult.error}
            </div>
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
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 text-xs">Total P&L</p>
                <p className={`font-bold ${(backtestResult.total_pnl || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {((backtestResult.total_pnl || 0) > 0 ? '+' : '')}{(backtestResult.total_pnl || 0).toFixed(2)}%
                </p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 text-xs">Keskmine P&L</p>
                <p className={`font-bold ${(backtestResult.avg_pnl_per_trade || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {((backtestResult.avg_pnl_per_trade || 0) > 0 ? '+' : '')}{(backtestResult.avg_pnl_per_trade || 0).toFixed(2)}%
                </p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 text-xs">Hinna muutus</p>
                <p className={`font-bold ${(backtestResult.price_change_percent || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {((backtestResult.price_change_percent || 0) > 0 ? '+' : '')}{(backtestResult.price_change_percent || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {status.error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-400 text-sm mt-4">
          ⚠️ Viga: {status.error}
        </div>
      )}
    </div>
  );
}

export default BotControl;
