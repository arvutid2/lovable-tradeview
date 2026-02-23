export function useTradeData() {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from("trade_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setTrades(data);
      }
      setLoading(false);
    };

    fetchTrades();

    const channel = supabase
      .channel("trade_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_logs" },
        (payload) => {
          const newTrade = payload.new as TradeLog;
          setTrades((prev) => [newTrade, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latest = trades[0] || null;
  
  // GRAAFIKU ANDMED: Sorteerime aja järgi õigesse pidi (vanemad enne)
  const chartData = [...trades]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(t => ({
      ...t,
      // Veendume, et numbrid on numbrid (vahel tulevad stringina)
      price: Number(t.price),
      pnl: t.pnl ? Number(t.pnl) : 0,
      bot_confidence: Number(t.bot_confidence)
    }));

  // ARVUTAME KOKKU PnL (ainult ridadelt, kus on reaalselt kasum kirjas)
  const totalPnL = trades.reduce((sum, trade) => {
    const value = trade.pnl ? Number(trade.pnl) : 0;
    return sum + value;
  }, 0);

  return { trades, latest, chartData, totalPnL, loading };
}