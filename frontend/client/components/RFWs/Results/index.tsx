import React from 'react';
import { AppState } from 'store/reducers';
import { Pagination } from 'antd';
import Loader from 'components/Loader';
import RFWItem from '../RFWItem';
import './index.less';

interface Props {
  page: AppState['rfw']['page'];
  onPageChange: (page: number) => void;
}

export default class RFWResults extends React.Component<Props, {}> {
  render() {
    const {
      items,
      fetchError,
      hasFetched,
      isFetching,
      page,
      total,
      pageSize,
      search,
    } = this.props.page;

    if (!hasFetched && isFetching) {
      return <Loader size="large" />;
    }

    if (fetchError) {
      return (
        <>
          <h2>Something went wrong</h2>
          <p>{fetchError}</p>
        </>
      );
    }

    return (
      <div className="RFWResults">
        {!!items.length && (
          <div className="RFWResults-results">
            {items.map(rfw => (
              <RFWItem key={rfw.id} rfw={rfw} />
            ))}
          </div>
        )}
        {!!items.length && (
          <div className="RFWResults-pagination">
            <Pagination
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={this.props.onPageChange}
              hideOnSinglePage={true}
            />
          </div>
        )}
        {!items.length && (
          <h2>No requests found {search && `for search term "${search}"`}</h2>
        )}
        {isFetching && <Loader overlay size="large" />}
      </div>
    );
  }
}
