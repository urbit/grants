import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  UserRFWWorker,
  RFW_WORKER_STATUS,
  RFWMilestone,
  RFWMilestoneClaim,
  RFW,
  RFW_MILESTONE_CLAIM_STAGE,
} from 'types';
import './ProfileWork.less';
import { Tag, Button, message } from 'antd';
import moment from 'moment';
import FeedbackModal from 'components/FeedbackModal';
import { rfwWorkerRequest, rfwMilestoneClaim } from 'api/api';
import { usersActions } from 'modules/users';
import { connect } from 'react-redux';
import { AppState } from 'store/reducers';
import ClaimModal from 'components/RFW/ClaimModal';

interface OwnProps {
  worker: UserRFWWorker;
}

interface DispatchProps {
  fetchUser: typeof usersActions['fetchUser'];
}

type Props = OwnProps & DispatchProps;

class ProfileWork extends React.Component<Props> {
  render() {
    const { status, statusMessage, rfw, isSelf, statusChangeDate } = this.props.worker;
    let { claims } = this.props.worker;
    claims = claims ? claims : [];
    const st = {
      [RFW_WORKER_STATUS.ACCEPTED]: {
        color: 'green',
        tag: 'Worker Accepted',
        blurb: (
          <div>
            <div>You can make claims on milestones for this work request.</div>
            <q>{statusMessage}</q>
          </div>
        ),
      },
      [RFW_WORKER_STATUS.REJECTED]: {
        color: 'orange',
        tag: 'Worker Reviewed',
        blurb: (
          <>
            <div>Your work request was reviewed:</div>
            <q>{statusMessage}</q>
            <div>You may re-submit the worker request for approval.</div>
          </>
        ),
      },
      [RFW_WORKER_STATUS.REQUESTED]: {
        color: 'purple',
        tag: 'Worker Requested',
        blurb: (
          <div>You will receive an email when this worker request has been reviewed.</div>
        ),
      },
    } as { [key in RFW_WORKER_STATUS]: { color: string; tag: string; blurb: ReactNode } };

    if (!isSelf) {
      // public view
      return (
        <>
          <div className="ProfileWork">
            <div className="ProfileWork-private">
              Started working on{' '}
              <Link to={`/bounties/${rfw.id}`} className="ProfileWork-private-title">
                {rfw.title}
              </Link>{' '}
              {moment(statusChangeDate * 1000).from(Date.now())}
            </div>
          </div>
          {claims.map(c => (
            <div className="ProfileWork">
              <div className="ProfileWork-private">
                Had a claim accepted for{' '}
                <Link
                  to={`/bounties/${rfw.id}/milestone/${c.milestone!.id}`}
                  className="ProfileWork-private-title"
                >
                  {rfw.title} / {c.milestone!.title}
                </Link>{' '}
                {moment(c.stageChangeDate * 1000).from(Date.now())}
              </div>
            </div>
          ))}
        </>
      );
    }

    // private view
    return (
      <>
        <div className="ProfileWork">
          <div className="ProfileWork-block">
            <Link to={`/bounties/${rfw.id}`} className="ProfileWork-title">
              {rfw.title} <Tag color={st[status].color}>{st[status].tag}</Tag>{' '}
            </Link>
            <div className={`ProfileWork-status`}>{st[status].blurb}</div>
          </div>
          <div className="ProfileWork-block is-actions">
            {RFW_WORKER_STATUS.ACCEPTED === status && (
              <Link to={`/bounties/${rfw.id}`}>
                <Button>View</Button>
              </Link>
            )}
            {RFW_WORKER_STATUS.REJECTED === status && (
              <>
                <Button type="primary" onClick={this.openWorkRequest}>
                  Request again
                </Button>
              </>
            )}
          </div>
        </div>
        {claims.map(c => (
          <ProfileWorkClaim
            key={c.id}
            rfw={rfw as RFW}
            {...c}
            fetchUser={this.props.fetchUser}
          />
        ))}
      </>
    );
  }

  private openWorkRequest = () => {
    FeedbackModal.open({
      title: 'Request work',
      content: <p>
        Let us know how you're qualified to work on this issue, and outline
        your plan to accomplish it.
      </p>,
      textAreaProps: {
        placeholder: 'Provide qualifications and a project outline here',
      },
      confirmationText: 'I understand that I should wait for approval before starting work',
      onOk: this.handleWorkRequest,
    })
  };

  private handleWorkRequest = async (statusMessage: string) => {
    if (!this.props.worker.rfw || !this.props.worker.user) {
      return;
    }
    // send request api call
    const {
      rfw: { id: rfwId },
      user: { id: userId },
    } = this.props.worker;
    try {
      await rfwWorkerRequest({ rfwId, statusMessage });
    } catch (error) {
      message.error(error.toString());
      return;
    }
    // update detail if successful
    await this.props.fetchUser(String(userId));
    message.success('Work request sent');
  };
}

type ProfileWorkClaimProps = RFWMilestoneClaim & DispatchProps & { rfw: RFW };
interface ProfileWorkClaimState {
  showModal: boolean;
}
// tslint:disable-next-line:max-classes-per-file
class ProfileWorkClaim extends React.Component<
  ProfileWorkClaimProps,
  ProfileWorkClaimState
> {
  state: ProfileWorkClaimState = {
    showModal: false,
  };
  render() {
    const { rfw, stage, stageMessage } = this.props;
    let { milestone } = this.props;
    milestone = milestone as RFWMilestone;

    const st = {
      [RFW_MILESTONE_CLAIM_STAGE.ACCEPTED]: {
        color: 'green',
        tag: 'Claim Accepted',
        blurb: (
          <>
            <div>
              Congratulations! Your claim was accepted, thank you for contributing.
              <q>{stageMessage}</q>
            </div>
          </>
        ),
      },
      [RFW_MILESTONE_CLAIM_STAGE.REJECTED]: {
        color: 'orange',
        tag: 'Claim Reviewed',
        blurb: (
          <>
            <div>Your claim was reviewed:</div>
            <q>{stageMessage}</q>
            <div>You may re-submit the claim for review.</div>
          </>
        ),
      },
      [RFW_MILESTONE_CLAIM_STAGE.REQUESTED]: {
        color: 'purple',
        tag: 'Claim Requested',
        blurb: <div>You will receive an email when this claim has been reviewed.</div>,
      },
    } as {
      [key in RFW_MILESTONE_CLAIM_STAGE]: { color: string; tag: string; blurb: ReactNode }
    };
    const url = `/bounties/${rfw.id}/milestone/${milestone.id}`;
    return (
      <div className="ProfileWork">
        <div className="ProfileWork-block">
          <Link to={url} className="ProfileWork-title">
            {rfw.title} / {milestone.title}{' '}
            <Tag color={st[stage].color}>{st[stage].tag}</Tag>
          </Link>
          <div className={`ProfileWork-status`}>{st[stage].blurb}</div>
        </div>
        <div className="ProfileWork-block is-actions">
          {RFW_MILESTONE_CLAIM_STAGE.ACCEPTED === stage && (
            <Link to={url}>
              <Button>View</Button>
            </Link>
          )}
          {RFW_MILESTONE_CLAIM_STAGE.REJECTED === stage && (
            <>
              <Button type="primary" onClick={() => this.setState({ showModal: true })}>
                Claim again
              </Button>
            </>
          )}
        </div>
        <ClaimModal
          visible={this.state.showModal}
          onCancel={() => this.setState({ showModal: false })}
          onClaim={this.handleClaim}
        />
      </div>
    );
  }

  private handleClaim = async (m: string, url: string) => {
    if (!this.props.rfw.authedWorker || !this.props.rfw.authedWorker.user) {
      return;
    }
    const {
      id: workerId,
      user: { id: userId },
    } = this.props.rfw.authedWorker;
    const { id: msId } = this.props.milestone as RFWMilestone;
    const { id: rfwId } = this.props.rfw as RFW;
    this.setState({ showModal: false });
    await rfwMilestoneClaim({
      rfwId,
      msId,
      workerId,
      message: m,
      url,
    });
    await this.props.fetchUser(String(userId));
    message.info('Claim has been made.');
  };
}

const withConnect = connect<{}, DispatchProps, {}, AppState>(
  () => ({}),
  { fetchUser: usersActions.fetchUser },
);

export default withConnect(ProfileWork);
