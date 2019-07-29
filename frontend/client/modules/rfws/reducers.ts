import types from './types';
import { LoadableRFWPage, RFW, Tag } from 'types';
import { RFW_SORT } from 'api/constants';

export interface RFWDetail extends RFW {
  isRequestingClaim: boolean;
  requestClaimError: string;
  isRejectingClaim: boolean;
  rejectClaimError: string;
  isAcceptingClaim: boolean;
  acceptClaimError: string;
}

export interface RFWState {
  page: LoadableRFWPage;

  tags: Tag[];
  isFetchingTags: boolean;

  detail: null | RFWDetail;
  isFetchingDetail: boolean;
  detailError: null | string;
}

export const RFW_DETAIL_INITIAL_STATE = {
  isRequestingClaim: false,
  requestClaimError: '',
  isRejectingClaim: false,
  rejectClaimError: '',
  isAcceptingClaim: false,
  acceptClaimError: '',
};

export const INITIAL_STATE: RFWState = {
  page: {
    page: 1,
    pageSize: 0,
    total: 0,
    search: '',
    sort: RFW_SORT.NEWEST,
    filters: {
      category: [],
      status: [],
      tags: [],
    },
    items: [],
    hasFetched: false,
    isFetching: false,
    fetchError: null,
    fetchTime: 0,
  },

  tags: [],
  isFetchingTags: false,

  detail: null,
  isFetchingDetail: false,
  detailError: null,
};

export default (state = INITIAL_STATE, action: any) => {
  const { payload } = action;
  switch (action.type) {
    case types.SET_RFW_PAGE:
      return {
        ...state,
        page: {
          ...state.page,
          ...payload,
          page: payload.page || 1, // reset page to 1 for non-page changes
        },
      };
    case types.RFWS_DATA_PENDING:
      return {
        ...state,
        page: {
          ...state.page,
          isFetching: true,
          fetchError: null,
        },
      };
    case types.RFWS_DATA_FULFILLED:
      return {
        ...state,
        page: {
          ...payload,
          isFetching: false,
          hasFetched: true,
          fetchTime: Date.now(),
        },
      };
    case types.RFWS_DATA_REJECTED:
      return {
        ...state,
        page: {
          ...state.page,
          isFetching: false,
          hasFetched: false,
          fetchError: (payload && payload.message) || payload.toString(),
        },
      };

    case types.RFW_DATA_PENDING:
      // check if this proposal is in the page list, and optimistically set it
      const loadedInPage = state.page.items.find(p => p.id === payload.rfwId);
      return {
        ...state,
        detail:
          // if requesting same proposal, leave the detail object
          state.detail && state.detail.id === payload.rfwId
            ? state.detail
            : { ...loadedInPage, ...RFW_DETAIL_INITIAL_STATE } || null,
        isFetchingDetail: true,
        detailError: null,
      };
    case types.RFW_DATA_FULFILLED:
      return {
        ...state,
        detail: { ...payload, ...RFW_DETAIL_INITIAL_STATE },
        isFetchingDetail: false,
      };
    case types.RFW_DATA_REJECTED:
      return {
        ...state,
        detail: null,
        isFetchingDetail: false,
        detailError: (payload && payload.message) || payload.toString(),
      };

    case types.RFW_FETCH_TAGS_PENDING:
      return {
        ...state,
        isFetchingTags: true,
      };
    case types.RFW_FETCH_TAGS_FULFILLED:
      return {
        ...state,
        tags: payload,
        isFetchingTags: false,
      };
    case types.RFW_FETCH_TAGS_REJECTED:
      return {
        ...state,
        isFetchingTags: false,
      };

    default:
      return state;
  }
};
