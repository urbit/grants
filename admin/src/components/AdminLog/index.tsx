import React from 'react';
import { view } from 'react-easy-state';
import store from 'src/store';
import Pageable from 'components/Pageable';
import LogItem from './LogItem';
import { AdminLog } from 'types';
import './index.less';

class AdminLogComponent extends React.Component {
  render() {
    const { page } = store.logs;
    // NOTE: sync with /backend ... pagination.py AdminLogPagination.SORT_MAP
    const sorts = ['DATE:DESC', 'DATE:ASC'];
    return (
      <Pageable
        className="AdminLog"
        page={page}
        filters={null}
        sorts={sorts}
        searchPlaceholder="Search by type, message, ip, or admin name / email"
        header={
          <div className="AdminLog-header">
            <div className="AdminLog-header-user">User</div>
            <div className="AdminLog-header-event">Event Type</div>
            <div className="AdminLog-header-message">Message</div>
            <div className="AdminLog-header-ip">IP Address</div>
          </div>
        }
        renderItem={(l: AdminLog) => <LogItem key={l.id} {...l} />}
        handleSearch={store.fetchLogs}
        handleChangeQuery={store.setLogsQuery}
        handleResetQuery={store.resetLogsQuery}
      />
    );
  }
}

export default view(AdminLogComponent);
