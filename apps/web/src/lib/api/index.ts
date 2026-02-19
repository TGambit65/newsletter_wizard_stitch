export { ApiError } from './core';
export * from './content';
export * from './voice';
export * from './newsletter';
export * from './account';
export * from './referral';
export * from './team';

import {
  processSource,
  ragSearch,
  generateContent,
  generateNewsletter,
  uploadDocument,
  generateSocialPosts,
} from './content';

import { trainVoice, previewVoice }  from './voice';
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

export const api = {
  processSource,
  ragSearch,
  generateContent,
  generateNewsletter,
  uploadDocument,
  generateSocialPosts,
  trainVoice,
  previewVoice,
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
};
