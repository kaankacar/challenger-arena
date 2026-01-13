import type { Portfolio, Trade, TradeDecision } from '../types/index.js';
import crypto from 'crypto';

export class PortfolioManager {
  private portfolio: Portfolio;
  private trades: Trade[] = [];
  private readonly initialBalance: number;

  constructor(initialUSDC: number = 1000) {
    this.initialBalance = initialUSDC;
    this.portfolio = {
      usdc: initialUSDC,
      egld: 0,
    };
  }

  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  getTrades(): Trade[] {
    return [...this.trades];
  }

  getInitialBalance(): number {
    return this.initialBalance;
  }

  getValue(currentPrice: number): number {
    return this.portfolio.usdc + this.portfolio.egld * currentPrice;
  }

  getROI(currentPrice: number): number {
    const currentValue = this.getValue(currentPrice);
    return ((currentValue - this.initialBalance) / this.initialBalance) * 100;
  }

  getROIBasisPoints(currentPrice: number): number {
    const currentValue = this.getValue(currentPrice);
    return Math.round(((currentValue - this.initialBalance) / this.initialBalance) * 10000);
  }

  /**
   * Execute a trade based on decision
   */
  executeTrade(decision: TradeDecision, currentPrice: number): Trade | null {
    if (decision.action === 'hold') {
      return null;
    }

    const portfolioBefore = { ...this.portfolio };
    let trade: Trade;

    if (decision.action === 'buy') {
      trade = this.executeBuy(decision, currentPrice);
    } else {
      trade = this.executeSell(decision, currentPrice);
    }

    trade.portfolioBefore = portfolioBefore;
    trade.portfolioAfter = { ...this.portfolio };

    this.trades.push(trade);
    return trade;
  }

  private executeBuy(decision: TradeDecision, currentPrice: number): Trade {
    let usdToSpend: number;

    if (decision.amount !== undefined) {
      // Fixed amount buy
      usdToSpend = Math.min(decision.amount, this.portfolio.usdc);
    } else if (decision.percentage !== undefined) {
      // Percentage buy
      usdToSpend = this.portfolio.usdc * decision.percentage;
    } else {
      // Default to 50%
      usdToSpend = this.portfolio.usdc * 0.5;
    }

    // Calculate EGLD to receive (with 0.3% simulated slippage)
    const slippage = 0.003;
    const effectivePrice = currentPrice * (1 + slippage);
    const egldReceived = usdToSpend / effectivePrice;

    // Update portfolio
    this.portfolio.usdc -= usdToSpend;
    this.portfolio.egld += egldReceived;

    return {
      id: this.generateTradeId(),
      timestamp: Date.now(),
      action: 'buy',
      price: currentPrice,
      amount: egldReceived,
      usdValue: usdToSpend,
      portfolioBefore: { usdc: 0, egld: 0 }, // Will be set by caller
      portfolioAfter: { usdc: 0, egld: 0 },  // Will be set by caller
      reason: decision.reason,
    };
  }

  private executeSell(decision: TradeDecision, currentPrice: number): Trade {
    let egldToSell: number;

    if (decision.percentage !== undefined) {
      egldToSell = this.portfolio.egld * decision.percentage;
    } else {
      // Default to 50%
      egldToSell = this.portfolio.egld * 0.5;
    }

    // Calculate USD to receive (with 0.3% simulated slippage)
    const slippage = 0.003;
    const effectivePrice = currentPrice * (1 - slippage);
    const usdReceived = egldToSell * effectivePrice;

    // Update portfolio
    this.portfolio.egld -= egldToSell;
    this.portfolio.usdc += usdReceived;

    return {
      id: this.generateTradeId(),
      timestamp: Date.now(),
      action: 'sell',
      price: currentPrice,
      amount: egldToSell,
      usdValue: usdReceived,
      portfolioBefore: { usdc: 0, egld: 0 },
      portfolioAfter: { usdc: 0, egld: 0 },
      reason: decision.reason,
    };
  }

  private generateTradeId(): string {
    // Generate a mock transaction hash
    return crypto.randomBytes(32).toString('hex');
  }

  reset(): void {
    this.portfolio = {
      usdc: this.initialBalance,
      egld: 0,
    };
    this.trades = [];
  }
}
