import React from 'react';
import moment from 'moment';
import { Button, Alert } from 'antd';
import ClaimModal from './ClaimModal';
import { RFWMilestone, RFW_MILESTONE_CLAIM_STAGE, RFWMilestoneClaim } from 'types';
import './RFWMilestone.less';
import Markdown from 'components/Markdown';
import UserAvatar from 'components/UserAvatar';
import { MARKDOWN_TYPE } from 'utils/markdown';
import { Link } from 'react-router-dom';

interface Props extends RFWMilestone {
  isWorker: boolean;
  isClaimable: boolean;
  onChange(text: string, url: string): void;
}

interface State {
  showModal: boolean;
}

export default class RFWMilestoneItem extends React.Component<Props, State> {
  state: State = {
    showModal: false,
  };

  render() {
    const ms = this.props;

    let claimStatus;
    if (ms.isClaimable) {
      if (
        !ms.authedClaim ||
        ms.authedClaim.stage === RFW_MILESTONE_CLAIM_STAGE.REJECTED
      ) {
        claimStatus = (
          <Button
            type="primary"
            size="large"
            onClick={() => this.setState({ showModal: true })}
          >
            Claim work
          </Button>
        );
      } else if (ms.authedClaim.stage === RFW_MILESTONE_CLAIM_STAGE.REQUESTED) {
        claimStatus = (
          <Alert
            type="info"
            message="You have a pending claim"
            description={`
              You made a claim for this milestone. You will be notified once an admin
              has reviewed your claim.
            `}
          />
        );
      }
      claimStatus = <div className="RFWMilestone-claim">{claimStatus}</div>;
    }

    // TODO: Figure out if stages are dynamic or just leave as-is all the time
    const stage: React.ReactNode = ms.index + 1;
    const stageClass = 'RFWMilestone-stage';
    // if (ms.closed) {
    //   stageClass += ' is-filled';
    //   stage = <Icon type="check" />;
    // } else if (ms.isActive) {
    //   stageClass += ' is-filled';
    // }

    return (
      <div className="RFWMilestone">
        <div className={stageClass}>{stage}</div>
        <div className="RFWMilestone-description">
          <h3 className="RFWMilestone-title">{ms.title}</h3>
          <div className="RFWMilestone-status">
            <div>
              Estimate:{' '}
              <strong>
                {moment.duration(ms.effortFrom).humanize()} -{' '}
                {moment.duration(ms.effortTo).humanize()}
              </strong>
            </div>
            <div>
              Reward: <strong>{ms.bounty} STARS</strong>
            </div>
          </div>
          <Markdown
            className="RFWMilestone-content"
            source={ms.content}
            type={MARKDOWN_TYPE.REDUCED}
          />
          {!!ms.claims.length && (
            <div className="RFWMilestone-claims">
              {ms.claims.map(c => (
                <RFWMilestoneClaimItem key={c.id} {...c} />
              ))}
            </div>
          )}
          {claimStatus}
          <ClaimModal
            visible={this.state.showModal}
            onCancel={() => this.setState({ showModal: false })}
            onClaim={(text, url) => {
              this.setState({ showModal: false });
              ms.onChange(text, url);
            }}
          />
        </div>
      </div>
    );
  }
}

const RFWMilestoneClaimItem: React.SFC<RFWMilestoneClaim> = p => (
  <div className="RFWMilestoneClaim">
    <Link className="RFWMilestoneClaim-user" to={`/profile/${p.worker!.user!.id}`}>
      <UserAvatar className="RFWMilestoneClaim-user-avatar" user={p.worker!.user!} />
      {p.worker!.user!.displayName}
    </Link>
    {p.stage === RFW_MILESTONE_CLAIM_STAGE.ACCEPTED &&
      `
      has completed their work on this milestone
    `}
    {p.stage === RFW_MILESTONE_CLAIM_STAGE.REJECTED &&
      `
      had their claim rejected
    `}
    {p.stage === RFW_MILESTONE_CLAIM_STAGE.REQUESTED &&
      `
      is waiting to have their claim reviewed
    `}
  </div>
);
