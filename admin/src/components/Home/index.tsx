import React from 'react';
import { Divider, Icon } from 'antd';
import { view } from 'react-easy-state';
import store from '../../store';
import './index.less';
import { Link } from 'react-router-dom';

class Home extends React.Component {
  componentDidMount() {
    store.fetchStats();
  }

  render() {
    const {
      userCount,
      proposalCount,
      proposalPendingCount,
      proposalMilestonePayoutsCount,
      rfwMilestoneClaimCount,
      rfwWorkerRequestCount,
    } = store.stats;

    const actionItems = [
      !!proposalPendingCount && (
        <div>
          <Icon type="exclamation-circle" /> There are <b>{proposalPendingCount}</b>{' '}
          proposals <b>waiting for review</b>.{' '}
          <Link to="/proposals?filters[]=STATUS_PENDING">Click here</Link> to view them.
        </div>
      ),
      !!proposalMilestonePayoutsCount && (
        <div>
          <Icon type="exclamation-circle" /> There are{' '}
          <b>{proposalMilestonePayoutsCount}</b> proposals{' '}
          <b>awaiting milestone review</b>.{' '}
          <Link to="/proposals?filters[]=MILESTONE_REQUESTED">Click here</Link> to view
          them.
        </div>
      ),
      !!rfwWorkerRequestCount && (
        <div>
          <Icon type="exclamation-circle" /> There are <b>{rfwWorkerRequestCount}</b> bounties{' '}
          <b>awaiting worker review</b>.{' '}
          <Link to="/rfws?filters[]=WORKERS">Click here</Link> to view them.
        </div>
      ),
      !!rfwMilestoneClaimCount && (
        <div>
          <Icon type="exclamation-circle" /> There are <b>{rfwMilestoneClaimCount}</b>{' '}
          bounties <b>awaiting milestone claim review</b>.{' '}
          <Link to="/rfws?filters[]=CLAIMS">Click here</Link> to view them.
        </div>
      ),
    ].filter(Boolean);

    return (
      <div className="Home">
        {!!actionItems.length && (
          <div className="Home-actionItems">
            <Divider orientation="left">Action Items</Divider>
            {actionItems.map((ai, i) => (
              <div key={i}>{ai}</div>
            ))}
          </div>
        )}

        <Divider orientation="left">Stats</Divider>
        <div>user count: {userCount}</div>
        <div>proposal count: {proposalCount}</div>
      </div>
    );
  }
}

export default view(Home);
