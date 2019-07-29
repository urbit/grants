import { PROPOSAL_CATEGORY } from 'api/constants';
import { User, Tag } from 'types';

// NOTE: sync with backend/grant/utils/enums.py RFWStatus
export enum RFW_STATUS {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}

export enum RFW_WORKER_STATUS {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum RFW_MILESTONE_CLAIM_STAGE {
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
}

export interface RFWMilestoneClaim {
  id: number;
  dateCreated: number;
  stage: RFW_MILESTONE_CLAIM_STAGE;
  stageMessage: string;
  stageUrl: string;
  stageChangeDate: number;
  worker?: RFWWorker;
  milestone?: RFWMilestone;
}

export interface RFWMilestone {
  id: number;
  index: number;
  dateCreated: number;
  title: string;
  content: string;
  effortFrom: number;
  effortTo: number;
  bounty: number;
  claims: RFWMilestoneClaim[];
  authedClaim: RFWMilestoneClaim;
  isAuthedActive: boolean;
  rfw?: RFW;
}

export interface RFWWorker {
  id: number;
  dateCreated: number;
  status: RFW_WORKER_STATUS;
  statusMessage: string;
  statusChangeDate: number;
  claims: RFWMilestoneClaim[];
  rfw?: RFW;
  user?: User;
  isSelf: boolean;
}
export type UserRFWWorker = Omit<RFWWorker, 'rfw'> & { rfw: RFW };
export type RfwRFWWorker = Omit<RFWWorker, 'user'> & { user: User };

export interface RFW {
  urlId: string;
  id: number;
  dateCreated: number;
  title: string;
  brief: string;
  content: string;
  status: string;
  statusChangeDate: number;
  category: PROPOSAL_CATEGORY;
  bounty: number;
  effortFrom: number;
  effortTo: number;
  workers: RFWWorker[];
  authedWorker?: RFWWorker;
  tags: Tag[];
  milestones: RFWMilestone[];
}
