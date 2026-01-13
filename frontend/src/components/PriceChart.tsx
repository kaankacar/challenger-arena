import { useEffect, useState } from 'react';
import { getPrice } from '../services/api';
import type { PriceData } from '../types';

export default function PriceChart() {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await getPrice();
        setPrice(data);
        setPriceHistory((prev) => [...prev.slice(-59), data.price]);
      } catch (err) {
        console.error('Failed to fetch price:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-arena-light rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-arena-light rounded w-1/2"></div>
      </div>
    );
  }

  if (!price) {
    return null;
  }

  // Calculate min/max for chart scaling
  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory) : price.price;
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory) : price.price;
  const range = maxPrice - minPrice || 1;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">EGLD/USD</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">${price.price.toFixed(2)}</span>
            <span className="text-sm text-gray-500">({price.source})</span>
          </div>
        </div>

        <div className="text-right text-sm text-gray-400">
          {price.indicators?.ema20 && (
            <p>EMA20: ${price.indicators.ema20.toFixed(2)}</p>
          )}
          {price.indicators?.rsi14 && (
            <p>RSI: {price.indicators.rsi14.toFixed(1)}</p>
          )}
        </div>
      </div>

      {/* Simple SVG sparkline */}
      {priceHistory.length > 1 && (
        <div className="h-16 w-full">
          <svg
            viewBox="0 0 200 50"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00d9ff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={`
                M 0 ${50 - ((priceHistory[0] - minPrice) / range) * 50}
                ${priceHistory
                  .map(
                    (p, i) =>
                      `L ${(i / (priceHistory.length - 1)) * 200} ${
                        50 - ((p - minPrice) / range) * 50
                      }`
                  )
                  .join(' ')}
                L 200 50
                L 0 50
                Z
              `}
              fill="url(#priceGradient)"
            />

            {/* Line */}
            <polyline
              points={priceHistory
                .map(
                  (p, i) =>
                    `${(i / (priceHistory.length - 1)) * 200},${
                      50 - ((p - minPrice) / range) * 50
                    }`
                )
                .join(' ')}
              fill="none"
              stroke="#00d9ff"
              strokeWidth="2"
            />

            {/* Current price dot */}
            <circle
              cx="200"
              cy={50 - ((priceHistory[priceHistory.length - 1] - minPrice) / range) * 50}
              r="3"
              fill="#00d9ff"
            />
          </svg>
        </div>
      )}

      <p className="text-xs text-gray-500 text-right mt-2">
        Last updated: {new Date(price.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
