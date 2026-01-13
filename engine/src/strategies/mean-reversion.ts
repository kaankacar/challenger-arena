import { BaseStrategy } from './base.js';
import type { Portfolio, TradeDecision, TechnicalIndicators } from '../types/index.js';

/**
 * Mean Reversion Strategy
 *
 * Uses RSI (Relative Strength Index) to identify overbought/oversold conditions:
 * - BUY when RSI < 30 (oversold - expect price to rise)
 * - SELL when RSI > 70 (overbought - expect price to fall)
 * - HOLD otherwise
 *
 * Based on the assumption that prices tend to revert to their mean.
 */
export class MeanReversionStrategy extends BaseStrategy {
  readonly name = 'MeanReverter';
  readonly type = 'mean_reversion' as const;

  private readonly OVERSOLD_THRESHOLD = 30;
  private readonly OVERBOUGHT_THRESHOLD = 70;
  private readonly TRADE_PERCENTAGE = 0.3; // 30% of available balance

  decide(
    currentPrice: number,
    portfolio: Portfolio,
    indicators: TechnicalIndicators
  ): TradeDecision {
    this.incrementTick();

    const { rsi14 } = indicators;

    // Need enough data for RSI
    if (rsi14 === null) {
      return { action: 'hold', reason: 'Insufficient data for RSI calculation' };
    }

    // Oversold - BUY signal
    if (rsi14 < this.OVERSOLD_THRESHOLD) {
      if (portfolio.usdc < 10) {
        return {
          action: 'hold',
          reason: `RSI oversold (${rsi14.toFixed(1)}) but insufficient USDC`,
        };
      }

      return {
        action: 'buy',
        percentage: this.TRADE_PERCENTAGE,
        reason: `RSI oversold at ${rsi14.toFixed(1)} (< ${this.OVERSOLD_THRESHOLD}), expecting reversal up`,
      };
    }

    // Overbought - SELL signal
    if (rsi14 > this.OVERBOUGHT_THRESHOLD) {
      if (portfolio.egld < 0.01) {
        return {
          action: 'hold',
          reason: `RSI overbought (${rsi14.toFixed(1)}) but no EGLD to sell`,
        };
      }

      return {
        action: 'sell',
        percentage: this.TRADE_PERCENTAGE,
        reason: `RSI overbought at ${rsi14.toFixed(1)} (> ${this.OVERBOUGHT_THRESHOLD}), expecting reversal down`,
      };
    }

    // Neutral zone - HOLD
    return {
      action: 'hold',
      reason: `RSI neutral at ${rsi14.toFixed(1)} (between ${this.OVERSOLD_THRESHOLD} and ${this.OVERBOUGHT_THRESHOLD})`,
    };
  }

  reset(): void {
    super.reset();
  }
}
