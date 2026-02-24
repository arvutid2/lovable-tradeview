import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import type { Tables } from '@/integrations/supabase/types';

type TradeLog = Tables<'trade_logs'>;

interface AdvancedChartProps {
  data: TradeLog[];
  showPnL?: boolean;
}

interface ChartDataPoint extends TradeLog {
  cumulativePnL?: number;
  rsi_MA?: number;
  pnl?: number | null;
  bot_confidence?: number | null;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });
}

function calculateCumulativePnL(data: TradeLog[]): ChartDataPoint[] {
  let cumulative = 0;
  return data.map(item => ({
    ...item,
    cumulativePnL: (cumulative += (item as any).pnl || 0),
  }));
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload as ChartDataPoint;
  
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2 shadow-lg">
      <div className="text-slate-300 text-xs">
        {new Date(data.created_at).toLocaleString('et-EE')}
      </div>
      <div className="font-mono text-cyan-400 font-semibold">
        Hind: ${data.price?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </div>
      
      {data.action && data.action !== 'HOLD' && (
        <div className={`text-xs font-bold ${
          data.action === 'BUY' ? 'text-green-400' : 'text-red-400'
        }`}>
          {data.action === 'BUY' ? '↑ OST' : '↓ MÜÜK'}
        </div>
      )}
      
      {data.rsi && (
        <div className="text-xs text-slate-400">
          RSI: {data.rsi.toFixed(1)}
        </div>
      )}
      
      {data.pnl !== null && data.pnl !== undefined && (
        <div className={`text-xs font-semibold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          P&L: {data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(2)}%
        </div>
      )}
      
      {data.bot_confidence && (
        <div className="text-xs text-blue-400">
          Enesekindlus: {(data.bot_confidence * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}

export function AdvancedChart({ data, showPnL = false }: AdvancedChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-slate-400">
        Graafiku andmeid pole saadaval
      </div>
    );
  }

  const chartData = showPnL ? calculateCumulativePnL(data) : data;
  const buySignals = data.filter(d => d.action === 'BUY');
  const sellSignals = data.filter(d => d.action === 'SELL');

  // Calculate min/max for reasonable scales
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.05;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 10, bottom: 70 }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
        
        <XAxis
          dataKey="created_at"
          tickFormatter={formatTime}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#475569' }}
          angle={-45}
          textAnchor="end"
          height={70}
        />
        
        <YAxis
          yAxisId="left"
          domain={[
            Math.max(minPrice - padding, 0),
            maxPrice + padding
          ]}
          stroke="#94a3b8"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#475569' }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={60}
        />
        
        {showPnL && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#94a3b8"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#475569' }}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
          />
        )}

        <Tooltip content={<CustomTooltip />} />
        
        <Legend
          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
          iconType="circle"
        />

        {/* Price Line */}
        <Line
          yAxisId="left"
          name="Hind"
          type="monotone"
          dataKey="price"
          stroke="#06b6d4"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />

        {/* Profit/Loss Area */}
        {showPnL && (
          <Area
            yAxisId="right"
            name="Kumulatiivne P&L"
            type="monotone"
            dataKey="cumulativePnL"
            fill="url(#pnlGradient)"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
        )}

        {/* Buy Signals */}
        {buySignals.map((signal, idx) => (
          <ReferenceDot
            key={`buy-${idx}`}
            x={signal.created_at}
            y={signal.price}
            yAxisId="left"
            r={7}
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth={2}
          />
        ))}

        {/* Sell Signals */}
        {sellSignals.map((signal, idx) => (
          <ReferenceDot
            key={`sell-${idx}`}
            x={signal.created_at}
            y={signal.price}
            yAxisId="left"
            r={7}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={2}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default AdvancedChart;
