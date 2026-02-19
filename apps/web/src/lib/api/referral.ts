import { callAuthEdgeFunction } from './core';

export interface ReferralCodeResponse {
  code: string;
  link: string;
}

export interface ReferralStatsResponse {
  sent:      number;
  converted: number;
  earned:    string;
}

export interface LeaderboardEntry {
  rank:      number;
  name:      string;
  referrals: number;
}

export async function getReferralCode(): Promise<ReferralCodeResponse> {
  return callAuthEdgeFunction<ReferralCodeResponse>('manage-referrals', { action: 'get_code' });
}

export async function getReferralStats(): Promise<ReferralStatsResponse> {
  return callAuthEdgeFunction<ReferralStatsResponse>('manage-referrals', { action: 'get_stats' });
}

export async function sendReferralInvite(email: string): Promise<{ success: boolean; already_invited: boolean }> {
  return callAuthEdgeFunction('manage-referrals', { action: 'send_invite', email });
}

export async function getReferralLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return callAuthEdgeFunction('manage-referrals', { action: 'get_leaderboard' });
}
