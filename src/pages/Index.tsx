import { usePortfolioData } from "@/hooks/usePortfolioData";
import { PortfolioStats } from "@/components/PortfolioStats";
import { PortfolioChart } from "@/components/PortfolioChart";

const Index = () => {
  const { portfolio, history, loading } = usePortfolioData();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-green-500">INITIALIZING...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-mono font-bold tracking-tighter text-green-500">
          CRYPTO :: TERMINAL
        </h1>
        
        {/* Kontrollime, et portfolio on olemas */}
        {portfolio && <PortfolioStats portfolio={portfolio} />}
        
        <div className="grid grid-cols-1 gap-6">
          <PortfolioChart data={history} />
        </div>
      </div>
    </div>
  );
};

export default Index;