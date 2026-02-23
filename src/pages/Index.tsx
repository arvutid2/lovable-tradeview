import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Scatter, 
  ComposedChart, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

const Index = () => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ profit: 0, trades: 0, aiConfidence: 0 });

  const fetchData = async () => {
    // Tõmbame andmed Supabase-st
    const { data: logs, error } = await supabase
      .from('trade_logs')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error("Viga andmete pärimisel:", error);
      return;
    }

    if (logs && logs.length > 0) {
      setData(logs);
      
      // Arvutame statistika
      const totalProfit = logs.reduce((acc, curr) => acc + (Number(curr.pnl) || 0), 0);
      const lastAi = logs[logs.length - 1]?.ai_prediction || 0;
      const tradeCount = logs.filter(l => l.action !== 'HOLD').length;

      setStats({ 
        profit: totalProfit, 
        trades: tradeCount, 
        aiConfidence: lastAi 
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Uuenda iga 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crypto AI Dashboard</h1>
          <p className="text-slate-400">Reaalajas XGBoost ennustused ja tehingud</p>
        </header>

        {/* STATISTIKA KAARDID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Kogukasum (PnL)</p>
            <h2 className={`text-3xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.profit.toFixed(2)}%
            </h2>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">AI Confidence</p>
            <h2 className="text-3xl font-bold text-blue-400">
              {(stats.aiConfidence * 100).toFixed(1)}%
            </h2>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Tehinguid kokku</p>
            <h2 className="text-3xl font-bold text-white">{stats.trades}</h2>
          </div>
        </div>

        {/* GRAAFIK */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl mb-8">
          <h3 className="text-xl font-semibold mb-6">Hinnaliikumine & Signaalid</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="created_at" 
                  hide={true}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  orientation="right"
                  stroke="#94a3b8"
                  tick={{fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend />
                <Line 
                  name="BTC Price"
                  type="monotone" 
                  dataKey="price" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={false} 
                  activeDot={{ r: 4 }}
                />
                <Scatter name="BUY" data={data.filter(d => d.action === 'BUY')} fill="#22c55e" />
                <Scatter name="SELL" data={data.filter(d => d.action === 'SELL')} fill="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VIIMASED LOGID */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-[#0f172a] text-slate-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Aeg</th>
                <th className="px-6 py-4 font-medium">Tegevus</th>
                <th className="px-6 py-4 font-medium">Hind</th>
                <th className="px-6 py-4 font-medium">AI Ennustus</th>
                <th className="px-6 py-4 font-medium">Sisu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.slice().reverse().slice(0, 10).map((log, i) => (
                <tr key={i} className="hover:bg-[#334155]/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 
                      log.action === 'SELL' ? 'bg-red-500/20 text-red-400' : 'text-slate-500'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">${log.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-blue-400">{(log.ai_prediction * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4 text-sm text-slate-400 italic">{log.analysis_summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Index;