#!/bin/bash
set -e

# Configuration
PROXY="https://testnet-gateway.multiversx.com"
CHAIN="T"
PEM_FILE="${PEM_FILE:-$HOME/testnet-wallet.pem}"
ENTRY_FEE="10000000000000000"  # 0.01 EGLD in wei (10^16)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building contract...${NC}"
cd "$(dirname "$0")/../tournament"
sc-meta all build

echo -e "${YELLOW}Deploying to testnet...${NC}"
DEPLOY_RESULT=$(mxpy contract deploy \
  --bytecode output/tournament.wasm \
  --proxy="$PROXY" \
  --chain="$CHAIN" \
  --arguments "0x$(printf '%x' $ENTRY_FEE)" \
  --gas-limit 50000000 \
  --pem "$PEM_FILE" \
  --send \
  --recall-nonce \
  --outfile deploy-result.json 2>&1)

echo "$DEPLOY_RESULT"

# Extract contract address
if [ -f "deploy-result.json" ]; then
  CONTRACT_ADDRESS=$(cat deploy-result.json | grep -o '"contractAddress": "[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}Contract deployed successfully!${NC}"
  echo -e "Contract Address: ${GREEN}$CONTRACT_ADDRESS${NC}"
  echo ""
  echo "Save this address in your .env file:"
  echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS"

  # Save to env file
  echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > ../scripts/.contract-address
else
  echo "Warning: Could not find deploy result file"
fi
