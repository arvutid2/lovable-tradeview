import { TradeLog } from "@/hooks/useTradeData";

interface SignalsLogProps {
  trades: TradeLog[];
}

export const SignalsLog = ({ trades }: SignalsLogProps) => {
  return (
    <div className="space-y-2 font-mono">
      {trades.length === 0 ? (
        <div className="text-[10px] text-green-900 italic animate-pulse">
          WAITING_FOR_INCOMING_DATA...
        </div>
      ) : (
        trades.map((trade) => (
          <div 
            key={trade.id} 
            className="border border-green-900/10 bg-black/20 p-2 rounded hover:border-green-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-green-800">
                {new Date(trade.created_at).toLocaleTimeString()}
              </span>
              <span className={`text-[10px] font-bold px-1 rounded ${
                trade.action === 'BUY' ? 'bg-green-500/10 text-green-500' : 
                trade.action === 'SELL' ? 'bg-red-500/10 text-red-500' : 'text-gray-500'
              }`}>
                {trade.action}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-white font-bold">{trade.symbol}</span>
              <span className="text-xs text-green-400">${trade.price?.toLocaleString()}</span>
            </div>

            {/* Täiendav info, mis ilmub ainult andmete olemasolul */}
            <div className="mt-2 flex gap-3 text-[9px] text-green-900 uppercase">
              <span>Conf: {trade.bot_confidence}%</span>
              {trade.pnl !== null && (
                <span className={Number(trade.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  PnL: {trade.pnl}%
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};