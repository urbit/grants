import { Proposal } from './proposal';
import { PROPOSAL_CATEGORY, RFP_STATUS } from 'api/constants';

export interface RFP {
  id: number;
  urlId: string;
  title: string;
  brief: string;
  content: string;
  category: PROPOSAL_CATEGORY;
  status: RFP_STATUS;
  acceptedProposals: Proposal[];
  bounty: number | null;
  matching: boolean;
  dateOpened: number;
  dateClosed?: number;
  dateCloses?: number;
}
