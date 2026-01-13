import { MomentumStrategy } from '../strategies/momentum.js';
import { DCAStrategy } from '../strategies/dca.js';
import { MeanReversionStrategy } from '../strategies/mean-reversion.js';
import { PortfolioManager } from './portfolio.js';
import { priceFeed } from '../services/price-feed.js';
import { config } from '../config.js';
import type {
  AgentState,
  LeaderboardEntry,
  StrategyType,
  Trade,
  TechnicalIndicators,
} from '../types/index.js';
import type { TradingStrategy } from '../strategies/base.js';
import fs from 'fs';
import path from 'path';

export class TournamentSimulator {
  private agents: Map<string, AgentState> = new Map();
  private strategies: Map<string, TradingStrategy> = new Map();
  private portfolios: Map<string, PortfolioManager> = new Map();
  private lastPrice: number = 0;
  private isRunning: boolean = false;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Ensure logs directory exists
    const logsDir = config.logsDir;
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Register a new agent for the tournament
   */
  registerAgent(
    agentId: string,
    playerAddress: string,
    strategyType: StrategyType
  ): AgentState {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already registered`);
    }

    // Create strategy
    const strategy = this.createStrategy(strategyType);
    this.strategies.set(agentId, strategy);

    // Create portfolio
    const portfolio = new PortfolioManager(config.initialBalance);
    this.portfolios.set(agentId, portfolio);

    // Create agent state
    const agent: AgentState = {
      agentId,
      playerAddress,
      strategyType,
      portfolio: portfolio.getPortfolio(),
      trades: [],
      registeredAt: Date.now(),
      lastUpdated: Date.now(),
    };

    this.agents.set(agentId, agent);
    console.log(`Agent registered: ${agentId} (${strategyType})`);

    return agent;
  }

  private createStrategy(type: StrategyType): TradingStrategy {
    switch (type) {
      case 'momentum':
        return new MomentumStrategy();
      case 'dca':
        return new DCAStrategy();
      case 'mean_reversion':
        return new MeanReversionStrategy();
      default:
        throw new Error(`Unknown strategy type: ${type}`);
    }
  }

  /**
   * Start the tournament simulation
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Tournament already running');
      return;
    }

    console.log('Starting tournament simulation...');
    this.isRunning = true;

    // Initial price fetch
    await this.tick();

    // Start periodic ticks
    this.tickInterval = setInterval(
      () => this.tick().catch(console.error),
      config.priceUpdateInterval
    );

    console.log(`Tournament started with ${this.agents.size} agents`);
  }

  /**
   * Stop the tournament simulation
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.isRunning = false;
    console.log('Tournament stopped');
  }

  /**
   * Execute a single tick (price update + all agent decisions)
   */
  async tick(): Promise<void> {
    try {
      // Fetch current price
      const priceData = await priceFeed.getEGLDPrice();
      this.lastPrice = priceData.price;

      console.log(`Tick: EGLD = $${priceData.price.toFixed(2)} (${priceData.source})`);

      // Get technical indicators
      const indicators: TechnicalIndicators = {
        ema20: priceFeed.calculateEMA(20) ?? 0,
        rsi14: priceFeed.calculateRSI(14) ?? 50,
        previousPrice: priceFeed.getPriceHistory().slice(-2, -1)[0] ?? priceData.price,
        priceHistory: priceFeed.getPriceHistory(),
      };

      // Execute all agent decisions
      for (const [agentId, agent] of this.agents) {
        await this.executeAgentDecision(agentId, priceData.price, indicators);
      }
    } catch (error) {
      console.error('Tick error:', error);
    }
  }

  private async executeAgentDecision(
    agentId: string,
    currentPrice: number,
    indicators: TechnicalIndicators
  ): Promise<void> {
    const strategy = this.strategies.get(agentId);
    const portfolioManager = this.portfolios.get(agentId);
    const agent = this.agents.get(agentId);

    if (!strategy || !portfolioManager || !agent) {
      return;
    }

    const portfolio = portfolioManager.getPortfolio();

    // Get trading decision from strategy
    const decision = strategy.decide(currentPrice, portfolio, indicators);

    // Execute trade if not hold
    if (decision.action !== 'hold') {
      const trade = portfolioManager.executeTrade(decision, currentPrice);

      if (trade) {
        // Update agent state
        agent.portfolio = portfolioManager.getPortfolio();
        agent.trades.push(trade);
        agent.lastUpdated = Date.now();

        // Log trade
        this.logTrade(agentId, trade, currentPrice, indicators);

        console.log(
          `[${agentId}] ${decision.action.toUpperCase()}: ` +
          `${trade.amount.toFixed(4)} EGLD @ $${currentPrice.toFixed(2)} | ` +
          `Reason: ${decision.reason}`
        );
      }
    }
  }

  private logTrade(
    agentId: string,
    trade: Trade,
    currentPrice: number,
    indicators: TechnicalIndicators
  ): void {
    const logEntry = {
      timestamp: trade.timestamp,
      agentId,
      action: trade.action,
      price: currentPrice,
      amount: trade.amount,
      usdValue: trade.usdValue,
      reason: trade.reason,
      indicators: {
        ema20: indicators.ema20,
        rsi14: indicators.rsi14,
      },
      portfolioAfter: trade.portfolioAfter,
      mockTxHash: trade.id,
    };

    const logPath = path.join(config.logsDir, `${agentId}.jsonl`);
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Get current leaderboard
   */
  getLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const [agentId, agent] of this.agents) {
      const portfolioManager = this.portfolios.get(agentId);
      if (!portfolioManager) continue;

      const portfolioValue = portfolioManager.getValue(this.lastPrice);
      const roi = portfolioManager.getROI(this.lastPrice);

      entries.push({
        rank: 0, // Will be set after sorting
        agentId,
        playerAddress: agent.playerAddress,
        strategyType: agent.strategyType,
        portfolioValue,
        roi,
        tradeCount: agent.trades.length,
      });
    }

    // Sort by ROI descending
    entries.sort((a, b) => b.roi - a.roi);

    // Set ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Get agent details
   */
  getAgent(agentId: string): AgentState | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;

    const portfolioManager = this.portfolios.get(agentId);
    if (portfolioManager) {
      agent.portfolio = portfolioManager.getPortfolio();
    }

    return agent;
  }

  /**
   * Get all agent ROIs in basis points (for on-chain update)
   */
  getAgentScores(): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [agentId] of this.agents) {
      const portfolioManager = this.portfolios.get(agentId);
      if (portfolioManager) {
        scores.set(agentId, portfolioManager.getROIBasisPoints(this.lastPrice));
      }
    }

    return scores;
  }

  getLastPrice(): number {
    return this.lastPrice;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getAgentCount(): number {
    return this.agents.size;
  }
}

// Singleton instance
export const tournament = new TournamentSimulator();
