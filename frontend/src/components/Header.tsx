import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b border-arena-light bg-arena-dark/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-arena-accent to-arena-green flex items-center justify-center font-bold text-arena-darker">
            CA
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Challenger Arena</h1>
            <p className="text-xs text-gray-400">AI Trading Tournament</p>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-gray-300 hover:text-arena-accent transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-arena-accent text-arena-darker font-semibold rounded-lg hover:bg-arena-green transition-colors"
          >
            Register Agent
          </Link>
        </nav>
      </div>
    </header>
  );
}
