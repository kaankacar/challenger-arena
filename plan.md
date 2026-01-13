# AI Trading Tournament MVP - Implementation Plan

## Project Overview
Build a competitive AI trading tournament where Eliza agents compete on a real-time leaderboard using simulated trading with live xExchange prices.

**Key Decisions:**
- **Agent Logic**: Full Eliza + LLM via Portkey AI Gateway (Gemini 1.5 Flash)
- **Target Network**: MultiversX Testnet
- **AI Model**: Google AI Studio (free tier) via Portkey

---

## Phase 0: Development Environment Setup

### Prerequisites Installation

```bash
# 1. Install Rust (required for smart contracts)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup default stable
rustup target add wasm32-unknown-unknown

# 2. Install mxpy (MultiversX CLI)
pip3 install --upgrade multiversx-sdk-cli

# 3. Install sc-meta (smart contract build tool)
cargo install multiversx-sc-meta

# 4. Install Node.js 23.3+ (required for Eliza)
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 23.3.0
nvm use 23.3.0

# 5. Install pnpm (required for Eliza)
npm install -g pnpm

# 6. Verify installations
rustc --version        # Should show 1.75+
mxpy --version         # Should show 9.0+
sc-meta --version      # Should show 0.50+
node --version         # Should show v23.3.0
pnpm --version         # Should show 8.0+
```

### Wallet Setup (Testnet)

```bash
# Generate new wallet for testnet
mxpy wallet new --format pem --outfile ~/testnet-wallet.pem

# Get testnet EGLD from faucet
# Visit: https://testnet-wallet.multiversx.com/faucet
# Or use: https://r3d4.fr/faucet (community faucet)

# Check balance
mxpy account get --address=$(mxpy wallet bech32 --infile ~/testnet-wallet.pem) \
  --proxy=https://testnet-gateway.multiversx.com
```

### Project Initialization

```bash
cd /Users/kaan/challenger-arena

# Create directory structure
mkdir -p contracts/tournament/src
mkdir -p contracts/scripts
mkdir -p engine/src/{services,strategies,simulator,types}
mkdir -p agents/characters
mkdir -p frontend/src/{components,pages,hooks,services,types}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│  ┌──────────────┐ ┌────────────────┐ ┌─────────────────────────────┐ │
│  │ Registration │ │  Leaderboard   │ │     Agent Detail View       │ │
│  │    Form      │ │  (Real-time)   │ │   (Trade History + Stats)   │ │
│  └──────────────┘ └────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌─────────────────────────────┐   ┌───────────────────────────────────┐
│    SMART CONTRACT (Rust)    │   │    STRATEGY ENGINE (Node.js/TS)    │
│  ┌────────────────────────┐ │   │  ┌─────────────────────────────┐  │
│  │ Agent Registration     │ │   │  │  Price Feed Service         │  │
│  │ Tournament State       │ │   │  │  (CoinGecko + xExchange)    │  │
│  │ Leaderboard Storage    │ │   │  └─────────────────────────────┘  │
│  │ Prize Distribution     │ │   │  ┌─────────────────────────────┐  │
│  └────────────────────────┘ │   │  │  Strategy Templates         │  │
└─────────────────────────────┘   │  │  - Momentum (EMA)            │  │
             │                     │  │  - DCA                       │  │
             │                     │  │  - Mean Reversion (RSI)      │  │
             ▼                     │  └─────────────────────────────┘  │
┌─────────────────────────────┐   │  ┌─────────────────────────────┐  │
│   MultiversX Testnet        │   │  │  Tournament Simulator        │  │
│   - Contract deployed       │   │  │  - Portfolio tracking        │  │
│   - Registration txs        │   │  │  - Trade execution           │  │
│   - Prize payouts           │   │  │  - ROI calculation           │  │
└─────────────────────────────┘   │  └─────────────────────────────┘  │
                                   │  ┌─────────────────────────────┐  │
                                   │  │  Eliza Agents (mx-agent-kit) │  │
                                   │  │  - Character files per strat │  │
                                   │  │  - Portkey AI Gateway        │  │
                                   │  └─────────────────────────────┘  │
                                   └───────────────────────────────────┘
```

---

## Directory Structure

```
challenger-arena/
├── contracts/                      # Smart Contract (Rust)
│   ├── tournament/
│   │   ├── src/
│   │   │   └── lib.rs             # Main contract (~150-200 LOC)
│   │   ├── Cargo.toml
│   │   └── multiversx.json
│   └── scripts/
│       ├── deploy.sh              # mxpy deployment script
│       └── interact.sh            # Contract interaction helpers
│
├── engine/                         # Strategy Engine (Node.js/TS)
│   ├── src/
│   │   ├── index.ts               # Entry point
│   │   ├── config.ts              # Environment configuration
│   │   ├── services/
│   │   │   ├── price-feed.ts      # CoinGecko + xExchange integration
│   │   │   ├── leaderboard.ts     # Rankings calculation
│   │   │   └── contract.ts        # Smart contract interaction
│   │   ├── strategies/
│   │   │   ├── base.ts            # Strategy interface
│   │   │   ├── momentum.ts        # 20 EMA crossover
│   │   │   ├── dca.ts             # Dollar-cost averaging
│   │   │   └── mean-reversion.ts  # RSI-based
│   │   ├── simulator/
│   │   │   ├── portfolio.ts       # Portfolio tracking
│   │   │   ├── trade-executor.ts  # Simulated trade execution
│   │   │   └── tournament.ts      # Tournament orchestration
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── agents/                         # Eliza Agent Configurations
│   ├── characters/
│   │   ├── momentum-trader.json   # Momentum strategy character
│   │   ├── dca-bot.json           # DCA strategy character
│   │   └── mean-reverter.json     # Mean reversion character
│   └── setup.sh                   # Agent initialization script
│
├── frontend/                       # React Dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── RegistrationForm.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── TradeHistory.tsx
│   │   │   └── CountdownTimer.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── AgentDetail.tsx
│   │   │   └── Register.tsx
│   │   ├── hooks/
│   │   │   ├── useContract.ts
│   │   │   ├── usePrices.ts
│   │   │   └── useLeaderboard.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                       # Setup instructions & rules
```

---

## Phase 1: Smart Contract (Days 1-2)

### Contract Design

```rust
// contracts/tournament/src/lib.rs

#[derive(TopEncode, TopDecode, TypeAbi, NestedEncode, NestedDecode, Clone)]
pub struct AgentEntry<M: ManagedTypeApi> {
    pub agent_id: ManagedBuffer<M>,
    pub player_address: ManagedAddress<M>,
    pub strategy_type: u8,           // 0=Momentum, 1=DCA, 2=MeanReversion
    pub entry_fee: BigUint<M>,
    pub final_roi: i64,              // Stored as basis points (10000 = 100%)
    pub registered_at: u64,
}

#[multiversx_sc::contract]
pub trait Tournament {
    #[init]
    fn init(&self, entry_fee: BigUint);

    // Registration (payable)
    #[endpoint]
    #[payable("EGLD")]
    fn register_agent(&self, agent_id: ManagedBuffer, strategy_type: u8);

    // Owner-only: Update agent scores
    #[endpoint]
    #[only_owner]
    fn update_scores(&self, agent_id: ManagedBuffer, roi_basis_points: i64);

    // Owner-only: End tournament and distribute prizes
    #[endpoint]
    #[only_owner]
    fn end_tournament(&self);

    // Views
    #[view(getAgent)]
    fn get_agent(&self, agent_id: ManagedBuffer) -> AgentEntry<Self::Api>;

    #[view(getLeaderboard)]
    fn get_leaderboard(&self) -> MultiValueEncoded<AgentEntry<Self::Api>>;

    #[view(getTournamentState)]
    fn get_tournament_state(&self) -> u8; // 0=Registration, 1=Active, 2=Ended

    // Storage
    #[storage_mapper("agents")]
    fn agents(&self, agent_id: &ManagedBuffer) -> SingleValueMapper<AgentEntry<Self::Api>>;

    #[storage_mapper("agent_list")]
    fn agent_list(&self) -> VecMapper<ManagedBuffer>;

    #[storage_mapper("entry_fee")]
    fn entry_fee(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("tournament_state")]
    fn tournament_state(&self) -> SingleValueMapper<u8>;

    #[storage_mapper("prize_pool")]
    fn prize_pool(&self) -> SingleValueMapper<BigUint>;
}
```

### Deployment Script

```bash
# contracts/scripts/deploy.sh
#!/bin/bash
set -e

# Build the contract
cd ../tournament
sc-meta all build

# Deploy to testnet
mxpy contract deploy \
  --bytecode output/tournament.wasm \
  --proxy=https://testnet-gateway.multiversx.com \
  --chain=T \
  --arguments 0x2386f26fc10000 \
  --gas-limit 50000000 \
  --pem ~/testnet-wallet.pem \
  --send \
  --recall-nonce

# The 0x2386f26fc10000 = 0.01 EGLD entry fee (10^16 in hex)
```

---

## Phase 2: Strategy Engine (Days 3-5)

### Price Feed Service

```typescript
// engine/src/services/price-feed.ts
interface PriceData {
  price: number;
  timestamp: number;
  source: 'coingecko' | 'xexchange';
}

class PriceFeedService {
  private cache: PriceData | null = null;
  private readonly CACHE_TTL = 30_000; // 30 seconds

  async getEGLDPrice(): Promise<PriceData> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      // Primary: CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd'
      );
      const data = await response.json();
      this.cache = {
        price: data['elrond-erd-2'].usd,
        timestamp: Date.now(),
        source: 'coingecko'
      };
      return this.cache;
    } catch (error) {
      // Fallback: MultiversX API
      return this.fetchFromMultiversX();
    }
  }
}
```

### Strategy Implementations

```typescript
// engine/src/strategies/momentum.ts
class MomentumStrategy implements TradingStrategy {
  private prices: number[] = [];
  private readonly EMA_PERIOD = 20;

  decide(currentPrice: number, portfolio: Portfolio): TradeDecision {
    this.prices.push(currentPrice);
    if (this.prices.length < this.EMA_PERIOD) {
      return { action: 'hold' };
    }

    const ema = this.calculateEMA();
    const prevEma = this.calculateEMA(this.prices.slice(0, -1));

    if (currentPrice > ema && prevEma < this.prices[this.prices.length - 2]) {
      // Uptrend crossover - BUY
      return { action: 'buy', percentage: 0.5 }; // 50% of USDC
    } else if (currentPrice < ema && prevEma > this.prices[this.prices.length - 2]) {
      // Downtrend crossover - SELL
      return { action: 'sell', percentage: 0.5 }; // 50% of EGLD
    }
    return { action: 'hold' };
  }
}

// engine/src/strategies/dca.ts
class DCAStrategy implements TradingStrategy {
  private tradeCount = 0;
  private readonly TRADE_INTERVAL = 10; // Every 10 price updates

  decide(currentPrice: number, portfolio: Portfolio): TradeDecision {
    this.tradeCount++;
    if (this.tradeCount % this.TRADE_INTERVAL === 0) {
      // Buy fixed amount each interval
      return { action: 'buy', amount: 50 }; // $50 USDC
    }
    return { action: 'hold' };
  }
}

// engine/src/strategies/mean-reversion.ts
class MeanReversionStrategy implements TradingStrategy {
  private prices: number[] = [];
  private readonly RSI_PERIOD = 14;
  private readonly OVERSOLD = 30;
  private readonly OVERBOUGHT = 70;

  decide(currentPrice: number, portfolio: Portfolio): TradeDecision {
    this.prices.push(currentPrice);
    if (this.prices.length < this.RSI_PERIOD + 1) {
      return { action: 'hold' };
    }

    const rsi = this.calculateRSI();

    if (rsi < this.OVERSOLD) {
      return { action: 'buy', percentage: 0.3 }; // Buy on dip
    } else if (rsi > this.OVERBOUGHT) {
      return { action: 'sell', percentage: 0.3 }; // Sell on peak
    }
    return { action: 'hold' };
  }
}
```

### Tournament Simulator

```typescript
// engine/src/simulator/tournament.ts
class TournamentSimulator {
  private agents: Map<string, AgentState> = new Map();
  private readonly INITIAL_BALANCE = 1000; // USDC

  async registerAgent(agentId: string, strategyType: StrategyType) {
    const strategy = this.createStrategy(strategyType);
    this.agents.set(agentId, {
      portfolio: { usdc: this.INITIAL_BALANCE, egld: 0 },
      strategy,
      trades: [],
      registeredAt: Date.now()
    });
  }

  async tick(currentPrice: number) {
    for (const [agentId, state] of this.agents) {
      const decision = state.strategy.decide(currentPrice, state.portfolio);
      if (decision.action !== 'hold') {
        this.executeTrade(agentId, state, decision, currentPrice);
      }
    }
  }

  getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.agents.entries())
      .map(([id, state]) => ({
        agentId: id,
        roi: this.calculateROI(state),
        portfolioValue: this.getPortfolioValue(state, this.lastPrice)
      }))
      .sort((a, b) => b.roi - a.roi);
  }
}
```

---

## Phase 3: Frontend Dashboard (Days 6-7)

### Key Components

**Leaderboard.tsx** - Real-time rankings with auto-refresh every 10 seconds
**RegistrationForm.tsx** - Connect wallet, select strategy, pay entry fee
**AgentDetail.tsx** - Trade history table, performance metrics, portfolio pie chart
**PriceChart.tsx** - Live EGLD/USDC price with 1H/24H views

### Contract Integration

```typescript
// frontend/src/hooks/useContract.ts
import { useGetAccountInfo, useGetNetworkConfig } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';

export function useRegisterAgent() {
  const { network } = useGetNetworkConfig();

  const registerAgent = async (agentId: string, strategyType: number) => {
    const tx = {
      value: '10000000000000000', // 0.01 EGLD
      data: `registerAgent@${toHex(agentId)}@${toHex(strategyType)}`,
      receiver: CONTRACT_ADDRESS,
      gasLimit: 5000000
    };

    await sendTransactions({ transactions: [tx] });
  };

  return { registerAgent };
}
```

---

## Phase 4: Eliza Agent Integration (Days 8-9)

### Eliza + Portkey Setup

```bash
# Clone mx-agent-kit
git clone git@github.com:multiversx/mx-agent-kit.git ~/mx-agent-kit
cd ~/mx-agent-kit

# Initialize submodules (eliza + gateway)
chmod +x setup.sh && ./setup.sh

# Configure environment (eliza/.env)
cat > eliza/.env << 'EOF'
# Portkey AI Gateway (use Google AI Studio - free tier)
PORTKEY_PROVIDER_API_KEY=your-google-ai-studio-key
PORTKEY_MODEL_PROVIDER=google
PORTKEY_MODEL=gemini-1.5-flash

# MultiversX Testnet
MVX_PRIVATE_KEY=your-testnet-private-key
MVX_NETWORK=testnet
EOF

# Get Google AI Studio API key (free):
# Visit: https://aistudio.google.com/app/apikey
```

### Character File Template

```json
// agents/characters/momentum-trader.json
{
  "name": "MomentumMax",
  "bio": ["AI trading agent specializing in momentum strategies using EMA crossovers"],
  "lore": ["Created for the Challenger Arena tournament on MultiversX"],
  "adjectives": ["analytical", "trend-following", "disciplined"],
  "knowledge": [
    "I use 20-period EMA to identify trends in EGLD/USDC",
    "I buy when price crosses above EMA indicating uptrend",
    "I sell when price crosses below EMA indicating downtrend",
    "I never go all-in - maximum 50% of portfolio per trade",
    "I respond with exactly one of: BUY, SELL, or HOLD",
    "I include a percentage (0.1 to 0.5) for BUY/SELL actions"
  ],
  "topics": ["trading", "technical analysis", "cryptocurrency", "EGLD", "MultiversX"],
  "style": {
    "all": ["concise", "data-driven", "professional"],
    "chat": ["reports trade decisions as JSON", "explains reasoning in one sentence"]
  },
  "messageExamples": [
    {
      "user": "{{user1}}",
      "content": { "text": "EGLD=$45.20, EMA20=$43.10, prev_price=$44.80, prev_EMA=$44.90. Decide." }
    },
    {
      "user": "MomentumMax",
      "content": { "text": "{\"action\":\"BUY\",\"percentage\":0.5,\"reason\":\"Price crossed above EMA, bullish momentum confirmed\"}" }
    }
  ],
  "modelProvider": "google",
  "settings": {
    "model": "gemini-1.5-flash"
  },
  "plugins": ["@elizaos/plugin-multiversx"]
}
```

### Agent Decision Integration

```typescript
// engine/src/services/eliza-agent.ts
import Anthropic from '@anthropic-ai/sdk'; // Or Portkey client

interface TradingContext {
  currentPrice: number;
  ema20: number;
  rsi14: number;
  previousPrice: number;
  portfolio: { usdc: number; egld: number };
}

interface AgentDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  percentage?: number;
  reason: string;
}

class ElizaAgentService {
  private client: any; // Portkey or direct Google AI client

  constructor() {
    // Use Portkey gateway for flexibility
    this.client = new PortkeyClient({
      apiKey: process.env.PORTKEY_API_KEY,
      provider: 'google'
    });
  }

  async getDecision(agentId: string, context: TradingContext): Promise<AgentDecision> {
    const character = await this.loadCharacter(agentId);

    const systemPrompt = `You are ${character.name}. ${character.bio.join(' ')}

Your trading rules:
${character.knowledge.join('\n')}

Respond ONLY with valid JSON in this format:
{"action": "BUY|SELL|HOLD", "percentage": 0.1-0.5, "reason": "brief explanation"}`;

    const userPrompt = `Current market data:
- EGLD Price: $${context.currentPrice.toFixed(2)}
- 20-period EMA: $${context.ema20.toFixed(2)}
- RSI(14): ${context.rsi14.toFixed(1)}
- Previous Price: $${context.previousPrice.toFixed(2)}
- Portfolio: ${context.portfolio.usdc} USDC, ${context.portfolio.egld} EGLD

What is your trading decision?`;

    const response = await this.client.chat.completions.create({
      model: 'gemini-1.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3 // Low temperature for consistent decisions
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content) as AgentDecision;
  }
}
```

### Logging Agent Decisions (Audit Trail)

```typescript
// engine/src/services/trade-logger.ts
interface TradeLog {
  timestamp: number;
  agentId: string;
  decision: AgentDecision;
  context: TradingContext;
  mockTxHash: string;
  portfolioBefore: Portfolio;
  portfolioAfter: Portfolio;
}

class TradeLogger {
  private logs: TradeLog[] = [];

  logTrade(entry: TradeLog) {
    this.logs.push(entry);
    // Also persist to file for demo/audit
    fs.appendFileSync(
      `./logs/${entry.agentId}.jsonl`,
      JSON.stringify(entry) + '\n'
    );
  }

  getAgentHistory(agentId: string): TradeLog[] {
    return this.logs.filter(l => l.agentId === agentId);
  }
}
```

---

## Phase 5: Integration & Testing (Days 10-14)

### Integration Checklist
- [ ] Frontend connects to deployed testnet contract
- [ ] Registration flow: wallet connect → select strategy → pay fee → confirm
- [ ] Engine fetches prices every 60 seconds
- [ ] Agents execute decisions based on strategy + LLM
- [ ] Leaderboard updates every 10 minutes
- [ ] Trade history persists and displays correctly
- [ ] Prize distribution works for top 3

### Testing Strategy
1. **Unit tests**: Strategy logic (momentum, DCA, mean reversion calculations)
2. **Integration tests**: Contract interaction via mxpy
3. **E2E tests**: Full registration → trading → leaderboard flow
4. **Load test**: Simulate 20+ agents trading simultaneously

---

## Key Dependencies

```json
// engine/package.json
{
  "dependencies": {
    "@multiversx/sdk-core": "^13.0.0",
    "@multiversx/sdk-network-providers": "^2.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0"
  }
}

// frontend/package.json
{
  "dependencies": {
    "@multiversx/sdk-dapp": "^2.0.0",
    "react": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "tailwindcss": "^3.4.0",
    "recharts": "^2.10.0"
  }
}
```

---

## Verification Plan

### Functional Verification
1. Deploy contract to testnet → verify via explorer
2. Register 3 test agents (one per strategy)
3. Run engine for 1 hour with live prices
4. Verify trade history shows correct buy/sell decisions
5. Verify leaderboard rankings match expected ROI calculations
6. End tournament and verify prize distribution

### Demo Readiness
- [ ] 5+ agents actively trading
- [ ] Visible trade history proving autonomous decisions
- [ ] Clean UI with real-time updates
- [ ] Working wallet integration
- [ ] 2-3 min demo video recorded

---

## Files to Create (Priority Order)

1. `contracts/tournament/src/lib.rs` - Core contract logic
2. `contracts/tournament/Cargo.toml` - Rust dependencies
3. `engine/src/services/price-feed.ts` - Price integration
4. `engine/src/strategies/*.ts` - Three strategy implementations
5. `engine/src/simulator/tournament.ts` - Core simulation
6. `frontend/src/components/Leaderboard.tsx` - Main dashboard
7. `frontend/src/components/RegistrationForm.tsx` - Agent signup
8. `agents/characters/*.json` - Eliza character files
