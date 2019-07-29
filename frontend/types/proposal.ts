import { PROPOSAL_CATEGORY, PROPOSAL_STAGE } from 'api/constants';
import { CreateMilestone, Update, User, Comment } from 'types';
import { ProposalMilestone } from './milestone';
import { RFP } from './rfp';

export interface TeamInvite {
  id: number;
  dateCreated: number;
  address: string;
  accepted: boolean | null;
}

export interface ProposalDraft {
  id: number;
  dateCreated: number;
  title: string;
  brief: string;
  category: PROPOSAL_CATEGORY;
  content: string;
  target: string;
  milestones: CreateMilestone[];
  team: User[];
  invites: TeamInvite[];
  stage: PROPOSAL_STAGE;
  status: STATUS;
  rfp?: RFP;
}

export interface Proposal extends Omit<ProposalDraft, 'target' | 'invites'> {
  urlId: string;
  target: number;
  milestones: ProposalMilestone[];
  currentMilestone?: ProposalMilestone;
  datePublished: number | null;
  dateApproved: number | null;
  isTeamMember?: boolean; // FE derived
  private: boolean;
  authedFollows: boolean;
  followersCount: number;
  commentsCount: number;
}

export interface TeamInviteWithProposal extends TeamInvite {
  proposal: Proposal;
}

export interface ProposalComments {
  proposalId: Proposal['id'];
  totalComments: number;
  comments: Comment[];
}

export interface ProposalUpdates {
  proposalId: Proposal['id'];
  updates: Update[];
}

export interface UserProposal {
  id: Proposal['id'];
  status: STATUS;
  title: string;
  brief: string;
  target: number;
  dateCreated: number;
  dateApproved: number;
  datePublished: number;
  team: User[];
  rejectReason: string;
}

// NOTE: sync with backend/grant/proposal/models.py STATUSES
export enum STATUS {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  LIVE = 'LIVE',
  DELETED = 'DELETED',
}
