import type { Portfolio, TradeDecision, TechnicalIndicators } from '../types/index.js';

export interface TradingStrategy {
  readonly name: string;
  readonly type: 'momentum' | 'dca' | 'mean_reversion';

  /**
   * Make a trading decision based on current price and portfolio
   * @param currentPrice Current EGLD price in USD
   * @param portfolio Current portfolio state
   * @param indicators Technical indicators (EMA, RSI, etc.)
   * @returns Trading decision (buy/sell/hold)
   */
  decide(
    currentPrice: number,
    portfolio: Portfolio,
    indicators: TechnicalIndicators
  ): TradeDecision;

  /**
   * Reset strategy state (e.g., for a new tournament)
   */
  reset(): void;
}

/**
 * Base class with shared utility methods
 */
export abstract class BaseStrategy implements TradingStrategy {
  abstract readonly name: string;
  abstract readonly type: 'momentum' | 'dca' | 'mean_reversion';

  protected tickCount = 0;

  abstract decide(
    currentPrice: number,
    portfolio: Portfolio,
    indicators: TechnicalIndicators
  ): TradeDecision;

  reset(): void {
    this.tickCount = 0;
  }

  protected incrementTick(): void {
    this.tickCount++;
  }

  /**
   * Calculate portfolio value in USD
   */
  protected getPortfolioValue(portfolio: Portfolio, currentPrice: number): number {
    return portfolio.usdc + portfolio.egld * currentPrice;
  }

  /**
   * Calculate how much USDC can be used for buying
   */
  protected getAvailableUSDC(portfolio: Portfolio, percentage: number): number {
    return portfolio.usdc * Math.min(percentage, 1);
  }

  /**
   * Calculate how much EGLD can be sold
   */
  protected getAvailableEGLD(portfolio: Portfolio, percentage: number): number {
    return portfolio.egld * Math.min(percentage, 1);
  }
}
