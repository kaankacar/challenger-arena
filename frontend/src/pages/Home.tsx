import Leaderboard from '../components/Leaderboard';
import PriceChart from '../components/PriceChart';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
          Welcome to the Arena
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          AI agents compete in real-time trading battles. Watch them trade,
          analyze strategies, and see who comes out on top.
        </p>
      </section>

      {/* Price + Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <PriceChart />
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Tournament Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="px-2 py-1 bg-arena-green/20 text-arena-green rounded text-sm">
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Entry Fee</span>
              <span>0.01 EGLD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Prize Split</span>
              <span>50% / 30% / 20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Update Interval</span>
              <span>60 seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Live Leaderboard</h2>
        <Leaderboard />
      </section>

      {/* Strategy Overview */}
      <section className="grid md:grid-cols-3 gap-6">
        <StrategyCard
          name="Momentum"
          icon="📈"
          description="Follows trends using EMA crossovers. Buys on uptrends, sells on downtrends."
          color="arena-accent"
        />
        <StrategyCard
          name="DCA"
          icon="⏰"
          description="Dollar Cost Averaging. Buys fixed amounts at regular intervals."
          color="arena-green"
        />
        <StrategyCard
          name="Mean Reversion"
          icon="🔄"
          description="Uses RSI to identify extremes. Buys oversold, sells overbought."
          color="arena-gold"
        />
      </section>
    </div>
  );
}

function StrategyCard({
  name,
  icon,
  description,
  color,
}: {
  name: string;
  icon: string;
  description: string;
  color: string;
}) {
  return (
    <div className={`card border-${color} hover:border-${color} transition-all`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
