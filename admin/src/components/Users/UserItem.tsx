import React, { ReactNode } from 'react';
import { view } from 'react-easy-state';
import { List } from 'antd';
import { Link } from 'react-router-dom';
import { User } from 'src/types';
import UserAvatar from 'components/UserAvatar';

class UserItemNaked extends React.Component<User> {
  render() {
    const p = this.props;
    const actions = [] as ReactNode[];

    return (
      <List.Item key={p.id} className="UserItem" actions={actions}>
        <Link to={`/users/${p.id}`} key="view">
          <List.Item.Meta
            avatar={<UserAvatar shape="square" icon="user" size={48} user={p} />}
            title={p.displayName}
            description={p.emailAddress}
          />
        </Link>
      </List.Item>
    );
  }
}

const UserItem = view(UserItemNaked);
export default UserItem;
