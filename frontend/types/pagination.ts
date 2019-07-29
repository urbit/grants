import { Proposal } from './proposal';
import {
  PROPOSAL_SORT,
  PROPOSAL_CATEGORY,
  PROPOSAL_STAGE,
  RFW_SORT,
} from 'api/constants';
import { RFW, RFW_STATUS } from '.';

export interface Page {
  page: number;
  pageSize: number;
  total: number;
  search: string;
  sort: string;
  filters: string[];
}

export interface ServerPage<T> extends Page {
  items: T[];
}

export type PageParams = Omit<Page, 'pageSize' | 'total'>;

export interface Loadable {
  hasFetched: boolean;
  isFetching: boolean;
  fetchError: null | string;
  fetchTime: number;
}

export type LoadablePage = Page & Loadable;

export interface ProposalPage extends Omit<Page, 'filters' | 'sort'> {
  items: Proposal[];
  sort: PROPOSAL_SORT;
  filters: {
    stage: PROPOSAL_STAGE[];
    category: PROPOSAL_CATEGORY[];
  };
}

export type LoadableProposalPage = ProposalPage & Loadable;
export type ProposalPageParams = Omit<ProposalPage, 'items' | 'pageSize' | 'total'>;

export interface RFWPage extends Omit<Page, 'filters' | 'sort'> {
  items: RFW[];
  sort: RFW_SORT;
  filters: {
    status: RFW_STATUS[];
    category: PROPOSAL_CATEGORY[];
    tags: number[];
  };
}

export type LoadableRFWPage = RFWPage & Loadable;
export type RFWPageParams = Omit<RFWPage, 'items' | 'pageSize' | 'total'>;

export interface Moreable<T> extends LoadablePage {
  pages: T[][]; // ex: Comment
  hasMore: boolean;
  parentId: null | number; // ex: proposalId, parentCommentId... (optional)
}
