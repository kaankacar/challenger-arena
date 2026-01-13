import { BaseStrategy } from './base.js';
import type { Portfolio, TradeDecision, TechnicalIndicators } from '../types/index.js';

/**
 * Momentum Strategy
 *
 * Uses 20-period EMA crossover to identify trends:
 * - BUY when price crosses above EMA (bullish momentum)
 * - SELL when price crosses below EMA (bearish momentum)
 * - HOLD otherwise
 *
 * Risk management: Never trade more than 50% of portfolio
 */
export class MomentumStrategy extends BaseStrategy {
  readonly name = 'MomentumMax';
  readonly type = 'momentum' as const;

  private readonly TRADE_PERCENTAGE = 0.5; // 50% of available balance
  private previousAboveEma: boolean | null = null;

  decide(
    currentPrice: number,
    portfolio: Portfolio,
    indicators: TechnicalIndicators
  ): TradeDecision {
    this.incrementTick();

    const { ema20, previousPrice } = indicators;

    // Need enough data for EMA
    if (ema20 === null || previousPrice === null) {
      return { action: 'hold', reason: 'Insufficient data for EMA calculation' };
    }

    const currentAboveEma = currentPrice > ema20;
    const previousAboveEmaLocal = previousPrice > ema20;

    // First tick - establish baseline
    if (this.previousAboveEma === null) {
      this.previousAboveEma = currentAboveEma;
      return { action: 'hold', reason: 'Establishing baseline' };
    }

    // Detect crossover
    const crossedAbove = currentAboveEma && !previousAboveEmaLocal;
    const crossedBelow = !currentAboveEma && previousAboveEmaLocal;

    this.previousAboveEma = currentAboveEma;

    // BUY signal: price crossed above EMA
    if (crossedAbove && portfolio.usdc > 10) {
      return {
        action: 'buy',
        percentage: this.TRADE_PERCENTAGE,
        reason: `Price crossed above EMA20 ($${ema20.toFixed(2)}), bullish momentum`,
      };
    }

    // SELL signal: price crossed below EMA
    if (crossedBelow && portfolio.egld > 0.01) {
      return {
        action: 'sell',
        percentage: this.TRADE_PERCENTAGE,
        reason: `Price crossed below EMA20 ($${ema20.toFixed(2)}), bearish momentum`,
      };
    }

    // No crossover - hold
    const position = currentAboveEma ? 'above' : 'below';
    return {
      action: 'hold',
      reason: `Price ($${currentPrice.toFixed(2)}) ${position} EMA20 ($${ema20.toFixed(2)}), no crossover`,
    };
  }

  reset(): void {
    super.reset();
    this.previousAboveEma = null;
  }
}
