import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type TradeLog = Tables<"trade_logs">;

interface PriceChartProps {
  data: TradeLog[];
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as TradeLog;
  const actionColor = d.action === "BUY" ? "hsl(142 72% 50%)" : d.action === "SELL" ? "hsl(0 84% 60%)" : "hsl(38 92% 55%)";

  return (
    <div className="glass-card rounded-lg p-3 border border-[hsl(var(--glass-border))] text-xs font-mono space-y-1">
      <div className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
      <div className="text-lg font-bold text-[hsl(var(--neon-green))]">${d.price?.toLocaleString()}</div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">RSI:</span>
        <span>{d.rsi?.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Signal:</span>
        <span style={{ color: actionColor }} className="font-bold">{d.action}</span>
      </div>
    </div>
  );
}

export function PriceChart({ data }: PriceChartProps) {
  const buySignals = data.filter((d) => d.action === "BUY");
  const sellSignals = data.filter((d) => d.action === "SELL");

  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Price History</h2>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--neon-green))]" /> BUY
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--neon-red))]" /> SELL
          </span>
        </div>
      </div>
      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="created_at" tickFormatter={formatTime} tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="price" stroke="hsl(210 100% 56%)" strokeWidth={2} dot={false} />
            {buySignals.map((s, i) => (
              <ReferenceDot key={`buy-${i}`} x={s.created_at} y={s.price} r={4} fill="hsl(142 72% 50%)" stroke="none" />
            ))}
            {sellSignals.map((s, i) => (
              <ReferenceDot key={`sell-${i}`} x={s.created_at} y={s.price} r={4} fill="hsl(0 84% 60%)" stroke="none" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
