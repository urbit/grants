import React from 'react';
import { view } from 'react-easy-state';
import { Tag, Tooltip, List, Popconfirm, Spin, message } from 'antd';
import { Link } from 'react-router-dom';
import store from 'src/store';
import { RFW, RFW_WORKER_STATUS } from 'src/types';
import { RFW_STATUSES, getStatusById } from 'util/statuses';
import './RFWItem.less';

const STATE = {
  isDeleting: false,
};

type State = typeof STATE;

class RFWItemNaked extends React.Component<RFW, State> {
  state: State = {
    isDeleting: false,
  };
  render() {
    const rfw = this.props;
    const status = getStatusById(RFW_STATUSES, rfw.status);

    const pendingWorkers = rfw.workers.filter(
      x => x.status === RFW_WORKER_STATUS.REQUESTED,
    );
    const acceptedWorkers = rfw.workers.filter(
      x => x.status === RFW_WORKER_STATUS.ACCEPTED,
    );

    const actions = [
      <Link key="edit" to={`/bounties/${rfw.id}/edit`}>
        edit
      </Link>,
      <Popconfirm
        key="delete"
        title="Are you sure?"
        okText="Delete"
        okType="danger"
        onConfirm={() => this.deleteRFW(rfw.id)}
        placement="left"
      >
        <a>delete</a>
      </Popconfirm>,
    ];

    return (
      <Spin key={rfw.id} spinning={this.state.isDeleting}>
        <List.Item className="RFWItem" actions={actions}>
          <Link to={`/bounties/${rfw.id}`}>
            <h2>
              {rfw.title || '(no title)'}
              <Tooltip title={status.hint}>
                <Tag color={status.tagColor}>{status.tagDisplay}</Tag>
              </Tooltip>
            </h2>
            <p>
              {rfw.milestones.length} milestones
              {' · '}
              {pendingWorkers.length} worker requests
              {' · '}
              {acceptedWorkers.length} workers accepted
            </p>
            <p>{rfw.brief}</p>
          </Link>
        </List.Item>
      </Spin>
    );
  }

  private deleteRFW = (id: number) => {
    this.setState({ isDeleting: true }, async () => {
      await store.deleteRFW(id);
      if (store.rfwDeleted) {
        message.success('Successfully deleted', 2);
      } else {
        // only if there was an error, otherwise this component will unmount before this call
        this.setState({ isDeleting: false });
      }
    });
  };
}

const RFWItem = view(RFWItemNaked);
export default RFWItem;
