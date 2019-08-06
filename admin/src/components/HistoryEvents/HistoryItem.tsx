import React from 'react';
import { view } from 'react-easy-state';
import { Link } from 'react-router-dom';
import { List, Popconfirm } from 'antd';
import { HistoryEvent } from 'types';
import { formatDateDay } from 'util/time';
import Markdown from 'components/Markdown';
import UserAvatar from 'components/UserAvatar';
import store from 'src/store';
import './HistoryItem.less';

class HistoryItem extends React.Component<HistoryEvent> {
  render() {
    const p = this.props;

    const actions = [
      <Link key="edit" to={`/history/${p.id}/edit`}>
        edit
      </Link>,
      <Popconfirm key="delete" title="Are you sure?" onConfirm={this.delete}>
        <a>delete</a>
      </Popconfirm>,
    ];

    return (
      <List.Item className="HistoryItem" key={p.id} actions={actions}>
        <List.Item.Meta
          avatar={<UserAvatar shape="square" icon="user" size={48} user={p.user} />}
          title={p.title}
          description={
            <>
              <Markdown source={p.content} reduced />
              <small className="HistoryItem-date">{formatDateDay(p.date)}</small>
            </>
          }
        />
      </List.Item>
    );
  }

  private delete = () => {
    store.deleteHistoryEvent(this.props.id);
  };
}

export default view(HistoryItem);
