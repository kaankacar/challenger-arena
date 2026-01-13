// Strategy types
export type StrategyType = 'momentum' | 'dca' | 'mean_reversion';

export const StrategyTypeMap: Record<StrategyType, number> = {
  momentum: 0,
  dca: 1,
  mean_reversion: 2,
};

// Portfolio
export interface Portfolio {
  usdc: number;
  egld: number;
}

// Price data
export interface PriceData {
  price: number;
  timestamp: number;
  source: 'coingecko' | 'xexchange' | 'multiversx';
}

// Trading decision
export type TradeAction = 'buy' | 'sell' | 'hold';

export interface TradeDecision {
  action: TradeAction;
  percentage?: number;  // 0.0 - 1.0, percentage of portfolio to trade
  amount?: number;      // Fixed amount in USDC
  reason?: string;
}

// Trade record
export interface Trade {
  id: string;
  timestamp: number;
  action: TradeAction;
  price: number;
  amount: number;        // Amount in EGLD
  usdValue: number;      // Value in USDC
  portfolioBefore: Portfolio;
  portfolioAfter: Portfolio;
  reason?: string;
}

// Agent state
export interface AgentState {
  agentId: string;
  playerAddress: string;
  strategyType: StrategyType;
  portfolio: Portfolio;
  trades: Trade[];
  registeredAt: number;
  lastUpdated: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  playerAddress: string;
  strategyType: StrategyType;
  portfolioValue: number;
  roi: number;           // Percentage (e.g., 15.5 = 15.5%)
  tradeCount: number;
}

// Technical indicators
export interface TechnicalIndicators {
  ema20: number;
  rsi14: number;
  previousPrice: number;
  priceHistory: number[];
}

// Agent decision context (sent to LLM)
export interface TradingContext {
  agentId: string;
  currentPrice: number;
  ema20: number;
  rsi14: number;
  previousPrice: number;
  portfolio: Portfolio;
  portfolioValue: number;
  roi: number;
}

// LLM response
export interface AgentDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  percentage?: number;
  reason: string;
}

// Character file structure (Eliza format)
export interface CharacterFile {
  name: string;
  bio: string[];
  lore: string[];
  adjectives: string[];
  knowledge: string[];
  topics: string[];
  style: {
    all: string[];
    chat: string[];
  };
  messageExamples: Array<{
    user: string;
    content: { text: string };
  }>;
  modelProvider: string;
  settings: {
    model: string;
  };
  plugins: string[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tournament state
export type TournamentState = 'registration' | 'active' | 'ended';

export interface TournamentInfo {
  state: TournamentState;
  prizePool: number;
  agentCount: number;
  entryFee: number;
}

// WebSocket message types
export type WSMessageType =
  | 'price_update'
  | 'leaderboard_update'
  | 'trade_executed'
  | 'tournament_state_change';

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  data: unknown;
}
