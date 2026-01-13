#!/bin/bash
set -e

# Eliza Agent Setup Script for Challenger Arena
# This script sets up the mx-agent-kit and configures it for the tournament

echo "=========================================="
echo "  Challenger Arena - Agent Setup"
echo "=========================================="

# Check if mx-agent-kit exists
MX_AGENT_KIT_DIR="${MX_AGENT_KIT_DIR:-$HOME/mx-agent-kit}"

if [ ! -d "$MX_AGENT_KIT_DIR" ]; then
  echo "Cloning mx-agent-kit..."
  git clone git@github.com:multiversx/mx-agent-kit.git "$MX_AGENT_KIT_DIR"
  cd "$MX_AGENT_KIT_DIR"
  chmod +x setup.sh && ./setup.sh
else
  echo "mx-agent-kit found at $MX_AGENT_KIT_DIR"
fi

cd "$MX_AGENT_KIT_DIR"

# Copy character files
echo "Copying character files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/characters/"*.json "$MX_AGENT_KIT_DIR/eliza/characters/"

echo "Character files copied:"
ls -la "$MX_AGENT_KIT_DIR/eliza/characters/"*trader*.json "$MX_AGENT_KIT_DIR/eliza/characters/"*bot*.json "$MX_AGENT_KIT_DIR/eliza/characters/"*reverter*.json 2>/dev/null || true

# Check for .env file
if [ ! -f "$MX_AGENT_KIT_DIR/eliza/.env" ]; then
  echo ""
  echo "WARNING: No .env file found in eliza directory."
  echo ""
  echo "Please create one with the following content:"
  echo ""
  echo "# Portkey AI Gateway (use Google AI Studio - free tier)"
  echo "PORTKEY_PROVIDER_API_KEY=your-google-ai-studio-key"
  echo "PORTKEY_MODEL_PROVIDER=google"
  echo "PORTKEY_MODEL=gemini-1.5-flash"
  echo ""
  echo "# MultiversX Testnet"
  echo "MVX_PRIVATE_KEY=your-testnet-private-key"
  echo "MVX_NETWORK=testnet"
  echo ""
  echo "Get your Google AI Studio API key (free) from:"
  echo "https://aistudio.google.com/app/apikey"
  echo ""
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "To start the agents:"
echo ""
echo "1. Configure eliza/.env with your API keys"
echo "2. Run: cd $MX_AGENT_KIT_DIR && ./start.sh"
echo ""
echo "Or start manually:"
echo "  Terminal 1: cd $MX_AGENT_KIT_DIR/eliza && pnpm run start"
echo "  Terminal 2: cd $MX_AGENT_KIT_DIR/eliza && pnpm run start:client"
echo "  Terminal 3: cd $MX_AGENT_KIT_DIR/gateway && npm run dev:node"
echo ""
