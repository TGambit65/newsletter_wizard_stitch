import { callAuthEdgeFunction } from './core';

export interface ExportUserDataResponse {
  exported_at:       string;
  export_version:    string;
  profile:           Record<string, unknown>;
  tenant:            Record<string, unknown> | null;
  newsletters:       unknown[];
  newsletter_stats:  unknown[];
  knowledge_sources: unknown[];
  voice_profiles:    unknown[];
  api_keys:          unknown[];
  referral_codes:    unknown[];
  referrals:         unknown[];
  feedback:          unknown[];
}

export async function exportUserData(): Promise<ExportUserDataResponse> {
  return callAuthEdgeFunction<ExportUserDataResponse>('export-user-data', {});
}

export async function deleteAccount(body: {
  confirmation: string;
  reason?:      string;
  comment?:     string;
}): Promise<{ success: true }> {
  return callAuthEdgeFunction<{ success: true }>('delete-account', body);
}

export async function reactivateAccount(): Promise<{ success: boolean }> {
  return callAuthEdgeFunction('reactivate-account', {});
}

export async function createWorkspace(): Promise<{ success: boolean; already_exists: boolean }> {
  return callAuthEdgeFunction('create-workspace', {});
}
