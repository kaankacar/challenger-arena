import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAgent } from '../services/api';
import type { StrategyType } from '../types';
import { StrategyNames, StrategyDescriptions } from '../types';

export default function RegistrationForm() {
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState('');
  const [playerAddress, setPlayerAddress] = useState('');
  const [strategyType, setStrategyType] = useState<StrategyType>('momentum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!agentId.trim()) {
        throw new Error('Agent ID is required');
      }
      if (!playerAddress.trim()) {
        throw new Error('Player address is required');
      }

      // Register agent
      await registerAgent(agentId.trim(), playerAddress.trim(), strategyType);

      // Navigate to agent detail page
      navigate(`/agent/${agentId.trim()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strategies: StrategyType[] = ['momentum', 'dca', 'mean_reversion'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      {error && (
        <div className="p-4 bg-arena-red/20 border border-arena-red rounded-lg text-arena-red">
          {error}
        </div>
      )}

      {/* Agent ID */}
      <div>
        <label htmlFor="agentId" className="block text-sm font-medium text-gray-300 mb-2">
          Agent Name
        </label>
        <input
          type="text"
          id="agentId"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="e.g., TradingBot-001"
          className="w-full px-4 py-3 bg-arena-dark border border-arena-light rounded-lg focus:border-arena-accent focus:outline-none transition-colors"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          A unique identifier for your agent (no spaces)
        </p>
      </div>

      {/* Player Address */}
      <div>
        <label htmlFor="playerAddress" className="block text-sm font-medium text-gray-300 mb-2">
          Wallet Address
        </label>
        <input
          type="text"
          id="playerAddress"
          value={playerAddress}
          onChange={(e) => setPlayerAddress(e.target.value)}
          placeholder="erd1..."
          className="w-full px-4 py-3 bg-arena-dark border border-arena-light rounded-lg focus:border-arena-accent focus:outline-none transition-colors font-mono text-sm"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Your MultiversX wallet address for prize distribution
        </p>
      </div>

      {/* Strategy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trading Strategy
        </label>
        <div className="space-y-3">
          {strategies.map((strategy) => (
            <label
              key={strategy}
              className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                strategyType === strategy
                  ? 'border-arena-accent bg-arena-accent/10'
                  : 'border-arena-light hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="strategyType"
                  value={strategy}
                  checked={strategyType === strategy}
                  onChange={(e) => setStrategyType(e.target.value as StrategyType)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    strategyType === strategy
                      ? 'border-arena-accent bg-arena-accent'
                      : 'border-gray-500'
                  }`}
                />
                <div>
                  <p className="font-medium">{StrategyNames[strategy]}</p>
                  <p className="text-sm text-gray-400">
                    {StrategyDescriptions[strategy]}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Entry Fee Notice */}
      <div className="p-4 bg-arena-light/50 rounded-lg">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-arena-accent">Entry Fee:</span> 0.01 EGLD
          (testnet)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Initial simulated balance: $1,000 USDC
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          loading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-arena-accent text-arena-darker hover:bg-arena-green'
        }`}
      >
        {loading ? 'Registering...' : 'Register Agent'}
      </button>
    </form>
  );
}
