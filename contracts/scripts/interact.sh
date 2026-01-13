#!/bin/bash
set -e

# Configuration
PROXY="https://testnet-gateway.multiversx.com"
CHAIN="T"
PEM_FILE="${PEM_FILE:-$HOME/testnet-wallet.pem}"

# Load contract address
if [ -f "$(dirname "$0")/.contract-address" ]; then
  source "$(dirname "$0")/.contract-address"
fi

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Error: CONTRACT_ADDRESS not set. Run deploy.sh first or set manually."
  exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function show_help() {
  echo "Tournament Contract Interaction Script"
  echo ""
  echo "Usage: ./interact.sh <command> [args]"
  echo ""
  echo "Commands:"
  echo "  register <agent_id> <strategy_type>  - Register an agent (0=Momentum, 1=DCA, 2=MeanReversion)"
  echo "  start                                - Start the tournament (owner only)"
  echo "  update-score <agent_id> <roi_bps>    - Update agent score (owner only)"
  echo "  end                                  - End tournament and distribute prizes (owner only)"
  echo "  leaderboard                          - View current leaderboard"
  echo "  agent <agent_id>                     - View agent details"
  echo "  state                                - View tournament state"
  echo "  pool                                 - View prize pool"
  echo "  count                                - View agent count"
  echo ""
}

function register_agent() {
  AGENT_ID="$1"
  STRATEGY="$2"
  ENTRY_FEE="10000000000000000"  # 0.01 EGLD

  if [ -z "$AGENT_ID" ] || [ -z "$STRATEGY" ]; then
    echo "Usage: ./interact.sh register <agent_id> <strategy_type>"
    exit 1
  fi

  echo -e "${YELLOW}Registering agent: $AGENT_ID with strategy $STRATEGY...${NC}"

  # Convert agent_id to hex
  AGENT_ID_HEX=$(echo -n "$AGENT_ID" | xxd -p)

  mxpy contract call "$CONTRACT_ADDRESS" \
    --function "registerAgent" \
    --arguments "0x$AGENT_ID_HEX" "$STRATEGY" \
    --value "$ENTRY_FEE" \
    --proxy="$PROXY" \
    --chain="$CHAIN" \
    --gas-limit 10000000 \
    --pem "$PEM_FILE" \
    --send \
    --recall-nonce

  echo -e "${GREEN}Agent registered!${NC}"
}

function start_tournament() {
  echo -e "${YELLOW}Starting tournament...${NC}"

  mxpy contract call "$CONTRACT_ADDRESS" \
    --function "startTournament" \
    --proxy="$PROXY" \
    --chain="$CHAIN" \
    --gas-limit 10000000 \
    --pem "$PEM_FILE" \
    --send \
    --recall-nonce

  echo -e "${GREEN}Tournament started!${NC}"
}

function update_score() {
  AGENT_ID="$1"
  ROI_BPS="$2"

  if [ -z "$AGENT_ID" ] || [ -z "$ROI_BPS" ]; then
    echo "Usage: ./interact.sh update-score <agent_id> <roi_basis_points>"
    exit 1
  fi

  AGENT_ID_HEX=$(echo -n "$AGENT_ID" | xxd -p)

  echo -e "${YELLOW}Updating score for $AGENT_ID to $ROI_BPS bps...${NC}"

  mxpy contract call "$CONTRACT_ADDRESS" \
    --function "updateScore" \
    --arguments "0x$AGENT_ID_HEX" "$ROI_BPS" \
    --proxy="$PROXY" \
    --chain="$CHAIN" \
    --gas-limit 10000000 \
    --pem "$PEM_FILE" \
    --send \
    --recall-nonce

  echo -e "${GREEN}Score updated!${NC}"
}

function end_tournament() {
  echo -e "${YELLOW}Ending tournament and distributing prizes...${NC}"

  mxpy contract call "$CONTRACT_ADDRESS" \
    --function "endTournament" \
    --proxy="$PROXY" \
    --chain="$CHAIN" \
    --gas-limit 50000000 \
    --pem "$PEM_FILE" \
    --send \
    --recall-nonce

  echo -e "${GREEN}Tournament ended! Prizes distributed.${NC}"
}

function view_leaderboard() {
  echo -e "${BLUE}Fetching leaderboard...${NC}"

  mxpy contract query "$CONTRACT_ADDRESS" \
    --function "getLeaderboard" \
    --proxy="$PROXY"
}

function view_agent() {
  AGENT_ID="$1"

  if [ -z "$AGENT_ID" ]; then
    echo "Usage: ./interact.sh agent <agent_id>"
    exit 1
  fi

  AGENT_ID_HEX=$(echo -n "$AGENT_ID" | xxd -p)

  echo -e "${BLUE}Fetching agent: $AGENT_ID...${NC}"

  mxpy contract query "$CONTRACT_ADDRESS" \
    --function "getAgent" \
    --arguments "0x$AGENT_ID_HEX" \
    --proxy="$PROXY"
}

function view_state() {
  echo -e "${BLUE}Tournament state:${NC}"

  RESULT=$(mxpy contract query "$CONTRACT_ADDRESS" \
    --function "getTournamentState" \
    --proxy="$PROXY" 2>&1)

  echo "$RESULT"

  # Parse state
  if echo "$RESULT" | grep -q "0"; then
    echo -e "State: ${YELLOW}REGISTRATION${NC}"
  elif echo "$RESULT" | grep -q "1"; then
    echo -e "State: ${GREEN}ACTIVE${NC}"
  elif echo "$RESULT" | grep -q "2"; then
    echo -e "State: ${BLUE}ENDED${NC}"
  fi
}

function view_pool() {
  echo -e "${BLUE}Prize pool:${NC}"

  mxpy contract query "$CONTRACT_ADDRESS" \
    --function "getPrizePool" \
    --proxy="$PROXY"
}

function view_count() {
  echo -e "${BLUE}Agent count:${NC}"

  mxpy contract query "$CONTRACT_ADDRESS" \
    --function "getAgentCount" \
    --proxy="$PROXY"
}

# Main
case "$1" in
  "register")
    register_agent "$2" "$3"
    ;;
  "start")
    start_tournament
    ;;
  "update-score")
    update_score "$2" "$3"
    ;;
  "end")
    end_tournament
    ;;
  "leaderboard")
    view_leaderboard
    ;;
  "agent")
    view_agent "$2"
    ;;
  "state")
    view_state
    ;;
  "pool")
    view_pool
    ;;
  "count")
    view_count
    ;;
  *)
    show_help
    ;;
esac
