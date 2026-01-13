import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { config, validateConfig } from './config.js';
import { tournament } from './simulator/tournament.js';
import { leaderboardService } from './services/leaderboard.js';
import { priceFeed } from './services/price-feed.js';
import type { StrategyType, WSMessage } from './types/index.js';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.warn('Config validation warning:', error);
}

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// HTTP server for WebSocket
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket client connected');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

function broadcast(message: WSMessage): void {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// === API Routes ===

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    agents: tournament.getAgentCount(),
    running: tournament.isActive(),
  });
});

// Get current price
app.get('/api/price', async (req, res) => {
  try {
    const priceData = await priceFeed.getEGLDPrice();
    const indicators = priceFeed.getIndicators();

    res.json({
      success: true,
      data: {
        price: priceData.price,
        timestamp: priceData.timestamp,
        source: priceData.source,
        indicators,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price',
    });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = leaderboardService.getLeaderboard();
  const stats = leaderboardService.getStatistics();

  res.json({
    success: true,
    data: {
      leaderboard,
      statistics: stats,
      lastPrice: tournament.getLastPrice(),
    },
  });
});

// Get agent details
app.get('/api/agents/:agentId', (req, res) => {
  const { agentId } = req.params;
  const agent = tournament.getAgent(agentId);

  if (!agent) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found',
    });
  }

  const rank = leaderboardService.getAgentRank(agentId);
  const portfolioManager = tournament['portfolios'].get(agentId);
  const lastPrice = tournament.getLastPrice();

  res.json({
    success: true,
    data: {
      ...agent,
      rank,
      portfolioValue: portfolioManager?.getValue(lastPrice) ?? 0,
      roi: portfolioManager?.getROI(lastPrice) ?? 0,
    },
  });
});

// Register a new agent (for testing)
app.post('/api/agents', (req, res) => {
  try {
    const { agentId, playerAddress, strategyType } = req.body;

    if (!agentId || !playerAddress || !strategyType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, playerAddress, strategyType',
      });
    }

    const validStrategies: StrategyType[] = ['momentum', 'dca', 'mean_reversion'];
    if (!validStrategies.includes(strategyType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}`,
      });
    }

    const agent = tournament.registerAgent(agentId, playerAddress, strategyType);

    res.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get tournament status
app.get('/api/tournament', (req, res) => {
  res.json({
    success: true,
    data: {
      running: tournament.isActive(),
      agentCount: tournament.getAgentCount(),
      lastPrice: tournament.getLastPrice(),
      priceUpdateInterval: config.priceUpdateInterval,
    },
  });
});

// Start tournament
app.post('/api/tournament/start', async (req, res) => {
  try {
    await tournament.start();
    res.json({
      success: true,
      message: 'Tournament started',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Stop tournament
app.post('/api/tournament/stop', (req, res) => {
  tournament.stop();
  res.json({
    success: true,
    message: 'Tournament stopped',
  });
});

// === Periodic Updates ===

// Broadcast leaderboard updates
setInterval(() => {
  if (!tournament.isActive()) return;

  const leaderboard = leaderboardService.getLeaderboard();
  broadcast({
    type: 'leaderboard_update',
    timestamp: Date.now(),
    data: leaderboard,
  });
}, config.leaderboardUpdateInterval);

// Broadcast price updates
setInterval(async () => {
  if (!tournament.isActive()) return;

  try {
    const priceData = await priceFeed.getEGLDPrice();
    broadcast({
      type: 'price_update',
      timestamp: Date.now(),
      data: priceData,
    });
  } catch (error) {
    console.error('Price broadcast error:', error);
  }
}, 30_000); // Every 30 seconds

// === Start Server ===

server.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           CHALLENGER ARENA - Trading Tournament Engine         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                 ║
║   Server:    http://localhost:${config.port}                         ║
║   WebSocket: ws://localhost:${config.port}                           ║
║   Network:   ${config.network.padEnd(40)}  ║
║                                                                 ║
║   Endpoints:                                                    ║
║   - GET  /health              Health check                      ║
║   - GET  /api/price           Current EGLD price                ║
║   - GET  /api/leaderboard     Tournament leaderboard            ║
║   - GET  /api/agents/:id      Agent details                     ║
║   - POST /api/agents          Register agent                    ║
║   - POST /api/tournament/start Start tournament                 ║
║   - POST /api/tournament/stop  Stop tournament                  ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  tournament.stop();
  server.close();
  process.exit(0);
});
