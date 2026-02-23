import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import type { PortfolioRow } from "@/hooks/usePortfolioData";

interface PortfolioStatsProps {
  latest: PortfolioRow | null;
  history: PortfolioRow[];
  pnl: number;
  pnlPercent: number;
  loading: boolean;
}

function MiniEquityChart({ data }: { data: PortfolioRow[] }) {
  if (data.length < 2) return <div className="text-xs text-muted-foreground font-mono">Waiting for data…</div>;

  const first = data[0].total_value_usdt;
  const last = data[data.length - 1].total_value_usdt;
  const color = last >= first ? "hsl(142 72% 50%)" : "hsl(0 84% 60%)";

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data}>
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as PortfolioRow;
            return (
              <div className="glass-card rounded p-2 text-xs font-mono border border-[hsl(var(--glass-border))]">
                <div className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
                <div className="font-bold" style={{ color }}>${d.total_value_usdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            );
          }}
        />
        <Line type="monotone" dataKey="total_value_usdt" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PortfolioStats({ latest, history, pnl, pnlPercent, loading }: PortfolioStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const isProfit = pnl >= 0;
  const pnlColor = isProfit ? "text-[hsl(var(--neon-green))]" : "text-[hsl(var(--neon-red))]";
  const pnlSign = isProfit ? "+" : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Balance */}
      <div className="glass-card rounded-xl p-5 flex flex-col justify-center gap-1">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Total Balance</span>
        <span className="text-2xl font-bold font-mono text-[hsl(var(--neon-green))] tabular-nums">
          ${latest?.total_value_usdt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"}
        </span>
        <span className="text-xs text-muted-foreground font-mono">USDT</span>
      </div>

      {/* Profit/Loss */}
      <div className="glass-card rounded-xl p-5 flex flex-col justify-center gap-1">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Profit / Loss</span>
        <span className={`text-2xl font-bold font-mono tabular-nums ${pnlColor}`}>
          {pnlSign}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-xs font-mono ${pnlColor}`}>
          {pnlSign}{pnlPercent.toFixed(2)}% from $10,000
        </span>
      </div>

      {/* Assets */}
      <div className="glass-card rounded-xl p-5 flex flex-col justify-center gap-1">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Assets</span>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground font-mono">BTC</span>
            <span className="text-lg font-bold font-mono text-[hsl(var(--neon-amber))] tabular-nums">
              {latest?.btc_balance?.toFixed(6) ?? "0.000000"}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground font-mono">USDT</span>
            <span className="text-lg font-bold font-mono text-foreground tabular-nums">
              {latest?.usdt_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Equity Chart */}
      <div className="glass-card rounded-xl p-5 flex flex-col justify-center gap-1">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Equity Curve</span>
        <MiniEquityChart data={history} />
      </div>
    </div>
  );
}
