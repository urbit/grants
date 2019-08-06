import { AppState } from 'store/reducers';
import { RFWPageParams } from 'types';

export function getRFWPageSettings(state: AppState): RFWPageParams {
  const { page, search, sort, filters } = state.rfw.page;
  return {
    page,
    search,
    sort,
    filters,
  };
}
