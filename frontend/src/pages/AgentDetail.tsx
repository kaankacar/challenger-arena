import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAgent } from '../services/api';
import TradeHistory from '../components/TradeHistory';
import type { AgentState } from '../types';
import { StrategyNames } from '../types';

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return;

      try {
        const data = await getAgent(agentId);
        setAgent(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
    const interval = setInterval(fetchAgent, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [agentId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-arena-light rounded w-1/3"></div>
        <div className="card h-48"></div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-arena-red mb-4">
          Agent Not Found
        </h2>
        <p className="text-gray-400 mb-6">{error || 'Unable to load agent details.'}</p>
        <Link
          to="/"
          className="px-6 py-2 bg-arena-accent text-arena-darker font-semibold rounded-lg hover:bg-arena-green transition-colors"
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-arena-accent hover:underline text-sm">
            ← Back to Leaderboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">{agent.agentId}</h1>
          <p className="text-gray-400 font-mono text-sm">{agent.playerAddress}</p>
        </div>
        {agent.rank && (
          <div className="text-center">
            <p className="text-sm text-gray-400">Current Rank</p>
            <p className="text-4xl font-bold text-arena-accent">#{agent.rank}</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Strategy"
          value={StrategyNames[agent.strategyType]}
        />
        <StatCard
          label="Portfolio Value"
          value={`$${(agent.portfolioValue ?? 0).toFixed(2)}`}
        />
        <StatCard
          label="ROI"
          value={`${(agent.roi ?? 0) >= 0 ? '+' : ''}${(agent.roi ?? 0).toFixed(2)}%`}
          valueClass={(agent.roi ?? 0) >= 0 ? 'text-arena-green' : 'text-arena-red'}
        />
        <StatCard
          label="Total Trades"
          value={agent.trades.length}
        />
      </div>

      {/* Portfolio Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Portfolio Breakdown</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-400">USDC Balance</p>
            <p className="text-2xl font-bold">${agent.portfolio.usdc.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">EGLD Holdings</p>
            <p className="text-2xl font-bold">{agent.portfolio.egld.toFixed(4)} EGLD</p>
          </div>
        </div>

        {/* Portfolio Bar */}
        <div className="mt-6">
          <div className="h-4 bg-arena-light rounded-full overflow-hidden flex">
            <div
              className="bg-arena-green transition-all"
              style={{
                width: `${
                  agent.portfolioValue
                    ? (agent.portfolio.usdc / agent.portfolioValue) * 100
                    : 100
                }%`,
              }}
            />
            <div
              className="bg-arena-accent transition-all"
              style={{
                width: `${
                  agent.portfolioValue
                    ? 100 - (agent.portfolio.usdc / agent.portfolioValue) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>USDC</span>
            <span>EGLD</span>
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Trade History</h3>
        <TradeHistory trades={agent.trades} />
      </div>

      {/* Registration Info */}
      <div className="card text-sm text-gray-500">
        <p>
          Registered: {new Date(agent.registeredAt).toLocaleString()}
        </p>
        <p>
          Last Updated: {new Date(agent.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
