import type { Trade } from '../types';

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">No trades executed yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Trades will appear here as the agent makes decisions.
        </p>
      </div>
    );
  }

  // Show most recent first
  const sortedTrades = [...trades].reverse();

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="bg-arena-light">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
              Time
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
              Action
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
              Price
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
              Amount
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
              Value
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-arena-light">
          {sortedTrades.map((trade) => (
            <tr key={trade.id} className="hover:bg-arena-light/50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-400">
                {new Date(trade.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-sm font-semibold ${
                    trade.action === 'buy'
                      ? 'bg-arena-green/20 text-arena-green'
                      : 'bg-arena-red/20 text-arena-red'
                  }`}
                >
                  {trade.action.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">
                ${trade.price.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {trade.amount.toFixed(4)} EGLD
              </td>
              <td className="px-4 py-3 text-right font-mono">
                ${trade.usdValue.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                {trade.reason || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
