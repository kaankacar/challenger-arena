import { BaseStrategy } from './base.js';
import type { Portfolio, TradeDecision, TechnicalIndicators } from '../types/index.js';

/**
 * Dollar Cost Averaging (DCA) Strategy
 *
 * Buys a fixed amount at regular intervals, regardless of price.
 * This reduces the impact of volatility by spreading purchases over time.
 *
 * Configuration:
 * - Buys every 10 price updates (10 minutes at 1-minute intervals)
 * - Fixed buy amount: $50 USDC per trade
 */
export class DCAStrategy extends BaseStrategy {
  readonly name = 'DCABot';
  readonly type = 'dca' as const;

  private readonly TRADE_INTERVAL = 10; // Trade every N ticks
  private readonly BUY_AMOUNT = 50;     // $50 per trade

  decide(
    currentPrice: number,
    portfolio: Portfolio,
    _indicators: TechnicalIndicators
  ): TradeDecision {
    this.incrementTick();

    // Check if it's time to buy
    if (this.tickCount % this.TRADE_INTERVAL !== 0) {
      const ticksUntilBuy = this.TRADE_INTERVAL - (this.tickCount % this.TRADE_INTERVAL);
      return {
        action: 'hold',
        reason: `Waiting for next DCA interval (${ticksUntilBuy} ticks remaining)`,
      };
    }

    // Check if we have enough USDC
    if (portfolio.usdc < this.BUY_AMOUNT) {
      if (portfolio.usdc < 10) {
        return {
          action: 'hold',
          reason: 'Insufficient USDC for DCA buy (< $10)',
        };
      }

      // Buy with remaining USDC
      return {
        action: 'buy',
        amount: portfolio.usdc * 0.9, // Leave small buffer
        reason: `DCA buy with remaining funds ($${portfolio.usdc.toFixed(2)})`,
      };
    }

    // Execute DCA buy
    return {
      action: 'buy',
      amount: this.BUY_AMOUNT,
      reason: `DCA scheduled buy of $${this.BUY_AMOUNT} at tick ${this.tickCount}`,
    };
  }

  reset(): void {
    super.reset();
  }
}
