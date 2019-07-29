import moment from 'moment';
import { ProposalDraft, STATUS, MILESTONE_STAGE, CreateMilestone } from 'types';
import { User } from 'types';
import { getAmountError } from 'utils/validators';
import { PROPOSAL_CATEGORY, PROPOSAL_STAGE } from 'api/constants';
import {
  ProposalDetail,
  PROPOSAL_DETAIL_INITIAL_STATE,
} from 'modules/proposals/reducers';

interface CreateFormErrors {
  title?: string;
  brief?: string;
  category?: string;
  target?: string;
  team?: string[];
  content?: string;
  milestones?: string[];
}

export type KeyOfForm = keyof CreateFormErrors;
export const FIELD_NAME_MAP: { [key in KeyOfForm]: string } = {
  title: 'Title',
  brief: 'Brief',
  category: 'Category',
  target: 'Target amount',
  team: 'Team',
  content: 'Details',
  milestones: 'Milestones',
};

const requiredFields: KeyOfForm[] = ['title', 'brief', 'category', 'target', 'content'];

export function getCreateErrors(
  form: Partial<ProposalDraft>,
  skipRequired?: boolean,
): CreateFormErrors {
  const errors: CreateFormErrors = {};
  const { title, content, team, milestones, target, brief } = form;

  // Required fields with no extra validation
  if (!skipRequired) {
    for (const key of requiredFields) {
      if (!form[key as KeyOfForm]) {
        errors[key as KeyOfForm] = `${FIELD_NAME_MAP[key as KeyOfForm]} is required`;
      }
    }

    if (!milestones || !milestones.length) {
      errors.milestones = ['Must have at least one milestone'];
    }
    if (!team || !team.length) {
      errors.team = ['Must have at least one team member'];
    }
  }

  // Title
  if (title && title.length > 60) {
    errors.title = 'Title can only be 60 characters maximum';
  }

  // Brief
  if (brief && brief.length > 140) {
    errors.brief = 'Brief can only be 140 characters maximum';
  }

  // Content limit for our database's sake
  if (content && content.length > 250000) {
    errors.content = 'Details can only be 250,000 characters maximum';
  }

  // Amount to raise
  const targetFloat = target ? parseFloat(target) : 0;
  if (target && !Number.isNaN(targetFloat)) {
    const limit = parseFloat(process.env.PROPOSAL_TARGET_MAX as string);
    const targetErr = getAmountError(targetFloat, limit, 1);
    if (targetErr) {
      errors.target = targetErr;
    }
  }

  // Milestones
  if (milestones) {
    let cumulativePayout = 0;
    let lastMsEst: CreateMilestone['dateEstimated'] = 0;
    const milestoneErrors = milestones.map((ms, idx) => {
      // check payout first so we collect the cumulativePayout even if other fields are invalid
      if (!ms.payoutAmount) {
        return 'Payout is required';
      } else if (Number.isNaN(parseInt(ms.payoutAmount, 10))) {
        return 'Payout must be a valid number';
      } else if (parseInt(ms.payoutAmount, 10) !== parseFloat(ms.payoutAmount)) {
        return 'Payout must be a whole number, no decimals';
      } else if (parseInt(ms.payoutAmount, 10) <= 0) {
        return 'Payout must be greater than 0';
      }

      // Last one shows percentage errors
      cumulativePayout += parseFloat(ms.payoutAmount);

      if (!ms.title) {
        return 'Title is required';
      } else if (ms.title.length > 40) {
        return 'Title length can only be 40 characters maximum';
      }

      if (!ms.content) {
        return 'Description is required';
      } else if (ms.content.length > 200) {
        return 'Description can only be 200 characters maximum';
      }

      if (!ms.dateEstimated) {
        return 'Estimate date is required';
      } else {
        if (
          ms.dateEstimated <
          moment(Date.now())
            .startOf('month')
            .unix()
        ) {
          return 'Estimate date should be in the future';
        }
        if (ms.dateEstimated <= lastMsEst) {
          return 'Estimate date should be later than previous estimate date';
        }
        lastMsEst = ms.dateEstimated;
      }

      if (
        idx === milestones.length - 1 &&
        cumulativePayout !== targetFloat &&
        !Number.isNaN(cumulativePayout)
      ) {
        return `Payouts don’t add up to proposal target of ${target} (currently ${cumulativePayout})`;
      }
      return '';
    });
    if (milestoneErrors.find(err => !!err)) {
      errors.milestones = milestoneErrors;
    }
  }
  return errors;
}

export function validateUserProfile(user: User) {
  if (user.displayName.length > 50) {
    return 'Display name can only be 50 characters maximum';
  } else if (user.title.length > 50) {
    return 'Title can only be 50 characters maximum';
  }

  return '';
}

export function getCreateWarnings(form: Partial<ProposalDraft>): string[] {
  const warnings = [];

  // Warn about pending invites
  const hasPending =
    (form.invites || []).filter(inv => inv.accepted === null).length !== 0;
  if (hasPending) {
    warnings.push(`
      You still have pending team invitations. If you publish before they
      are accepted, your team will be locked in and they won’t be able to
      join.
    `);
  }

  return warnings;
}

// This is kind of a disgusting function, sorry.
export function makeProposalPreviewFromDraft(draft: ProposalDraft): ProposalDetail {
  const { invites, ...rest } = draft;

  return {
    ...rest,
    id: 0,
    status: STATUS.DRAFT,
    urlId: '0-title',
    dateCreated: Date.now() / 1000,
    datePublished: Date.now() / 1000,
    dateApproved: Date.now() / 1000,
    target: parseFloat(draft.target),
    stage: PROPOSAL_STAGE.PREVIEW,
    category: draft.category || PROPOSAL_CATEGORY.CORE_DEV,
    private: false,
    authedFollows: false,
    followersCount: 0,
    commentsCount: 0,
    milestones: draft.milestones.map((m, idx) => ({
      id: idx,
      index: idx,
      title: m.title,
      content: m.content,
      amount: parseFloat(m.payoutAmount),
      dateEstimated: m.dateEstimated,
      immediatePayout: m.immediatePayout,
      payoutAmount: m.payoutAmount,
      stage: MILESTONE_STAGE.IDLE,
    })),
    ...PROPOSAL_DETAIL_INITIAL_STATE,
  };
}
