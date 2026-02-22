import type { Tables } from "@/integrations/supabase/types";

type TradeLog = Tables<"trade_logs">;

interface AIInsightFeedProps {
  latest: TradeLog | null;
  trades: TradeLog[];
}

export function AIInsightFeed({ latest, trades }: AIInsightFeedProps) {
  const recentWithSummary = trades.filter((t) => t.analysis_summary).slice(0, 5);

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col h-full">
      <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
        <span className="text-[hsl(var(--neon-green))]">◉</span> AI Insight Feed
      </h2>

      {/* Latest analysis */}
      {latest?.analysis_summary ? (
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="text-xs text-muted-foreground font-mono mb-1">Latest Analysis</div>
          <p className="text-sm font-mono leading-relaxed text-foreground cursor-blink">
            {latest.analysis_summary}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm font-mono text-muted-foreground cursor-blink">Waiting for AI analysis...</p>
        </div>
      )}

      {/* History */}
      <div className="flex-1 overflow-auto space-y-2">
        {recentWithSummary.slice(1).map((t) => (
          <div key={t.id} className="text-xs font-mono text-muted-foreground border-l-2 border-border pl-3 py-1">
            <span className="text-[hsl(var(--neon-blue))]">
              {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {" — "}
            <span className="text-foreground/70">{t.analysis_summary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
