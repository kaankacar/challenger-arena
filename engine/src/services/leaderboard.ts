import { tournament } from '../simulator/tournament.js';
import type { LeaderboardEntry } from '../types/index.js';

export class LeaderboardService {
  private lastUpdate: number = 0;
  private cachedLeaderboard: LeaderboardEntry[] = [];
  private readonly CACHE_TTL = 10_000; // 10 seconds

  /**
   * Get current leaderboard (with caching)
   */
  getLeaderboard(): LeaderboardEntry[] {
    const now = Date.now();

    if (now - this.lastUpdate < this.CACHE_TTL && this.cachedLeaderboard.length > 0) {
      return this.cachedLeaderboard;
    }

    this.cachedLeaderboard = tournament.getLeaderboard();
    this.lastUpdate = now;

    return this.cachedLeaderboard;
  }

  /**
   * Get top N agents
   */
  getTopAgents(n: number = 3): LeaderboardEntry[] {
    return this.getLeaderboard().slice(0, n);
  }

  /**
   * Get agent rank
   */
  getAgentRank(agentId: string): number | null {
    const leaderboard = this.getLeaderboard();
    const entry = leaderboard.find((e) => e.agentId === agentId);
    return entry?.rank ?? null;
  }

  /**
   * Get leaderboard statistics
   */
  getStatistics(): {
    totalAgents: number;
    averageROI: number;
    maxROI: number;
    minROI: number;
    totalTrades: number;
  } {
    const leaderboard = this.getLeaderboard();

    if (leaderboard.length === 0) {
      return {
        totalAgents: 0,
        averageROI: 0,
        maxROI: 0,
        minROI: 0,
        totalTrades: 0,
      };
    }

    const rois = leaderboard.map((e) => e.roi);
    const totalTrades = leaderboard.reduce((sum, e) => sum + e.tradeCount, 0);

    return {
      totalAgents: leaderboard.length,
      averageROI: rois.reduce((a, b) => a + b, 0) / rois.length,
      maxROI: Math.max(...rois),
      minROI: Math.min(...rois),
      totalTrades,
    };
  }

  /**
   * Format leaderboard for display
   */
  formatLeaderboard(): string {
    const leaderboard = this.getLeaderboard();

    if (leaderboard.length === 0) {
      return 'No agents registered yet.';
    }

    const lines = [
      '╔═══════════════════════════════════════════════════════════════╗',
      '║                    CHALLENGER ARENA LEADERBOARD                ║',
      '╠═══════════════════════════════════════════════════════════════╣',
      '║ Rank │ Agent                │ Strategy      │ ROI      │ Trades ║',
      '╠═══════════════════════════════════════════════════════════════╣',
    ];

    for (const entry of leaderboard) {
      const rank = String(entry.rank).padStart(4);
      const agent = entry.agentId.padEnd(20).slice(0, 20);
      const strategy = entry.strategyType.padEnd(13).slice(0, 13);
      const roi = `${entry.roi >= 0 ? '+' : ''}${entry.roi.toFixed(2)}%`.padStart(8);
      const trades = String(entry.tradeCount).padStart(6);

      lines.push(`║ ${rank} │ ${agent} │ ${strategy} │ ${roi} │ ${trades} ║`);
    }

    lines.push('╚═══════════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }
}

// Singleton instance
export const leaderboardService = new LeaderboardService();
