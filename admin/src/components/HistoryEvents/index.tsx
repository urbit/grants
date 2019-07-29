import React from 'react';
import { view } from 'react-easy-state';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import store from 'src/store';
import HistoryItem from './HistoryItem';
import Pageable from 'components/Pageable';
import { HistoryEvent } from 'src/types';

class HistoryEvents extends React.Component<{}> {
  render() {
    const { page } = store.history;
    // NOTE: sync with /backend ... pagination.py HistoryPagination.SORT_MAP
    const sorts = ['DATE:DESC', 'DATE:ASC'];
    return (
      <Pageable
        page={page}
        filters={null}
        sorts={sorts}
        searchPlaceholder="Search history events"
        renderItem={(h: HistoryEvent) => <HistoryItem key={h.id} {...h} />}
        handleSearch={store.fetchHistory}
        handleChangeQuery={store.setHistoryPageQuery}
        handleResetQuery={store.resetHistoryPageQuery}
        controlsExtra={
          <Link to="/history/new">
            <Button icon="plus">Add to History</Button>
          </Link>
        }
      />
    );
  }
}

export default view(HistoryEvents);
