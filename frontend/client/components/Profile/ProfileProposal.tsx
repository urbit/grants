import React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { UserProposal } from 'types';
import UserRow from 'components/UserRow';
import './ProfileProposal.less';

interface OwnProps {
  proposal: UserProposal;
}

export default class Profile extends React.Component<OwnProps> {
  render() {
    const { title, brief, team, id, target, datePublished } = this.props.proposal;
    return (
      <div className="ProfileProposal">
        <div className="ProfileProposal-block">
          <Link to={`/proposals/${id}`} className="ProfileProposal-title">
            {title}
          </Link>
          <div className="ProfileProposal-brief">{brief}</div>
          <div className="ProfileProposal-details">
            {/* TODO: adjust for just target/goal */}
            <div className="ProfileProposal-details-detail">{target} STARS</div>
            <div className="ProfileProposal-details-detail">
              {moment(datePublished * 1000).format('MMMM Do, YYYY')}
            </div>
          </div>
        </div>
        <div className="ProfileProposal-block">
          <h3 className="ProfileProposal-block-title">Team</h3>
          <div className="ProfileProposal-block-team">
            {team.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
