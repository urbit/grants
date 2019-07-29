import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from 'components/UserAvatar';
import { User } from 'types';
import './index.less';

interface Info {
  title: React.ReactNode;
  content: React.ReactNode;
}

interface Props {
  to: string;
  title: React.ReactNode;
  content: React.ReactNode;
  users?: User[];
  infos?: Info[];
}

export default class ResultItem extends React.PureComponent<Props> {
  render() {
    const { to, title, content, users, infos } = this.props;
    const user = users && !!users.length && users[0];
    return (
      <Link to={to}>
        <div className="ResultItem">
          <div className="ResultItem-title">{title}</div>
          <div className="ResultItem-content">{content}</div>
          {user && (
            <div className="ResultItem-user">
              <div className="ResultItem-user-avatar">
                <UserAvatar user={user} />
              </div>
              <div className="ResultItem-user-name">
                {user.displayName}
                {users!.length > 1 && <small>+{users!.length - 1} other</small>}
              </div>
            </div>
          )}
          {infos && (
            <div className="ResultItem-lower">
              {infos.map((info, idx) => (
                <div key={idx} className="ResultItem-lower-info">
                  <div className="ResultItem-lower-info-title">{info.title}</div>
                  <div className="ResultItem-lower-info-content">{info.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }
}
