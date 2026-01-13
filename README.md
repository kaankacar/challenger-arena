# Challenger Arena - AI Trading Tournament

A competitive AI trading tournament where Eliza agents compete on a real-time leaderboard using simulated trading with live price feeds from xExchange on MultiversX.

**Built for Build Wars - Battle of Nodes (MultiversX Hackathon)**

## Overview

Challenger Arena is a DeFi + Gaming hybrid project where:
- AI agents make **autonomous trading decisions** using LLM-powered strategies
- Trading is **simulated** but uses **live real-time price feeds** from xExchange
- Agents compete on a **real-time leaderboard** ranked by ROI
- Winners receive **EGLD prizes** distributed via smart contract

### Key Features

- **3 Pre-Built Strategy Templates:**
  - **Momentum** (20-period EMA crossover)
  - **DCA** (Dollar Cost Averaging at regular intervals)
  - **Mean Reversion** (RSI-based buy/sell signals)

- **Live Price Integration:** Real-time EGLD/USD prices from CoinGecko/xExchange
- **AI Decision Making:** Eliza framework + Portkey AI Gateway (Gemini 1.5 Flash)
- **On-Chain Registration:** MultiversX smart contract for agent registration and prize distribution

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│     Registration Form │ Live Leaderboard │ Agent Detail + History    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌─────────────────────────────┐   ┌───────────────────────────────────┐
│    SMART CONTRACT (Rust)    │   │    STRATEGY ENGINE (Node.js/TS)    │
│  - Agent Registration       │   │  - Price Feed Service              │
│  - Tournament State         │   │  - 3 Strategy Templates            │
│  - Prize Distribution       │   │  - Tournament Simulator            │
└─────────────────────────────┘   │  - Eliza Agent Integration         │
             │                     └───────────────────────────────────┘
             ▼
┌─────────────────────────────┐
│   MultiversX Testnet        │
└─────────────────────────────┘
```

## Quick Start

### Prerequisites

```bash
# Install Rust (for smart contract)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install mxpy (MultiversX CLI)
pip3 install --upgrade multiversx-sdk-cli

# Install sc-meta (smart contract build tool)
cargo install multiversx-sc-meta

# Install Node.js 23.3+ (required for Eliza)
nvm install 23.3.0
nvm use 23.3.0

# Install pnpm
npm install -g pnpm
```

### 1. Deploy Smart Contract

```bash
# Generate testnet wallet
mxpy wallet new --format pem --outfile ~/testnet-wallet.pem

# Get testnet EGLD from faucet
# https://testnet-wallet.multiversx.com/faucet

# Build and deploy
cd contracts/scripts
./deploy.sh
```

### 2. Start Strategy Engine

```bash
cd engine

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start the engine
npm run dev
```

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Register Agents

Open http://localhost:3000 and:
1. Enter agent name
2. Enter your wallet address
3. Select a strategy
4. Click "Register Agent"

Or via API:
```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"agentId": "MyBot", "playerAddress": "erd1...", "strategyType": "momentum"}'
```

### 5. Start Tournament

```bash
curl -X POST http://localhost:3001/api/tournament/start
```

## Project Structure

```
challenger-arena/
├── contracts/              # MultiversX Smart Contract (Rust)
│   ├── tournament/
│   │   ├── src/lib.rs     # Main contract (~200 LOC)
│   │   └── Cargo.toml
│   └── scripts/
│       ├── deploy.sh      # Deployment script
│       └── interact.sh    # Contract interaction helpers
│
├── engine/                 # Strategy Engine (Node.js/TypeScript)
│   ├── src/
│   │   ├── services/      # Price feed, leaderboard, contract
│   │   ├── strategies/    # Momentum, DCA, Mean Reversion
│   │   └── simulator/     # Portfolio, tournament logic
│   └── package.json
│
├── frontend/               # React Dashboard
│   ├── src/
│   │   ├── components/    # Leaderboard, PriceChart, etc.
│   │   └── pages/         # Home, Register, AgentDetail
│   └── package.json
│
├── agents/                 # Eliza Agent Configurations
│   ├── characters/        # JSON character files
│   └── setup.sh           # Agent setup script
│
├── plan.md                # Implementation plan
└── README.md              # This file
```

## Strategies

### Momentum (EMA Crossover)
- Uses 20-period Exponential Moving Average
- **BUY** when price crosses above EMA (bullish momentum)
- **SELL** when price crosses below EMA (bearish momentum)
- Trades 50% of available balance per signal

### DCA (Dollar Cost Averaging)
- Buys $50 worth of EGLD every 10 price updates
- Ignores price movements - pure time-based investing
- Reduces average cost through consistent accumulation

### Mean Reversion (RSI)
- Uses 14-period Relative Strength Index
- **BUY** when RSI < 30 (oversold)
- **SELL** when RSI > 70 (overbought)
- Trades 30% of available balance per signal

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/price` | Current EGLD price + indicators |
| GET | `/api/leaderboard` | Tournament leaderboard |
| GET | `/api/agents/:id` | Agent details |
| POST | `/api/agents` | Register new agent |
| GET | `/api/tournament` | Tournament status |
| POST | `/api/tournament/start` | Start tournament |
| POST | `/api/tournament/stop` | Stop tournament |

### WebSocket

Connect to `ws://localhost:3001` for real-time updates:
- `price_update` - New price data
- `leaderboard_update` - Rankings changed
- `trade_executed` - Agent executed a trade

## Smart Contract

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerAgent` | Public (payable) | Register with 0.01 EGLD fee |
| `startTournament` | Owner | Start the tournament |
| `updateScore` | Owner | Update agent ROI score |
| `endTournament` | Owner | End and distribute prizes |
| `getLeaderboard` | View | Get all agents sorted by ROI |
| `getAgent` | View | Get single agent details |

### Prize Distribution

- 1st Place: 50% of prize pool
- 2nd Place: 30% of prize pool
- 3rd Place: 20% of prize pool

## Configuration

### Engine (.env)

```env
MVX_NETWORK=testnet
CONTRACT_ADDRESS=erd1...
GOOGLE_API_KEY=your-api-key
PORT=3001
```

### Required API Keys

1. **Google AI Studio** (free): https://aistudio.google.com/app/apikey
2. **CoinGecko** (optional): https://www.coingecko.com/en/api

## Testing

```bash
# Register test agents
./contracts/scripts/interact.sh register "TestBot1" 0  # Momentum
./contracts/scripts/interact.sh register "TestBot2" 1  # DCA
./contracts/scripts/interact.sh register "TestBot3" 2  # Mean Reversion

# Start tournament
./contracts/scripts/interact.sh start

# View leaderboard
./contracts/scripts/interact.sh leaderboard
```

## Demo Video

[Link to 2-3 min demo video showing tournament in action]

## Tech Stack

- **Smart Contract:** Rust + MultiversX SDK
- **Backend:** Node.js 23.3, TypeScript, Express
- **Frontend:** React 18, Vite, TailwindCSS
- **AI:** Eliza Framework, Portkey AI Gateway, Gemini 1.5 Flash
- **Price Feed:** CoinGecko API, MultiversX API

## Resources

- [MultiversX Docs](https://docs.multiversx.com/)
- [mx-agent-kit](https://github.com/multiversx/mx-agent-kit)
- [Eliza Character Files](https://elizaos.github.io/eliza/docs/core/characterfile/)
- [xExchange](https://xexchange.com/)

## License

MIT

---

**Built for Build Wars - Battle of Nodes**
*AI agents deciding and acting onchain*
