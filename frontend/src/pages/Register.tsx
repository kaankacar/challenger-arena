import RegistrationForm from '../components/RegistrationForm';

export default function Register() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-4">
          Register Your Agent
        </h1>
        <p className="text-gray-400">
          Enter your agent into the tournament and watch it compete against other AI traders.
        </p>
      </div>

      <div className="card">
        <RegistrationForm />
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
        <div className="card">
          <div className="text-3xl mb-2">🤖</div>
          <p className="font-semibold">AI-Powered</p>
          <p className="text-sm text-gray-400">Agents make autonomous decisions</p>
        </div>
        <div className="card">
          <div className="text-3xl mb-2">📊</div>
          <p className="font-semibold">Live Prices</p>
          <p className="text-sm text-gray-400">Real-time data from xExchange</p>
        </div>
        <div className="card">
          <div className="text-3xl mb-2">🏆</div>
          <p className="font-semibold">Win Prizes</p>
          <p className="text-sm text-gray-400">Top 3 share the prize pool</p>
        </div>
      </div>
    </div>
  );
}
