import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type TradeLog = Tables<"trade_logs">;

interface SignalsLogProps {
  trades: TradeLog[];
}

function ActionBadge({ action }: { action: string }) {
  const upper = action?.toUpperCase();
  const variant = upper === "BUY"
    ? "bg-[hsl(142_72%_50%/0.15)] text-[hsl(var(--neon-green))] border-[hsl(142_72%_50%/0.3)]"
    : upper === "SELL"
    ? "bg-[hsl(0_84%_60%/0.15)] text-[hsl(var(--neon-red))] border-[hsl(0_84%_60%/0.3)]"
    : "bg-[hsl(38_92%_55%/0.15)] text-[hsl(var(--neon-amber))] border-[hsl(38_92%_55%/0.3)]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono font-semibold ${variant}`}>
      {upper}
    </span>
  );
}

export function SignalsLog({ trades }: SignalsLogProps) {
  const recent = trades.slice(0, 20);

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col h-full">
      <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Signals Log</h2>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 px-1">Time</th>
              <th className="text-right py-2 px-1">Price</th>
              <th className="text-center py-2 px-1">Signal</th>
              <th className="text-left py-2 px-1 hidden md:table-cell">Symbol</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  Waiting for signals...
                </td>
              </tr>
            ) : (
              recent.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-1 text-muted-foreground">
                    {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="py-2 px-1 text-right tabular-nums text-foreground">
                    ${t.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-1 text-center">
                    <ActionBadge action={t.action} />
                  </td>
                  <td className="py-2 px-1 text-muted-foreground hidden md:table-cell">{t.symbol}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
