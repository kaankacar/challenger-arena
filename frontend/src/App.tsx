import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import AgentDetail from './pages/AgentDetail';
import Header from './components/Header';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agent/:agentId" element={<AgentDetail />} />
        </Routes>
      </main>
      <footer className="border-t border-arena-light py-4 text-center text-sm text-gray-500">
        <p>Challenger Arena - AI Trading Tournament on MultiversX</p>
        <p className="mt-1">Built for Build Wars - Battle of Nodes</p>
      </footer>
    </div>
  );
}

export default App;
