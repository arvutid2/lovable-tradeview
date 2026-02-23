import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { toast } from "sonner";
import { Wallet, Settings2, TrendingUp, Activity, Check, RefreshCw } from "lucide-react";
import { SimpleBotControl } from "@/components/dashboard/SimpleBotControl";

const Index = () => {
  const [data, setData] = useState<any[]>([]);
  // Laeme algsaldo brauseri mälust või kasutame vaikimisi 100
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const saved = localStorage.getItem("trading_initial_balance");
    return saved ? parseFloat(saved) : 100;
  });
  
  const [tempBalance, setTempBalance] = useState<string>(initialBalance.toString());
  const [isBalanceConfirmed, setIsBalanceConfirmed] = useState(true);
  
  const [stats, setStats] = useState({
    balance: 0,
    trades: 0,
    winRate: 0,
    lastPrice: 0,
    pnlAmount: 0
  });

  // Salvestame uue algsaldo brauseri mällu
  const handleBalanceChange = (value: string) => {
    setTempBalance(value);
    setIsBalanceConfirmed(false); // Mark as not confirmed
  };

  // Set/confirm new balance
  const handleSetBalance = () => {
    const num = parseFloat(tempBalance) || 0;
    if (num <= 0) {
      alert("❌ Balance peab olema suurem kui 0!");
      return;
    }
    setInitialBalance(num);
    localStorage.setItem("trading_initial_balance", num.toString());
    setIsBalanceConfirmed(true);
    toast.success(`✅ Algsaldo seatud: $${num.toFixed(2)}`);
  };

  // Reset all trades (start fresh)
  const handleResetTrades = async () => {
    if (confirm("🔄 Kas oled kindel? See kustutab KÕIK tehingud!")) {
      try {
        const { error } = await supabase
          .from("trade_logs")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
        
        if (error) throw error;
        setData([]);
        toast.success("✅ Kõik tehingud kustutatud!");
      } catch (error: any) {
        toast.error("❌ Viga: " + error.message);
      }
    }
  };

  const fetchData = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("trade_logs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (logs && logs.length > 0) {
        setData(logs);
        
        // Arvutame balansi õigesti: iga %pnl = (1 + pnl/100)
        let currentBalance = initialBalance;
        const sellTrades = logs.filter(l => l.action === 'SELL');
        
        sellTrades.forEach(trade => {
          if (trade.pnl) {
            currentBalance = currentBalance * (1 + (trade.pnl / 100));
          }
        });
        
        const pnlAmount = currentBalance - initialBalance;
        
        // Statistika
        const actualTrades = logs.filter(l => l.action === 'BUY' || l.action === 'SELL');
        const wins = actualTrades.filter(t => t.pnl && t.pnl > 0).length;
        
        setStats({
          balance: currentBalance,
          pnlAmount: pnlAmount,
          trades: actualTrades.length,
          winRate: actualTrades.length > 0 ? (wins / Math.max(actualTrades.length / 2, 1)) * 100 : 0,
          lastPrice: logs[logs.length - 1].price || 0
        });
      }
    } catch (error: any) {
      console.error("Viga:", error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [initialBalance]); // Uuenda, kui algsaldo muutub

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* HEADER & WALLET SETTINGS */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#f0b90b] flex items-center gap-2">
              <Activity className="text-[#f0b90b]" /> AI TradeView Pro
            </h1>
            <p className="text-gray-400 font-mono text-sm">Monorepo Engine V2.2 • Connected to Supabase</p>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex flex-wrap gap-4 items-center bg-[#1e2329] p-4 rounded-xl border border-[#30363d]">
              <div className="flex items-center gap-3 pr-4 border-r border-[#30363d]">
                <Settings2 size={18} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Initial Wallet</p>
                  <input 
                    type="number" 
                    value={tempBalance}
                    onChange={(e) => handleBalanceChange(e.target.value)}
                    className={`bg-transparent border-none text-white font-bold text-lg focus:ring-0 w-24 p-0 ${!isBalanceConfirmed ? 'text-yellow-400' : 'text-green-400'}`}
                  />
                </div>
              </div>
              <div className="pl-2">
                <p className="text-[10px] text-gray-400 uppercase">Current Portfolio</p>
                <p className={`text-xl font-bold ${stats.pnlAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.balance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSetBalance}
                disabled={isBalanceConfirmed}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold transition-all ${
                  isBalanceConfirmed
                    ? 'bg-green-500/20 text-green-400 cursor-default'
                    : 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                }`}
              >
                <Check size={14} />
                {isBalanceConfirmed ? 'Kinnitatud' : 'Määra'}
              </button>
              
              <button
                onClick={handleResetTrades}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
              >
                <RefreshCw size={14} />
                Reset
              </button>
            </div>
          </div>
        </header>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1e2329] p-4 rounded border border-[#30363d]">
            <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><Wallet size={12}/> Net Profit</p>
            <p className={`text-xl font-bold ${stats.pnlAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.pnlAmount >= 0 ? '+' : ''}{stats.pnlAmount.toFixed(2)} USDT
            </p>
          </div>
          <div className="bg-[#1e2329] p-4 rounded border border-[#30363d]">
            <p className="text-[10px] text-gray-400 uppercase">BTC Current</p>
            <p className="text-xl font-bold">${stats.lastPrice.toLocaleString()}</p>
          </div>
          <div className="bg-[#1e2329] p-4 rounded border border-[#30363d]">
            <p className="text-[10px] text-gray-400 uppercase">Trade Cycles</p>
            <p className="text-xl font-bold">{Math.floor(stats.trades / 2)}</p>
          </div>
          <div className="bg-[#1e2329] p-4 rounded border border-[#30363d]">
            <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><TrendingUp size={12}/> Win Rate</p>
            <p className="text-xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* BOT CONTROL PANEL */}
        <div className="mb-6">
          <SimpleBotControl />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-[#1e2329] p-6 rounded-lg border border-[#30363d]">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} stroke="#474d57" fontSize={10}/>
                  <YAxis yAxisId="left" orientation="left" stroke="#474d57" fontSize={10}/>
                  <YAxis yAxisId="right" domain={[0, 1]} orientation="right" stroke="#3b82f6" fontSize={10}/>
                  <Tooltip contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #30363d' }} />
                  <Area yAxisId="left" type="monotone" dataKey="price" stroke="#f0b90b" fillOpacity={0.1} fill="#f0b90b" strokeWidth={2} dot={false}/>
                  <Line yAxisId="right" type="monotone" dataKey="ai_prediction" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-lg border border-[#30363d] flex flex-col h-[525px]">
            <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
              <h3 className="font-bold text-sm">Live Feed</h3>
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="flex-grow overflow-y-auto">
              {data.slice().reverse().map((log) => (
                <div key={log.id} className="p-3 border-b border-[#2b3139] hover:bg-[#2b3139]">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[9px] font-bold px-1 rounded ${log.action === 'BUY' ? 'bg-green-500/20 text-green-500' : log.action === 'SELL' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}`}>
                      {log.action}
                    </span>
                    <span className="text-[9px] text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-mono">${log.price ? log.price.toLocaleString() : '0'}</span>
                    {log.pnl && log.pnl !== 0 && <span className={`text-xs ${log.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>{log.pnl.toFixed(2)}%</span>}
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

export default Index;