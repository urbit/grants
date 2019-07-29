import React from 'react';
import { message } from 'antd';
import Loader from 'components/Loader';
import Placeholder from 'components/Placeholder';
import { ProposalDetail } from 'modules/proposals/reducers';
import Milestone from './Milestone';
import MilestoneAction from './MilestoneAction';
import './index.less';

interface Props {
  proposal: ProposalDetail;
}

interface State {
  activeMilestoneIdx: number;
  showRejectModal: boolean;
  rejectReason: string;
  rejectMilestoneId: number;
}

export default class ProposalMilestones extends React.Component<Props, State> {
  state: State = {
    activeMilestoneIdx: 0,
    showRejectModal: false,
    rejectReason: '',
    rejectMilestoneId: -1,
  };

  componentDidUpdate(prevProps: Props) {
    const { requestPayoutError, isRequestingPayout } = this.props.proposal;

    if (!prevProps.proposal.requestPayoutError && requestPayoutError) {
      message.error(requestPayoutError);
    }
    if (
      prevProps.proposal.isRequestingPayout &&
      !isRequestingPayout &&
      !requestPayoutError
    ) {
      message.success('Payout requested');
    }
  }

  render() {
    const { proposal } = this.props;
    if (!proposal) {
      return <Loader />;
    }

    return (
      <div className="ProposalMilestones">
        <MilestoneAction proposal={proposal} />
        {proposal.milestones.map(ms => (
          <Milestone key={ms.id} proposal={proposal} milestone={ms} />
        ))}
        {!proposal.milestones.length && (
          <Placeholder
            title="No milestones"
            subtitle="The creator of this proposal has not setup any milestones"
          />
        )}
      </div>
    );
  }
}
