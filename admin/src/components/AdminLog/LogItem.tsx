import React from 'react';
import { List } from 'antd';
import { AdminLog } from 'types';
import { formatDateSeconds } from 'util/time';
import './LogItem.less';
import { Link } from 'react-router-dom';
import UserAvatar from 'components/UserAvatar';

export default class LogItem extends React.Component<AdminLog> {
  render() {
    const p = this.props;

    return (
      <List.Item className="LogItem" key={p.id}>
        <List.Item.Meta
          className="LogItem-user"
          avatar={<UserAvatar shape="square" icon="user" size={42} user={p.user} />}
          title={
            p.user ? (
              <Link to={`/users/${p.user.id}`}>{p.user.displayName}</Link>
            ) : (
              'Unauthenticated user'
            )
          }
          description={<small>{formatDateSeconds(p.dateCreated)}</small>}
        />
        <div className="LogItem-event">
          <code>{p.event}</code>
        </div>
        <div className="LogItem-message">{p.message}</div>
        <div className="LogItem-ip">
          <code>{p.ip}</code>
        </div>
      </List.Item>
    );
  }
}
