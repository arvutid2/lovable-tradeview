import type { Tables } from "@/integrations/supabase/types";

type TradeLog = Tables<"trade_logs">;

interface HeroStatsProps {
  latest: TradeLog | null;
  loading: boolean;
}

function getActionColor(action: string) {
  switch (action?.toUpperCase()) {
    case "BUY": return { text: "text-[hsl(var(--neon-green))]", glow: "animate-pulse-green", bg: "bg-[hsl(var(--neon-green))]" };
    case "SELL": return { text: "text-[hsl(var(--neon-red))]", glow: "animate-pulse-red", bg: "bg-[hsl(var(--neon-red))]" };
    default: return { text: "text-[hsl(var(--neon-amber))]", glow: "animate-pulse-amber", bg: "bg-[hsl(var(--neon-amber))]" };
  }
}

function RSIGauge({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const rotation = (clamped / 100) * 180 - 90;
  const color = clamped > 70 ? "hsl(0 84% 60%)" : clamped < 30 ? "hsl(142 72% 50%)" : "hsl(210 100% 56%)";

  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(220 16% 16%)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * 157} 157`} className="drop-shadow-lg" />
        <line x1="60" y1="55" x2="60" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${rotation} 60 55)`} className="drop-shadow-lg" />
        <circle cx="60" cy="55" r="4" fill={color} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="font-mono text-lg font-bold" style={{ color }}>{clamped.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function HeroStats({ latest, loading }: HeroStatsProps) {
  const actionStyle = getActionColor(latest?.action || "HOLD");

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* BTC Price */}
      <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center gap-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {latest?.symbol || "BTC/USDT"} Price
        </span>
        <span className="text-4xl md:text-5xl font-bold font-mono text-[hsl(var(--neon-green))] tabular-nums">
          ${latest?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {latest?.created_at ? new Date(latest.created_at).toLocaleTimeString() : "—"}
        </span>
      </div>

      {/* RSI Gauge */}
      <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center gap-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">RSI Value</span>
        <RSIGauge value={latest?.rsi || 50} />
        <span className="text-xs text-muted-foreground font-mono">
          {(latest?.rsi || 0) > 70 ? "OVERBOUGHT" : (latest?.rsi || 0) < 30 ? "OVERSOLD" : "NEUTRAL"}
        </span>
      </div>

      {/* Signal Badge */}
      <div className={`glass-card rounded-xl p-6 flex flex-col items-center justify-center gap-3 ${actionStyle.glow}`}>
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Current Signal</span>
        <span className={`text-5xl font-black font-mono ${actionStyle.text}`}>
          {latest?.action?.toUpperCase() || "—"}
        </span>
        <div className={`h-1 w-16 rounded-full ${actionStyle.bg} opacity-60`} />
      </div>
    </div>
  );
}
