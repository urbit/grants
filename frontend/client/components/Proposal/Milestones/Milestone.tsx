import React from 'react';
import moment from 'moment';
import { Alert, Icon } from 'antd';
import { AlertProps } from 'antd/lib/alert';
import { Milestone, ProposalMilestone, MILESTONE_STAGE, Proposal } from 'types';
import { formatDate, formatDateFromNow } from 'utils/formatters';

interface Props {
  proposal: Proposal;
  milestone: ProposalMilestone;
}

const Milestone: React.SFC<Props> = props => {
  const { milestone: ms, proposal: p } = props;
  const estimatedDate = moment(ms.dateEstimated * 1000).format('MMMM YYYY');
  const getAlertProps = {
    [MILESTONE_STAGE.IDLE]: () => null,
    [MILESTONE_STAGE.REQUESTED]: () => ({
      type: 'info',
      message: (
        <>
          {p.isTeamMember ? 'You ' : 'The team '} requested a payout for this milestone{' '}
          {formatDateFromNow(ms.dateRequested)}. It is currently under review.
        </>
      ),
    }),
    [MILESTONE_STAGE.REJECTED]: () => ({
      type: 'warning',
      message: (
        <span>
          Payout for this milestone was rejected {formatDateFromNow(ms.dateRejected)}.
          {p.isTeamMember ? ' You ' : ' The team '} can request another review for payout
          at any time.
        </span>
      ),
    }),
    [MILESTONE_STAGE.ACCEPTED]: () => ({
      type: 'info',
      message: (
        <span>
          Payout for this milestone was accepted {formatDateFromNow(ms.dateAccepted)}.{' '}
          <strong>{ms.amount} STARS</strong> will be sent to{' '}
          {p.isTeamMember ? ' you ' : ' the team '} soon.
        </span>
      ),
    }),
    [MILESTONE_STAGE.PAID]: () => ({
      type: 'success',
      message: (
        <span>
          The team was awarded <strong>{ms.amount} STARS</strong>{' '}
          {ms.immediatePayout && ` as an initial payout `} on {formatDate(ms.datePaid)}.
        </span>
      ),
    }),
  } as { [key in MILESTONE_STAGE]: () => AlertProps | null };

  const alertProps = getAlertProps[ms.stage]();

  let stage: React.ReactNode = ms.index + 1;
  let stageClass = 'ProposalMilestones-milestone-stage';
  if (ms.stage === MILESTONE_STAGE.PAID) {
    stageClass += ' is-filled';
    stage = <Icon type="check" />;
  } else if (p.currentMilestone && ms.id === p.currentMilestone.id) {
    stageClass += ' is-filled';
  }

  return (
    <div className="ProposalMilestones-milestone">
      <div className={stageClass}>{stage}</div>
      <div className="ProposalMilestones-milestone-description">
        <h3 className="ProposalMilestones-milestone-title">{ms.title}</h3>
        <div className="ProposalMilestones-milestone-status">
          {!ms.immediatePayout && (
            <div>
              Estimate: <strong>{estimatedDate}</strong>
            </div>
          )}
          <div>
            Reward: <strong>{ms.amount} STARS</strong>
          </div>
        </div>
        {alertProps && (
          <Alert {...alertProps} className="ProposalMilestones-milestone-alert" />
        )}
        {ms.content}
      </div>
    </div>
  );
};

export default Milestone;
