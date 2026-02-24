import { useEffect, useState } from "react";
import { supabaseExternal as supabase } from "@/lib/supabaseExternal";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Scatter } from 'recharts';
import { Settings2, Activity, BrainCircuit, History, Zap, ShieldAlert, Gauge, RotateCcw } from "lucide-react";
import { PortfolioStats } from "@/components/dashboard/PortfolioStats";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const DEFAULT_BALANCE = 10000;

const ACTION_COLORS: Record<string, string> = {
  BUY_LONG: '#22c55e',
  CLOSE_LONG: '#ef4444',
  SELL_SHORT: '#f97316',
  CLOSE_SHORT: '#3b82f6',
  DCA_LONG: '#86efac',
  DCA_SHORT: '#fdba74',
  // Legacy fallbacks
  BUY: '#22c55e',
  SELL: '#ef4444',
};

const Index = () => {
  const [data, setData] = useState<any[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const saved = localStorage.getItem("trading_initial_balance");
    return saved ? parseFloat(saved) : DEFAULT_BALANCE;
  });

  const { portfolio } = usePortfolioData();

  const [stats, setStats] = useState({
    balance: 0,
    trades: 0,
    winRate: 0,
    lastPrice: 0,
    pnlAmount: 0,
    currentAction: "HOLD",
    marketPressure: 0,
    isPanic: false
  });

  const formatNum = (val: any, decimals: number = 2) => {
    const num = parseFloat(val);
    return isNaN(num) ? (0).toFixed(decimals) : num.toFixed(decimals);
  };

  const handleBalanceChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setInitialBalance(num);
    localStorage.setItem("trading_initial_balance", String(num));
  };

  const resetBalance = () => {
    setInitialBalance(DEFAULT_BALANCE);
    localStorage.setItem("trading_initial_balance", String(DEFAULT_BALANCE));
  };

  const fetchData = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("trade_logs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (logs && logs.length > 0) {
        const lastLog = logs[logs.length - 1];

        // Running balance calculation
        let runningBal = initialBalance;
        const enrichedLogs = logs.map(log => {
          const action = (log.action || '').toUpperCase();
          const isClose = action === 'CLOSE_LONG' || action === 'CLOSE_SHORT' || action === 'SELL';
          if (isClose && log.pnl != null) {
            runningBal += (Number(log.pnl) / 100) * runningBal;
          }

          return {
            ...log,
            buyLongPoint: (action === 'BUY_LONG' || action === 'BUY') ? log.price : null,
            closeLongPoint: action === 'CLOSE_LONG' ? log.price : null,
            sellShortPoint: (action === 'SELL_SHORT' || action === 'SELL') ? log.price : null,
            closeShortPoint: action === 'CLOSE_SHORT' ? log.price : null,
            dcaLongPoint: action === 'DCA_LONG' ? log.price : null,
            dcaShortPoint: action === 'DCA_SHORT' ? log.price : null,
            runningBalance: runningBal,
            predicted_price: log.price ? log.price * (1 + (Number(log.ai_prediction || 0.5) - 0.5) * 0.002) : null,
          };
        });

        setData(enrichedLogs);

        // Stats: count closes as trades
        const closeTrades = logs.filter(l => {
          const a = (l.action || '').toUpperCase();
          return a === 'CLOSE_LONG' || a === 'CLOSE_SHORT' || a === 'SELL';
        });
        const totalPnLPercent = closeTrades.reduce((acc, curr) => acc + (Number(curr.pnl) || 0), 0);
        const pnlInCash = (initialBalance * (totalPnLPercent / 100));
        const winningTrades = closeTrades.filter(t => (Number(t.pnl) || 0) > 0).length;

        setStats({
          balance: initialBalance + pnlInCash,
          pnlAmount: pnlInCash,
          trades: closeTrades.length,
          winRate: closeTrades.length > 0 ? (winningTrades / closeTrades.length) * 100 : 0,
          lastPrice: lastLog.price || 0,
          currentAction: lastLog.action || "HOLD",
          marketPressure: (lastLog as any).market_pressure || 0,
          isPanic: (lastLog as any).is_panic_mode || false
        });
      }
    } catch (error: any) {
      console.error("Viga andmete laadimisel:", error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [initialBalance]);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* PORTFOLIO STATS */}
        <PortfolioStats portfolio={portfolio ? { usdt_balance: portfolio.usdt_balance ?? 0, btc_balance: portfolio.btc_balance ?? 0, total_value_usdt: portfolio.total_value_usdt } : null} initialBalance={initialBalance} />

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-[#1e2329] p-4 rounded-lg border border-[#30363d]">
          <div className="flex items-center gap-4">
            <div className="bg-[#f0b90b] p-2 rounded-lg shadow-[0_0_15px_rgba(240,185,11,0.3)]">
              <Zap size={24} className="text-black fill-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-tighter italic">XGBoost Pro Terminal</h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <span className={`h-2 w-2 rounded-full animate-pulse ${stats.isPanic ? 'bg-red-500' : 'bg-green-500'}`}></span>
                {stats.isPanic ? 'PANIC MODE ACTIVE' : 'SYSTEM NOMINAL'} • ENGINE: V2.5
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center mt-4 md:mt-0">
            {/* Market Pressure */}
            <div className="bg-[#0b0e11] px-4 py-2 rounded border border-gray-800 flex items-center gap-3">
              <Gauge size={16} className="text-blue-400" />
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Market Pressure</p>
                <p className="text-sm font-bold font-mono text-blue-400">{formatNum(stats.marketPressure, 3)}</p>
              </div>
            </div>

            {/* Starting Balance Input */}
            <div className="bg-[#0b0e11] px-4 py-2 rounded border border-gray-800 flex items-center gap-3">
              <Settings2 size={16} className="text-gray-500" />
              <div>
                <p className="text-[9px] text-gray-500 uppercase mb-1">Starting Balance</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => handleBalanceChange(e.target.value)}
                    className="bg-transparent border-none text-white font-bold text-sm w-24 focus:ring-0 p-0 font-mono"
                  />
                  <span className="text-[10px] text-gray-500">USDT</span>
                </div>
              </div>
              <button
                onClick={resetBalance}
                className="text-gray-500 hover:text-white transition-colors p-1"
                title="Reset to 10,000"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatBox label="Current Balance" value={`$${formatNum(stats.balance)}`} />
          <StatBox label="BTC Price" value={`$${Number(stats.lastPrice).toLocaleString()}`} />
          <StatBox label="Total Profit" value={`${stats.pnlAmount >= 0 ? '+' : ''}${formatNum(stats.pnlAmount)}`} color={stats.pnlAmount >= 0 ? "text-green-500" : "text-red-500"} />
          <StatBox label="Win Rate" value={`${formatNum(stats.winRate, 1)}%`} color="text-green-400" />
          <StatBox label="Trade Status" value={stats.currentAction} color={stats.currentAction.includes('BUY') || stats.currentAction.includes('LONG') ? 'text-green-500' : stats.currentAction.includes('SELL') || stats.currentAction.includes('SHORT') ? 'text-red-500' : 'text-gray-400'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAIN CHART */}
          <div className="lg:col-span-9 bg-[#1e2329] p-6 rounded-lg border border-[#30363d] relative">
            {stats.isPanic && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-500/10 border border-red-500 text-red-500 px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 animate-bounce">
                <ShieldAlert size={14} /> PANIC MODE ENABLED - TRADING HALTED
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-2 text-[9px] font-mono">
              {Object.entries(ACTION_COLORS).filter(([k]) => !['BUY','SELL'].includes(k)).map(([action, color]) => (
                <span key={action} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {action}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                EQUITY
              </span>
            </div>

            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} opacity={0.2} />
                  <XAxis dataKey="created_at" hide />
                  <YAxis yAxisId="price" domain={['auto', 'auto']} orientation="left" stroke="#474d57" fontSize={10} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="equity" domain={['auto', 'auto']} orientation="right" stroke="#a78bfa" fontSize={10} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #30363d', fontSize: 11 }} />

                  {/* Price area */}
                  <Area yAxisId="price" type="monotone" dataKey="price" stroke="#f0b90b" fillOpacity={0.05} fill="#f0b90b" strokeWidth={2} name="Price" />
                  <Line yAxisId="price" type="monotone" dataKey="predicted_price" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" dot={false} name="AI Target" opacity={0.5} />

                  {/* Equity curve */}
                  <Line yAxisId="equity" type="monotone" dataKey="runningBalance" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Equity" />

                  {/* Bot action markers */}
                  <Scatter yAxisId="price" dataKey="buyLongPoint" fill={ACTION_COLORS.BUY_LONG} name="BUY_LONG" shape="triangle" />
                  <Scatter yAxisId="price" dataKey="closeLongPoint" fill={ACTION_COLORS.CLOSE_LONG} name="CLOSE_LONG" shape="diamond" />
                  <Scatter yAxisId="price" dataKey="sellShortPoint" fill={ACTION_COLORS.SELL_SHORT} name="SELL_SHORT" shape="triangle" />
                  <Scatter yAxisId="price" dataKey="closeShortPoint" fill={ACTION_COLORS.CLOSE_SHORT} name="CLOSE_SHORT" shape="diamond" />
                  <Scatter yAxisId="price" dataKey="dcaLongPoint" fill={ACTION_COLORS.DCA_LONG} name="DCA_LONG" shape="cross" />
                  <Scatter yAxisId="price" dataKey="dcaShortPoint" fill={ACTION_COLORS.DCA_SHORT} name="DCA_SHORT" shape="cross" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HISTORY */}
          <div className="lg:col-span-3 bg-[#1e2329] rounded-lg border border-[#30363d] flex flex-col h-[550px]">
            <div className="p-4 border-b border-[#30363d] bg-[#2b3139]/30 flex items-center gap-2">
              <History size={16} className="text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Execution Log</span>
            </div>
            <div className="overflow-y-auto flex-grow">
              {data.slice().reverse().filter(l => l.action !== 'HOLD').map((log) => (
                <div key={log.id} className="p-3 border-b border-[#2b3139] flex justify-between items-center hover:bg-[#2b3139] transition-colors">
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: ACTION_COLORS[(log.action || '').toUpperCase()] || '#9ca3af' }}>{log.action}</p>
                    <p className="text-xs font-mono">${Number(log.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</p>
                    {log.pnl != null && (
                      <p className={`text-xs font-bold ${Number(log.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Number(log.pnl) >= 0 ? '+' : ''}{formatNum(log.pnl)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color = "text-white" }: any) => (
  <div className="bg-[#1e2329] p-4 rounded border border-[#30363d] shadow-sm">
    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-wider">{label}</p>
    <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
  </div>
);

export default Index;
