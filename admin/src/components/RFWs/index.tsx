import React from 'react';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { view } from 'react-easy-state';
import store from 'src/store';
import RFWItem from './RFWItem';
import Pageable from 'components/Pageable';
import { RFW } from 'src/types';
import { rfwFilters } from 'util/filters';

class RFWs extends React.Component<{}> {
  render() {
    const { page } = store.rfws;
    // NOTE: sync with /backend ... pagination.py RFWPagination.SORT_MAP
    const sorts = ['CREATED:DESC', 'CREATED:ASC'];
    return (
      <Pageable
        page={page}
        filters={rfwFilters}
        sorts={sorts}
        searchPlaceholder="Search bounty titles"
        renderItem={(p: RFW) => <RFWItem key={p.id} {...p} />}
        handleSearch={store.fetchRFWs}
        handleChangeQuery={store.setRFWPageQuery}
        handleResetQuery={store.resetRFWPageQuery}
        controlsExtra={
          <>
            <Link to="/rfws/new">
              <Button icon="plus">New Bounty</Button>
            </Link>
          </>
        }
      />
    );
  }
}

export default view(RFWs);
