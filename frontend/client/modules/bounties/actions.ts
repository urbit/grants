import types from './types';
import { getRFWs, getRFW, getRFWTags } from 'api/api';
import { Dispatch } from 'redux';
import { RFW, RFWPageParams } from 'types';
import { AppState } from 'store/reducers';
import { getRFWPageSettings } from './selectors';

type GetState = () => AppState;

// change page, sort, filter, search
export function setRFWPage(pageParams: Partial<RFWPageParams>) {
  return async (dispatch: Dispatch<any>, getState: GetState) => {
    // 1. set page changes on state
    await dispatch({
      type: types.SET_RFW_PAGE,
      payload: pageParams,
    });
    // 2. get full updated page settings
    const page = getRFWPageSettings(getState());
    // 3. fetch proposals list with new settings
    return dispatch({
      type: types.RFWS_DATA,
      payload: async () => {
        return (await getRFWs(page)).data;
      },
    });
  };
}

export function fetchRFWs() {
  return async (dispatch: Dispatch<any>, getState: GetState) => {
    const page = getRFWPageSettings(getState());
    return dispatch({
      type: types.RFWS_DATA,
      payload: async () => {
        return (await getRFWs(page)).data;
      },
    });
  };
}

export function fetchRFW(rfwId: RFW['id']) {
  return async (dispatch: Dispatch<any>) => {
    dispatch({
      type: types.RFW_DATA_PENDING,
      payload: { rfwId },
    });
    try {
      const rfw = (await getRFW(rfwId)).data;
      return dispatch({
        type: types.RFW_DATA_FULFILLED,
        payload: rfw,
      });
    } catch (error) {
      dispatch({
        type: types.RFW_DATA_REJECTED,
        payload: error,
      });
    }
  };
}

export function fetchTags() {
  return async (dispatch: Dispatch<any>) => {
    dispatch({
      type: types.RFW_FETCH_TAGS_PENDING,
    });
    try {
      const tags = (await getRFWTags()).data;
      return dispatch({
        type: types.RFW_FETCH_TAGS_FULFILLED,
        payload: tags,
      });
    } catch (err) {
      dispatch({
        type: types.RFW_FETCH_TAGS_REJECTED,
        payload: err,
      });
    }
  };
}
