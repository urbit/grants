import {
  PROPOSAL_STATUS,
  RFP_STATUS,
  RFW_STATUS,
  MILESTONE_STAGE,
  PROPOSAL_STAGE,
} from 'src/types';

export interface StatusSoT<E> {
  id: E;
  tagDisplay: string;
  tagColor: string;
  hint: string;
}

export const MILESTONE_STAGES: Array<StatusSoT<MILESTONE_STAGE>> = [
  {
    id: MILESTONE_STAGE.IDLE,
    tagDisplay: 'Idle',
    tagColor: '#e9c510',
    hint: 'Proposal has has an idle milestone.',
  },
  {
    id: MILESTONE_STAGE.REQUESTED,
    tagDisplay: 'Requested',
    tagColor: '#e9c510',
    hint: 'Proposal has has a milestone with a requested payout.',
  },
  {
    id: MILESTONE_STAGE.REJECTED,
    tagDisplay: 'Rejected',
    tagColor: '#e9c510',
    hint: 'Proposal has has a milestone with a rejected payout.',
  },
  {
    id: MILESTONE_STAGE.ACCEPTED,
    tagDisplay: 'Accepted',
    tagColor: '#e9c510',
    hint: 'Proposal has an accepted milestone, and awaits payment.',
  },
  {
    id: MILESTONE_STAGE.PAID,
    tagDisplay: 'Paid',
    tagColor: '#e9c510',
    hint: 'Proposal has a paid milestone.',
  },
];

export const PROPOSAL_STATUSES: Array<StatusSoT<PROPOSAL_STATUS>> = [
  {
    id: PROPOSAL_STATUS.APPROVED,
    tagDisplay: 'Approved',
    tagColor: '#afd500',
    hint: 'Proposal has been approved and is awaiting being published by user.',
  },
  {
    id: PROPOSAL_STATUS.DELETED,
    tagDisplay: 'Deleted',
    tagColor: '#bebebe',
    hint: 'Proposal has been deleted and is not visible on the platform.',
  },
  {
    id: PROPOSAL_STATUS.DRAFT,
    tagDisplay: 'Draft',
    tagColor: '#8d8d8d',
    hint: 'Proposal is being created by the user.',
  },
  {
    id: PROPOSAL_STATUS.LIVE,
    tagDisplay: 'Live',
    tagColor: '#108ee9',
    hint: 'Proposal is live on the platform.',
  },
  {
    id: PROPOSAL_STATUS.PENDING,
    tagDisplay: 'Awaiting Approval',
    tagColor: '#ffaa00',
    hint: 'User is waiting for admin to approve or reject this Proposal.',
  },
  {
    id: PROPOSAL_STATUS.REJECTED,
    tagDisplay: 'Approval Rejected',
    tagColor: '#eb4118',
    hint:
      'Admin has rejected this proposal. User may adjust it and resubmit for approval.',
  },
];

export const PROPOSAL_STAGES: Array<StatusSoT<PROPOSAL_STAGE>> = [
  {
    id: PROPOSAL_STAGE.PREVIEW,
    tagDisplay: 'Preview',
    tagColor: '#afd500',
    hint: 'Proposal is not yet published.',
  },
  {
    id: PROPOSAL_STAGE.FUNDING_REQUIRED,
    tagDisplay: 'Funding',
    tagColor: '#bebebe',
    hint: 'Proposal has been published but still needs funding.',
  },
  {
    id: PROPOSAL_STAGE.WIP,
    tagDisplay: 'WIP',
    tagColor: '#8d8d8d',
    hint: 'Proposal is fully funded and the work is being done.',
  },
  {
    id: PROPOSAL_STAGE.COMPLETED,
    tagDisplay: 'Completed',
    tagColor: '#108ee9',
    hint: 'Proposal was accepted, published, funded and all funds paid out.',
  },
  {
    id: PROPOSAL_STAGE.FAILED,
    tagDisplay: 'Failed',
    tagColor: '#eb4118',
    hint: 'Proposal failed to meet target and is currently refunding all contributors.',
  },
  {
    id: PROPOSAL_STAGE.CANCELED,
    tagDisplay: 'Canceled',
    tagColor: '#eb4118',
    hint:
      'Proposal was canceled by an admin and is currently refunding all contributors.',
  },
];

export const RFP_STATUSES: Array<StatusSoT<RFP_STATUS>> = [
  {
    id: RFP_STATUS.DRAFT,
    tagDisplay: 'Draft',
    tagColor: '#ffaa00',
    hint: 'RFP is currently being edited by admins and isn’t visible to users.',
  },
  {
    id: RFP_STATUS.LIVE,
    tagDisplay: 'Live',
    tagColor: '#108ee9',
    hint: 'RFP is live and users can submit proposals for it.',
  },
  {
    id: RFP_STATUS.CLOSED,
    tagDisplay: 'Closed',
    tagColor: '#eb4118',
    hint:
      'RFP has been closed to new submissions and will no longer be listed, but can still be viewed, and associated proposals will remain open.',
  },
];

export const RFW_STATUSES: Array<StatusSoT<RFW_STATUS>> = [
  {
    id: RFW_STATUS.DRAFT,
    tagDisplay: 'Draft',
    tagColor: '#ffaa00',
    hint: 'Bounty is currently being edited by admins and isn’t visible to users.',
  },
  {
    id: RFW_STATUS.LIVE,
    tagDisplay: 'Live',
    tagColor: '#108ee9',
    hint: 'Bounty is live and users can request to make claims for it.',
  },
  {
    id: RFW_STATUS.CLOSED,
    tagDisplay: 'Closed',
    tagColor: '#eb4118',
    hint:
      'Bounty has been closed to new claims and will no longer be listed, but can still be viewed.',
  },
];

export function getStatusById<E>(statuses: Array<StatusSoT<E>>, id: E) {
  const result = statuses.find(s => s.id === id);
  if (!result) {
    throw Error(`getStatusById: could not find status for '${id}'`);
  }
  return result;
}
