// Strategy types
export type StrategyType = 'momentum' | 'dca' | 'mean_reversion';

export const StrategyNames: Record<StrategyType, string> = {
  momentum: 'Momentum (EMA)',
  dca: 'Dollar Cost Averaging',
  mean_reversion: 'Mean Reversion (RSI)',
};

export const StrategyDescriptions: Record<StrategyType, string> = {
  momentum: 'Uses 20-period EMA crossover to identify trends. Buys on uptrend, sells on downtrend.',
  dca: 'Buys a fixed amount at regular intervals, regardless of price. Reduces volatility impact.',
  mean_reversion: 'Uses RSI to identify overbought/oversold conditions. Buys dips, sells peaks.',
};

// Portfolio
export interface Portfolio {
  usdc: number;
  egld: number;
}

// Trade record
export interface Trade {
  id: string;
  timestamp: number;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  amount: number;
  usdValue: number;
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
  rank?: number;
  portfolioValue?: number;
  roi?: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  playerAddress: string;
  strategyType: StrategyType;
  portfolioValue: number;
  roi: number;
  tradeCount: number;
}

// Price data
export interface PriceData {
  price: number;
  timestamp: number;
  source: string;
  indicators?: {
    ema20: number | null;
    rsi14: number | null;
    previousPrice: number | null;
  };
}

// Tournament info
export interface TournamentInfo {
  running: boolean;
  agentCount: number;
  lastPrice: number;
  priceUpdateInterval: number;
}

// API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  statistics: {
    totalAgents: number;
    averageROI: number;
    maxROI: number;
    minROI: number;
    totalTrades: number;
  };
  lastPrice: number;
}
