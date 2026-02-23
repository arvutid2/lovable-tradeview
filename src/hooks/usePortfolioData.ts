export function usePortfolioData() {
  const [history, setHistory] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setHistory(data as PortfolioRow[]);
      }
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel("portfolio_realtime")
      .on(
        "postgres_changes",
        // MUUDATUS: Kuulame ka UPDATE sündmusi, sest bot uuendab rida id=1
        { event: "*", schema: "public", table: "portfolio" }, 
        () => {
          fetch(); // Lihtsuse mõttes küsime andmed uuesti, kui midagi muutub
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latest = history.length > 0 ? history[history.length - 1] : null;
  
  // MUUDATUS: Ära kasuta 10000, kui sa ei alustanud sellega. 
  // Võtame algseks balansiks ajaloo esimese sissekande või määra oma päris algsumma:
  const startingBalance = history.length > 0 ? history[0].total_value_usdt : 100; 
  
  const pnl = latest ? latest.total_value_usdt - startingBalance : 0;
  const pnlPercent = latest && startingBalance !== 0 ? ((latest.total_value_usdt - startingBalance) / startingBalance) * 100 : 0;

  return { history, latest, pnl, pnlPercent, loading };
}