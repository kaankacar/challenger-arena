import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Network
  network: process.env.MVX_NETWORK || 'testnet',
  proxyUrl: process.env.MVX_PROXY_URL || 'https://testnet-gateway.multiversx.com',
  apiUrl: process.env.MVX_API_URL || 'https://testnet-api.multiversx.com',

  // Contract
  contractAddress: process.env.CONTRACT_ADDRESS || '',

  // Wallet (for updating scores)
  privateKey: process.env.MVX_PRIVATE_KEY || '',

  // AI (Google AI Studio via Portkey or direct)
  aiProvider: process.env.AI_PROVIDER || 'google',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  portkeyApiKey: process.env.PORTKEY_API_KEY || '',

  // Price feed
  coingeckoApiKey: process.env.COINGECKO_API_KEY || '',

  // Server
  port: parseInt(process.env.PORT || '3001', 10),

  // Tournament settings
  initialBalance: 1000,  // USDC
  priceUpdateInterval: 60 * 1000,     // 60 seconds
  leaderboardUpdateInterval: 10 * 60 * 1000,  // 10 minutes
  scoreUpdateInterval: 5 * 60 * 1000, // 5 minutes (update on-chain scores)

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logsDir: process.env.LOGS_DIR || './logs',
};

// Validate required config
export function validateConfig(): void {
  const required: Array<keyof typeof config> = [];

  // Only require contract address in production
  if (process.env.NODE_ENV === 'production') {
    required.push('contractAddress');
  }

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
}
