import axios from 'axios';
import { config } from '../config.js';
import type { PriceData } from '../types/index.js';

export class PriceFeedService {
  private cache: PriceData | null = null;
  private readonly CACHE_TTL = 30_000; // 30 seconds
  private priceHistory: number[] = [];
  private readonly MAX_HISTORY = 100; // Keep last 100 prices

  async getEGLDPrice(): Promise<PriceData> {
    // Return cached price if still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      // Primary: CoinGecko
      const priceData = await this.fetchFromCoinGecko();
      this.cache = priceData;
      this.addToHistory(priceData.price);
      return priceData;
    } catch (error) {
      console.warn('CoinGecko fetch failed, trying MultiversX API...', error);

      try {
        // Fallback: MultiversX API
        const priceData = await this.fetchFromMultiversX();
        this.cache = priceData;
        this.addToHistory(priceData.price);
        return priceData;
      } catch (fallbackError) {
        console.error('All price feeds failed:', fallbackError);

        // Return cached price if available, even if stale
        if (this.cache) {
          return this.cache;
        }

        throw new Error('Unable to fetch EGLD price from any source');
      }
    }
  }

  private async fetchFromCoinGecko(): Promise<PriceData> {
    const url = 'https://api.coingecko.com/api/v3/simple/price';
    const params: Record<string, string> = {
      ids: 'elrond-erd-2',
      vs_currencies: 'usd',
    };

    // Add API key if available (for higher rate limits)
    const headers: Record<string, string> = {};
    if (config.coingeckoApiKey) {
      headers['x-cg-demo-api-key'] = config.coingeckoApiKey;
    }

    const response = await axios.get(url, { params, headers, timeout: 10000 });
    const price = response.data['elrond-erd-2']?.usd;

    if (typeof price !== 'number') {
      throw new Error('Invalid CoinGecko response');
    }

    return {
      price,
      timestamp: Date.now(),
      source: 'coingecko',
    };
  }

  private async fetchFromMultiversX(): Promise<PriceData> {
    const url = `${config.apiUrl}/economics`;

    const response = await axios.get(url, { timeout: 10000 });
    const price = response.data?.price;

    if (typeof price !== 'number') {
      throw new Error('Invalid MultiversX API response');
    }

    return {
      price,
      timestamp: Date.now(),
      source: 'multiversx',
    };
  }

  private addToHistory(price: number): void {
    this.priceHistory.push(price);
    if (this.priceHistory.length > this.MAX_HISTORY) {
      this.priceHistory.shift();
    }
  }

  getPriceHistory(): number[] {
    return [...this.priceHistory];
  }

  getLatestPrice(): number | null {
    return this.cache?.price ?? null;
  }

  // Calculate EMA (Exponential Moving Average)
  calculateEMA(period: number = 20): number | null {
    if (this.priceHistory.length < period) {
      return null;
    }

    const prices = this.priceHistory.slice(-period);
    const multiplier = 2 / (period + 1);

    // Start with SMA for first value
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Calculate EMA for remaining values
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  // Calculate RSI (Relative Strength Index)
  calculateRSI(period: number = 14): number | null {
    if (this.priceHistory.length < period + 1) {
      return null;
    }

    const prices = this.priceHistory.slice(-(period + 1));
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) {
      return 100; // No losses = maximum RSI
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  // Get all technical indicators
  getIndicators(): { ema20: number | null; rsi14: number | null; previousPrice: number | null } {
    const history = this.priceHistory;
    return {
      ema20: this.calculateEMA(20),
      rsi14: this.calculateRSI(14),
      previousPrice: history.length >= 2 ? history[history.length - 2] : null,
    };
  }
}

// Singleton instance
export const priceFeed = new PriceFeedService();
