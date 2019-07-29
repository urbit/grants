import { AppState } from 'store/reducers';
import { Proposal, ProposalUpdates, ProposalPageParams, PageParams } from 'types';

export function getProposalUpdates(
  state: AppState,
  proposalId: Proposal['id'],
): ProposalUpdates['updates'] | null {
  const pu = state.proposal.proposalUpdates[proposalId];
  return pu ? pu.updates : null;
}

export function getProposalUpdateCount(
  state: AppState,
  proposalId: Proposal['id'],
): number | null {
  const pu = state.proposal.proposalUpdates[proposalId];
  return pu ? pu.updates.length : null;
}

export function getIsFetchingUpdates(state: AppState) {
  return state.proposal.isFetchingUpdates;
}

export function getUpdatesError(state: AppState) {
  return state.proposal.updatesError;
}

export function getProposalPageSettings(state: AppState): ProposalPageParams {
  const { page, search, sort, filters } = state.proposal.page;
  return {
    page,
    search,
    sort,
    filters,
  };
}

export function getProposalCommentPageParams(state: AppState): PageParams {
  const { page, search, sort, filters } = state.proposal.detailComments;
  return {
    page,
    search,
    sort,
    filters,
  };
}
