// backend
export interface SocialMedia {
  url: string;
  service: string;
  username: string;
}

// NOTE: sync with backend/grant/utils/enums.py MilestoneStage
export enum MILESTONE_STAGE {
  IDLE = 'IDLE',
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  PAID = 'PAID',
}

export interface Milestone {
  id: number;
  index: number;
  content: string;
  rejectReason: string;
  dateCreated: number;
  dateEstimated: number;
  dateRequested: number;
  dateAccepted: number;
  dateRejected: number;
  datePaid: number;
  immediatePayout: boolean;
  payoutAmount: string;
  stage: string;
  title: string;
}

// NOTE: sync with backend/grant/utils/enums.py RFPStatus
export enum RFP_STATUS {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}

export interface RFP {
  id: number;
  dateCreated: number;
  dateOpened: number | null;
  dateClosed: number | null;
  title: string;
  brief: string;
  content: string;
  category: string;
  status: string;
  proposals: Proposal[];
  matching: boolean;
  bounty: string | null;
  dateCloses: number | null;
}

export interface RFPArgs {
  title: string;
  brief: string;
  content: string;
  category: string;
  matching: boolean;
  dateCloses: number | null | undefined;
  bounty: string | null | undefined;
  status: string;
}

// NOTE: sync with backend/grant/utils/enums.py ProposalStatus
export enum PROPOSAL_STATUS {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  LIVE = 'LIVE',
  DELETED = 'DELETED',
}

// NOTE: sync with backend/grant/utils/enums.py ProposalStage
export enum PROPOSAL_STAGE {
  PREVIEW = 'PREVIEW',
  FUNDING_REQUIRED = 'FUNDING_REQUIRED',
  WIP = 'WIP',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface Proposal {
  id: number;
  brief: string;
  status: PROPOSAL_STATUS;
  dateCreated: number;
  dateApproved: number;
  datePublished: number;
  isFailed: boolean;
  title: string;
  content: string;
  stage: PROPOSAL_STAGE;
  category: string;
  milestones: Milestone[];
  currentMilestone?: Milestone;
  team: User[];
  comments: Comment[];
  target: string;
  rejectReason: string;
  rfp?: RFP;
  private: boolean;
  followersCount: number;
}

export interface Comment {
  id: number;
  userId: User['id'];
  author?: User;
  proposalId: Proposal['id'];
  proposal?: Proposal;
  dateCreated: number;
  content: string;
  hidden: boolean;
  reported: boolean;
}

export interface CommentArgs {
  hidden: boolean;
  reported: boolean;
}

export interface User {
  id: number;
  avatar: null | { imageUrl: string };
  displayName: string;
  emailAddress: string;
  socialMedias: SocialMedia[];
  title: string;
  proposals: Proposal[];
  comments: Comment[];
  silenced: boolean;
  banned: boolean;
  bannedReason: string;
  isAdmin: boolean;
  azimuth: null | { point: string };
}

export interface HistoryEvent {
  id: number;
  title: string;
  titleRaw: string;
  content: string;
  contentRaw: string;
  date: number;
  user?: User;
  proposal?: Proposal;
}

export interface HistoryEventArgs {
  title: string;
  content: string;
  date: number | null | undefined;
  userId: number | null | undefined;
  proposalId: number | null | undefined;
}

export interface EmailExample {
  info: {
    subject: string;
    title: string;
    preview: string;
  };
  html: string;
  text: string;
}

export enum PROPOSAL_CATEGORY {
  DEV_TOOL = 'DEV_TOOL',
  CORE_DEV = 'CORE_DEV',
  APP_DEV_ARVO = 'APP_DEV_ARVO',
  APP_DEV_AZIMUTH = 'APP_DEV_AZIMUTH',
  APP_DEV_OTHER = 'APP_DEV_OTHER',
  COMMUNITY = 'COMMUNITY',
  DOCUMENTATION = 'DOCUMENTATION',
  SECURITY = 'SECURITY',
  DESIGN = 'DESIGN',
}

export interface PageQuery {
  page: number;
  filters: string[];
  search: string;
  sort: string;
}

export interface PageData<T> extends PageQuery {
  pageSize: number;
  total: number;
  items: T[];
  fetching: boolean;
  fetched: boolean;
}

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
  closed: boolean;
  claims: RFWMilestoneClaim[];
  rfw?: RFW;
  isAuthedActive: boolean;
  authedClaim?: RFWMilestoneClaim;
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
}

export interface RFW {
  id: number;
  dateCreated: number;
  title: string;
  brief: string;
  content: string;
  status: string;
  statusChangeDate: number;
  category: string;
  bounty: number;
  workers: RFWWorker[];
  tags: Tag[];
  milestones: RFWMilestone[];
}

export interface Tag {
  id: number;
  text: string;
  description: string;
  color: string;
}

export interface TagArgs {
  id?: number;
  text: string;
  description: string;
  color: string;
}

export interface AdminLog {
  id: number;
  dateCreated: number;
  event: string;
  message: string;
  ip: string;
  user?: User;
}
