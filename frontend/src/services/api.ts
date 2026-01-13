import axios from 'axios';
import type {
  AgentState,
  ApiResponse,
  LeaderboardResponse,
  PriceData,
  StrategyType,
  TournamentInfo,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Price API
export async function getPrice(): Promise<PriceData> {
  const response = await api.get<ApiResponse<PriceData>>('/price');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch price');
  }
  return response.data.data;
}

// Leaderboard API
export async function getLeaderboard(): Promise<LeaderboardResponse> {
  const response = await api.get<ApiResponse<LeaderboardResponse>>('/leaderboard');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch leaderboard');
  }
  return response.data.data;
}

// Agent API
export async function getAgent(agentId: string): Promise<AgentState> {
  const response = await api.get<ApiResponse<AgentState>>(`/agents/${agentId}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch agent');
  }
  return response.data.data;
}

export async function registerAgent(
  agentId: string,
  playerAddress: string,
  strategyType: StrategyType
): Promise<AgentState> {
  const response = await api.post<ApiResponse<AgentState>>('/agents', {
    agentId,
    playerAddress,
    strategyType,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to register agent');
  }
  return response.data.data;
}

// Tournament API
export async function getTournamentInfo(): Promise<TournamentInfo> {
  const response = await api.get<ApiResponse<TournamentInfo>>('/tournament');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch tournament info');
  }
  return response.data.data;
}

export async function startTournament(): Promise<void> {
  const response = await api.post<ApiResponse<null>>('/tournament/start');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to start tournament');
  }
}

export async function stopTournament(): Promise<void> {
  const response = await api.post<ApiResponse<null>>('/tournament/stop');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to stop tournament');
  }
}

// WebSocket connection
export function createWebSocket(): WebSocket {
  const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
  return new WebSocket(wsUrl);
}
