// NOTE: sync with /backend/grant/email/subscription_settings.py EmailSubscription enum keys
export interface EmailSubscriptions {
  myCommentReply: boolean;
  myProposalApproval: boolean;
  myProposalComment: boolean;
  followedProposal: boolean;
  workReview: boolean;
  adminWorkReview: boolean;
  adminWorkMilestoneReview: boolean;
  adminApproval: boolean;
  adminPayout: boolean;
}

export enum EMAIL_SUBSCRIPTION_CATEGORY {
  GENERAL = 'GENERAL',
  PROPOSAL = 'PROPOSAL',
  ADMIN = 'ADMIN',
}

export interface EmailSubscriptionInfo {
  description: string;
  category: EMAIL_SUBSCRIPTION_CATEGORY;
  value: boolean;
}

export interface EmailSubscriptionCategoryInfo {
  description: string;
}
