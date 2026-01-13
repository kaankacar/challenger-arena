import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import type {
  AgentDecision,
  CharacterFile,
  Portfolio,
  TradingContext,
} from '../types/index.js';
import fs from 'fs';
import path from 'path';

/**
 * Eliza Agent Service
 *
 * Integrates with Google AI (Gemini) to make trading decisions
 * using character-based prompts defined in JSON files.
 */
export class ElizaAgentService {
  private genAI: GoogleGenerativeAI | null = null;
  private characters: Map<string, CharacterFile> = new Map();
  private readonly charactersDir: string;

  constructor(charactersDir: string = '../agents/characters') {
    this.charactersDir = charactersDir;

    if (config.googleApiKey) {
      this.genAI = new GoogleGenerativeAI(config.googleApiKey);
    } else {
      console.warn('Google API key not configured. LLM decisions will use fallback logic.');
    }
  }

  /**
   * Load a character file
   */
  async loadCharacter(agentId: string): Promise<CharacterFile | null> {
    if (this.characters.has(agentId)) {
      return this.characters.get(agentId)!;
    }

    const characterPath = path.resolve(
      process.cwd(),
      this.charactersDir,
      `${agentId}.json`
    );

    try {
      const content = fs.readFileSync(characterPath, 'utf-8');
      const character = JSON.parse(content) as CharacterFile;
      this.characters.set(agentId, character);
      return character;
    } catch (error) {
      console.warn(`Failed to load character for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get a trading decision from the LLM
   */
  async getDecision(
    agentId: string,
    context: TradingContext
  ): Promise<AgentDecision> {
    const character = await this.loadCharacter(agentId);

    // If no LLM or character, use fallback
    if (!this.genAI || !character) {
      return this.getFallbackDecision(context);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: character.settings?.model || 'gemini-1.5-flash',
      });

      const systemPrompt = this.buildSystemPrompt(character);
      const userPrompt = this.buildUserPrompt(context);

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      });

      const response = result.response.text();
      return this.parseDecision(response);
    } catch (error) {
      console.error(`LLM decision failed for ${agentId}:`, error);
      return this.getFallbackDecision(context);
    }
  }

  private buildSystemPrompt(character: CharacterFile): string {
    return `You are ${character.name}. ${character.bio.join(' ')}

Your trading rules:
${character.knowledge.join('\n')}

You must respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"action": "BUY", "percentage": 0.5, "reason": "brief explanation"}

Where:
- action: must be exactly "BUY", "SELL", or "HOLD"
- percentage: a number between 0.1 and 0.5 (only for BUY/SELL)
- reason: a brief explanation of your decision`;
  }

  private buildUserPrompt(context: TradingContext): string {
    const portfolioValue =
      context.portfolio.usdc + context.portfolio.egld * context.currentPrice;
    const roi = context.roi.toFixed(2);

    return `Current market data:
- EGLD Price: $${context.currentPrice.toFixed(2)}
- 20-period EMA: $${context.ema20.toFixed(2)}
- RSI(14): ${context.rsi14.toFixed(1)}
- Previous Price: $${context.previousPrice.toFixed(2)}
- Portfolio: ${context.portfolio.usdc.toFixed(2)} USDC, ${context.portfolio.egld.toFixed(4)} EGLD
- Portfolio Value: $${portfolioValue.toFixed(2)}
- Current ROI: ${roi}%

What is your trading decision?`;
  }

  private parseDecision(response: string): AgentDecision {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize
      const action = String(parsed.action || 'HOLD').toUpperCase();
      if (!['BUY', 'SELL', 'HOLD'].includes(action)) {
        return { action: 'HOLD', reason: 'Invalid action from LLM' };
      }

      const percentage =
        typeof parsed.percentage === 'number'
          ? Math.max(0.1, Math.min(0.5, parsed.percentage))
          : undefined;

      return {
        action: action as 'BUY' | 'SELL' | 'HOLD',
        percentage: action !== 'HOLD' ? percentage : undefined,
        reason: String(parsed.reason || 'LLM decision'),
      };
    } catch (error) {
      console.warn('Failed to parse LLM response:', response);
      return { action: 'HOLD', reason: 'Failed to parse LLM response' };
    }
  }

  private getFallbackDecision(context: TradingContext): AgentDecision {
    // Simple RSI-based fallback
    if (context.rsi14 < 30 && context.portfolio.usdc > 50) {
      return {
        action: 'BUY',
        percentage: 0.3,
        reason: 'Fallback: RSI oversold',
      };
    }

    if (context.rsi14 > 70 && context.portfolio.egld > 0.1) {
      return {
        action: 'SELL',
        percentage: 0.3,
        reason: 'Fallback: RSI overbought',
      };
    }

    return { action: 'HOLD', reason: 'Fallback: No clear signal' };
  }
}

// Singleton instance
export const elizaAgent = new ElizaAgentService();
