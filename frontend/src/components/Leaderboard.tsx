import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/api';
import type { LeaderboardEntry, LeaderboardResponse } from '../types';
import { StrategyNames } from '../types';

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getLeaderboard();
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-arena-light rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-arena-light rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-arena-red">
        <p className="text-arena-red">Error: {error}</p>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 text-lg">No agents registered yet.</p>
        <Link
          to="/register"
          className="inline-block mt-4 px-6 py-2 bg-arena-accent text-arena-darker font-semibold rounded-lg hover:bg-arena-green transition-colors"
        >
          Register First Agent
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Agents" value={data.statistics.totalAgents} />
        <StatCard
          label="Best ROI"
          value={`${data.statistics.maxROI >= 0 ? '+' : ''}${data.statistics.maxROI.toFixed(2)}%`}
          valueClass={data.statistics.maxROI >= 0 ? 'text-arena-green' : 'text-arena-red'}
        />
        <StatCard
          label="Avg ROI"
          value={`${data.statistics.averageROI >= 0 ? '+' : ''}${data.statistics.averageROI.toFixed(2)}%`}
          valueClass={data.statistics.averageROI >= 0 ? 'text-arena-green' : 'text-arena-red'}
        />
        <StatCard label="Total Trades" value={data.statistics.totalTrades} />
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-arena-light">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                Agent
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                Strategy
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                Portfolio
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                ROI
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                Trades
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-light">
            {data.leaderboard.map((entry) => (
              <LeaderboardRow key={entry.agentId} entry={entry} />
            ))}
          </tbody>
        </table>
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
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColors: Record<number, string> = {
    1: 'text-arena-gold',
    2: 'text-arena-silver',
    3: 'text-arena-bronze',
  };

  const rankIcons: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  return (
    <tr className="hover:bg-arena-light/50 transition-colors">
      <td className="px-4 py-4">
        <span className={`text-lg font-bold ${rankColors[entry.rank] || 'text-gray-400'}`}>
          {rankIcons[entry.rank] || `#${entry.rank}`}
        </span>
      </td>
      <td className="px-4 py-4">
        <Link
          to={`/agent/${entry.agentId}`}
          className="hover:text-arena-accent transition-colors"
        >
          <p className="font-semibold">{entry.agentId}</p>
          <p className="text-xs text-gray-500 truncate max-w-[150px]">
            {entry.playerAddress}
          </p>
        </Link>
      </td>
      <td className="px-4 py-4">
        <span className="px-2 py-1 bg-arena-light rounded text-sm">
          {StrategyNames[entry.strategyType]}
        </span>
      </td>
      <td className="px-4 py-4 text-right font-mono">
        ${entry.portfolioValue.toFixed(2)}
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`font-bold ${
            entry.roi >= 0 ? 'text-arena-green' : 'text-arena-red'
          }`}
        >
          {entry.roi >= 0 ? '+' : ''}
          {entry.roi.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-4 text-right text-gray-400">{entry.tradeCount}</td>
    </tr>
  );
}
