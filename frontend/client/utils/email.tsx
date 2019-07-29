import {
  EmailSubscriptions,
  EmailSubscriptionInfo,
  EmailSubscriptionCategoryInfo,
  EMAIL_SUBSCRIPTION_CATEGORY,
} from 'types';

type ESKey = keyof EmailSubscriptions;
export const EMAIL_SUBSCRIPTIONS: { [key in ESKey]: EmailSubscriptionInfo } = {
  // GENERAL
  myCommentReply: {
    description: 'your comment responses',
    category: EMAIL_SUBSCRIPTION_CATEGORY.GENERAL,
    value: false,
  },
  followedProposal: {
    description: 'followed proposals',
    category: EMAIL_SUBSCRIPTION_CATEGORY.GENERAL,
    value: false,
  },
  workReview: {
    description: 'work and claims',
    category: EMAIL_SUBSCRIPTION_CATEGORY.GENERAL,
    value: false,
  },

  // MY PROPOSAL
  myProposalApproval: {
    description: 'is approved or rejected',
    category: EMAIL_SUBSCRIPTION_CATEGORY.PROPOSAL,
    value: false,
  },
  myProposalComment: {
    description: 'is commented on',
    category: EMAIL_SUBSCRIPTION_CATEGORY.PROPOSAL,
    value: false,
  },

  // ADMIN
  adminApproval: {
    description: 'proposal needs review',
    category: EMAIL_SUBSCRIPTION_CATEGORY.ADMIN,
    value: false,
  },
  adminPayout: {
    description: 'milestone needs review',
    category: EMAIL_SUBSCRIPTION_CATEGORY.ADMIN,
    value: false,
  },
  adminWorkReview: {
    description: 'worker needs review',
    category: EMAIL_SUBSCRIPTION_CATEGORY.ADMIN,
    value: false,
  },
  adminWorkMilestoneReview: {
    description: 'work claim needs review',
    category: EMAIL_SUBSCRIPTION_CATEGORY.ADMIN,
    value: false,
  },
};

export const EMAIL_SUBSCRIPTION_CATEGORIES: {
  [key in EMAIL_SUBSCRIPTION_CATEGORY]: EmailSubscriptionCategoryInfo
} = {
  [EMAIL_SUBSCRIPTION_CATEGORY.GENERAL]: { description: 'General' },
  [EMAIL_SUBSCRIPTION_CATEGORY.PROPOSAL]: { description: 'Your Proposal' },
  [EMAIL_SUBSCRIPTION_CATEGORY.ADMIN]: { description: 'Admin' },
};

export const groupEmailSubscriptionsByCategory = (
  es: EmailSubscriptions,
  withAdmin: boolean,
) => {
  const catsForUser = { ...EMAIL_SUBSCRIPTION_CATEGORIES };
  if (!withAdmin) {
    delete catsForUser.ADMIN;
  }
  return Object.entries(catsForUser).map(([k, v]) => {
    const subscriptionSettings = Object.entries(EMAIL_SUBSCRIPTIONS)
      .filter(([_, sv]) => sv.category === k)
      .map(([sk, sv]) => {
        sv.value = es[sk as ESKey];
        const svWk = sv as EmailSubscriptionInfo & { key: ESKey };
        svWk.key = sk as ESKey;
        return svWk;
      });

    const vWk = v as EmailSubscriptionCategoryInfo & { key: EMAIL_SUBSCRIPTION_CATEGORY };
    vWk.key = k as EMAIL_SUBSCRIPTION_CATEGORY;
    return {
      category: vWk,
      subscriptionSettings,
    };
  });
};
