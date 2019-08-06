import React from 'react';
import { Button } from 'antd';
import { connect } from 'react-redux';
import { MILESTONE_STAGE, Proposal, STATUS } from 'types';
import { formatDate } from 'utils/formatters';
import { requestPayout } from 'modules/proposals/actions';
import { AppState } from 'store/reducers';

interface OwnProps {
  proposal: Proposal;
}

interface DispatchProps {
  requestPayout: typeof requestPayout;
}

type Props = OwnProps & DispatchProps;

interface ActionContent {
  title: React.ReactNode;
  description: React.ReactNode;
}

class MilestoneAction extends React.Component<Props> {
  render() {
    const { proposal: p } = this.props;
    const ms = p.currentMilestone;

    if (!ms || !p.isTeamMember || p.status !== STATUS.LIVE) {
      return null;
    }

    const contents = {
      [MILESTONE_STAGE.IDLE]: () => ({
        title: 'Payment Request',
        description: (
          <>
            {ms.immediatePayout && (
              <p>
                Congratulations on getting approved! You can now begin the process of
                receiving your initial payment. Click below to request the first milestone
                payout. It will instantly be approved, and you’ll receive your reward
                shortly thereafter.
              </p>
            )}
            {!ms.immediatePayout &&
              ms.index === 0 && (
                <p>
                  Congratulations on getting approved! Click below to request your first
                  milestone payout. Once reviewed and approved, you'll receive your reward
                  shortly thereafter.
                </p>
              )}
            {!ms.immediatePayout &&
              ms.index > 0 && (
                <p>
                  Click below to request your next milestone payout. Once approved, you'll
                  receive your reward shortly thereafter.
                </p>
              )}
            <Button type="primary" onClick={this.requestPayout}>
              {(ms.immediatePayout && 'Request initial payout') || 'Request payout'}
            </Button>
          </>
        ),
      }),
      [MILESTONE_STAGE.REQUESTED]: () => ({
        title: 'Payment Requested',
        description: `
          The milestone payout was requested on ${formatDate(
            ms.dateRequested,
          )}. You will be
          notified when it has been reviewed.
        `,
      }),
      [MILESTONE_STAGE.REJECTED]: () => ({
        title: 'Payment Rejected',
        description: (
          <>
            <p>The request for payout was rejected for the following reason:</p>
            <q>{ms.rejectReason}</q>
            <p>You may request payout again when you are ready.</p>
            <Button type="primary" onClick={this.requestPayout} block>
              Request payout
            </Button>
          </>
        ),
      }),
      [MILESTONE_STAGE.ACCEPTED]: () => ({
        title: 'Awaiting Payment',
        description: `
          Payout approved on ${formatDate(ms.dateAccepted)}!
          You will receive payment shortly.
        `,
      }),
      [MILESTONE_STAGE.PAID]: () => null,
    } as { [key in MILESTONE_STAGE]: () => ActionContent | null };

    const content = contents[ms.stage]();
    if (!content) {
      return null;
    }

    return (
      <div className="ProposalMilestones-action">
        <h3 className="ProposalMilestones-action-title">{content.title}</h3>
        <div className="ProposalMilestones-action-description">{content.description}</div>
      </div>
    );
  }

  private requestPayout = () => {
    const { proposal } = this.props;
    if (!proposal.currentMilestone) return;
    this.props.requestPayout(proposal.id, proposal.currentMilestone.id);
  };
}

export default connect<{}, DispatchProps, OwnProps, AppState>(
  undefined,
  { requestPayout },
)(MilestoneAction);
