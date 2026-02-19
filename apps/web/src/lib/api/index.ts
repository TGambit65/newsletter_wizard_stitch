export { ApiError } from './core';
export * from './content';
export * from './voice';
export * from './newsletter';
export * from './account';
export * from './referral';
export * from './team';
export * from './analytics';
export * from './search';

import {
  processSource,
  ragSearch,
  generateContent,
  generateNewsletter,
  uploadDocument,
  generateSocialPosts,
} from './content';

import { trainVoice, previewVoice, generateStyleGuide } from './voice';
import { sendMailchimp, sendConvertKit } from './newsletter';
import { exportUserData, deleteAccount, reactivateAccount, createWorkspace } from './account';
import {
  getReferralCode,
  getReferralStats,
  sendReferralInvite,
  getReferralLeaderboard,
} from './referral';

import {
  inviteTeamMember,
  getTeamInvitations,
  revokeInvitation,
  changeTeamMemberRole,
  validateInvitation,
  acceptInvitation,
} from './team';

import {
  generatePerformanceTips,
  exportPerformanceReport,
  suggestSendTime,
} from './analytics';

import { globalSearch } from './search';

// Also export remix-social-post wrapper (no auth, takes tenant_id in body)
import { callEdgeFunction } from './core';
export async function remixSocialPost(params: {
  content:         string;
  target_platform: string;
  tenant_id:       string;
}): Promise<{ remixed_content: string; platform: string }> {
  return callEdgeFunction('remix-social-post', params);
}

// Also export newsletter quality checker wrapper
import { callAuthEdgeFunction } from './core';
export async function checkNewsletterQuality(params: {
  content_html:  string;
  subject_line?: string;
}): Promise<{
  readability_score: number;
  spam_score:        number;
  spam_words_found:  string[];
  missing_alt_text:  string[];
  links_found:       string[];
  subject_length_ok: boolean;
  subject_length:    number;
  overall_score:     number;
  overall_grade:     string;
}> {
  return callAuthEdgeFunction('check-newsletter-quality', params);
}

export const api = {
  processSource,
  ragSearch,
  generateContent,
  generateNewsletter,
  uploadDocument,
  generateSocialPosts,
  trainVoice,
  previewVoice,
  generateStyleGuide,
  sendMailchimp,
  sendConvertKit,
  exportUserData,
  deleteAccount,
  reactivateAccount,
  createWorkspace,
  getReferralCode,
  getReferralStats,
  sendReferralInvite,
  getReferralLeaderboard,
  inviteTeamMember,
  getTeamInvitations,
  revokeInvitation,
  changeTeamMemberRole,
  validateInvitation,
  acceptInvitation,
  generatePerformanceTips,
  exportPerformanceReport,
  suggestSendTime,
  globalSearch,
  remixSocialPost,
  checkNewsletterQuality,
};
