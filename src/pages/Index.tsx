import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Scatter } from 'recharts';
import { Settings2, Activity, BrainCircuit, History, Zap, ShieldAlert, Gauge } from "lucide-react";

const Index = () => {
  const [data, setData] = useState<any[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const saved = localStorage.getItem("trading_initial_balance");
    return saved ? parseFloat(saved) : 100;
  });
  
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

  const fetchData = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("trade_logs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (logs && logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        
        const enrichedLogs = logs.map(log => ({
          ...log,
          predicted_price: log.price ? log.price * (1 + (Number(log.ai_prediction || 0.5) - 0.5) * 0.002) : null,
          buyPoint: log.action === 'BUY' ? log.price : null,
          sellPoint: log.action === 'SELL' ? log.price : null,
        }));
        
        setData(enrichedLogs);
        
        const sellTrades = logs.filter(l => l.action === 'SELL');
        const totalPnLPercent = sellTrades.reduce((acc, curr) => acc + (Number(curr.pnl) || 0), 0);
        const pnlInCash = (initialBalance * (totalPnLPercent / 100));
        const winningTrades = sellTrades.filter(t => (Number(t.pnl) || 0) > 0).length;

        setStats({
          balance: initialBalance + pnlInCash,
          pnlAmount: pnlInCash,
          trades: sellTrades.length,
          winRate: sellTrades.length > 0 ? (winningTrades / sellTrades.length) * 100 : 0,
          lastPrice: lastLog.price || 0,
          currentAction: lastLog.action || "HOLD",
          marketPressure: lastLog.market_pressure || 0,
          isPanic: lastLog.is_panic_mode || false
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
             {/* UUS: Market Pressure näidik */}
            <div className="bg-[#0b0e11] px-4 py-2 rounded border border-gray-800 flex items-center gap-3">
              <Gauge size={16} className="text-blue-400" />
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Market Pressure</p>
                <p className="text-sm font-bold font-mono text-blue-400">{formatNum(stats.marketPressure, 3)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-[#0b0e11] px-4 py-2 rounded border border-gray-800">
              <Settings2 size={16} className="text-gray-500" />
              <input 
                type="number" 
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                className="bg-transparent border-none text-white font-bold text-sm w-16 focus:ring-0 p-0"
              />
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatBox label="Current Balance" value={`$${formatNum(stats.balance)}`} />
          <StatBox label="BTC Price" value={`$${Number(stats.lastPrice).toLocaleString()}`} />
          <StatBox label="Total Profit" value={`${stats.pnlAmount >= 0 ? '+' : ''}${formatNum(stats.pnlAmount)}`} color={stats.pnlAmount >= 0 ? "text-green-500" : "text-red-500"} />
          <StatBox label="Win Rate" value={`${formatNum(stats.winRate, 1)}%`} color="text-green-400" />
          <StatBox label="Trade Status" value={stats.currentAction} color={stats.currentAction === 'BUY' ? 'text-green-500' : stats.currentAction === 'SELL' ? 'text-red-500' : 'text-gray-400'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAIN CHART */}
          <div className="lg:col-span-9 bg-[#1e2329] p-6 rounded-lg border border-[#30363d] relative">
            {stats.isPanic && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-500/10 border border-red-500 text-red-500 px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 animate-bounce">
                <ShieldAlert size={14} /> PANIC MODE ENABLED - TRADING HALTED
              </div>
            )}
            
            <div className="h-[480px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} opacity={0.2} />
                  <XAxis dataKey="created_at" hide />
                  <YAxis domain={['auto', 'auto']} orientation="right" stroke="#474d57" fontSize={10} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #30363d' }} />
                  <Area type="monotone" dataKey="price" stroke="#f0b90b" fillOpacity={0.05} fill="#f0b90b" strokeWidth={2} name="Price" />
                  <Line type="monotone" dataKey="predicted_price" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" dot={false} name="AI Target" opacity={0.5} />
                  <Scatter dataKey="buyPoint" fill="#22c55e" name="BUY" />
                  <Scatter dataKey="sellPoint" fill="#ef4444" name="SELL" />
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
                    <p className={`text-[10px] font-bold ${log.action === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{log.action}</p>
                    <p className="text-xs font-mono">${Number(log.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</p>
                    {log.action === 'SELL' && log.pnl !== null && (
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