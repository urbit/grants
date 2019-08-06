import React from 'react';
import { Button, message, Alert } from 'antd';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Loader from 'components/Loader';
import { rfwActions } from 'modules/rfws';
import { bindActionCreators, Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import ExceptionPage from 'components/ExceptionPage';
import { withRouter } from 'react-router';
import Markdown from 'components/Markdown';
import FeedbackModal from 'components/FeedbackModal';
import { RFW_WORKER_STATUS } from 'types';
import { rfwWorkerRequest, rfwMilestoneClaim } from 'api/api';
import RFWMilestoneItem from './RFWMilestone';
import ScrollToDiv from 'components/ScrollToDiv';
import { RFW_STATUS } from 'api/constants';
import './index.less';

interface OwnProps {
  rfwId: number;
}

interface StateProps {
  detail: AppState['rfw']['detail'];
  isFetchingDetail: AppState['rfw']['isFetchingDetail'];
  detailError: AppState['rfw']['detailError'];
  user: AppState['auth']['user'];
}

interface DispatchProps {
  fetchRFW: typeof rfwActions['fetchRFW'];
}

type Props = StateProps & DispatchProps & OwnProps;

const STATE = {
  showClaimModal: false,
  claimMessage: '',
  claimUrl: '',
};
type State = typeof STATE;

export class RFWDetail extends React.Component<Props, State> {
  state: State = { ...STATE };
  componentDidMount() {
    this.props.fetchRFW(this.props.rfwId);
  }

  render() {
    const { detail: rfw, detailError } = this.props;
    const wrongRFW = rfw && rfw.id !== this.props.rfwId;

    const authedUser = this.props.user;

    if (detailError) {
      return <ExceptionPage code="404" desc="Could not find that bounty" />;
    }
    if (!rfw || wrongRFW) {
      return <Loader size="large" />;
    }

    const approvedWorkers = rfw.workers.filter(
      w => w.status === RFW_WORKER_STATUS.ACCEPTED,
    );

    let workerStatus;
    if (authedUser) {
      if (!rfw.authedWorker || rfw.authedWorker.status === RFW_WORKER_STATUS.REJECTED) {
        if (rfw.status !== RFW_STATUS.CLOSED) {
          workerStatus = (
            <Button type="primary" size="large" onClick={this.openRequestWork}>
              Request to work on this
            </Button>
          );
        }
      } else if (rfw.authedWorker.status === RFW_WORKER_STATUS.ACCEPTED) {
        workerStatus = (
          <Alert
            type="info"
            message="You are an approved worker"
            description={`
              Whenever you complete a milestone, click the claim button below to
              have an admin check your work. After approval, you'll receive your reward.
            `}
          />
        );
      } else {
        workerStatus = (
          <Alert
            type="info"
            message="Worker request pending"
            description={`
              You have applied to work on this project. If an admin approves your
              request, you'll be able to start claiming work for rewards.
            `}
          />
        );
      }

      if (workerStatus) {
        workerStatus = <div className="RFW-worker">{workerStatus}</div>;
      }
    }

    return (
      <div className="RFW">
        {/* TITLE */}
        <h1 className="RFW-title">{rfw.title}</h1>
        <div className="RFW-date">
          Opened {moment(rfw.dateCreated * 1000).format('LL')}
        </div>

        {/* CONTENT */}
        <Markdown className="RFW-content" source={rfw.content} />

        <div className="RFW-rules">
          <ul>
            <li>
              Reward: <strong>{rfw.bounty} STARS</strong>
            </li>
            <li>
              Estimated work:{' '}
              <strong>
                {moment.duration(rfw.effortFrom).humanize()} -{' '}
                {moment.duration(rfw.effortTo).humanize()}
              </strong>
            </li>
            {!!approvedWorkers.length && (
              <li>
                Workers:{' '}
                {approvedWorkers.map((w, idx) => (
                  <React.Fragment key={w.id}>
                    <strong>
                      <Link to={`/profile/${w.user!.id}`} key={w.id}>
                        {w.user!.displayName}
                      </Link>
                    </strong>
                    {idx + 1 !== approvedWorkers.length && <span>, </span>}
                  </React.Fragment>
                ))}
              </li>
            )}
            {!!rfw.tags.length && (
              <li>
                Tags:{' '}
                {rfw.tags.map((t, idx) => (
                  <React.Fragment key={t.id}>
                    {idx > 0 && ", "}
                    <Link to={`/rfws?tags=${t.id}`}>
                      <strong>{t.text}</strong>
                    </Link>
                  </React.Fragment>
                ))}
              </li>
            )}
          </ul>
        </div>

        {/* WORKER actions/status */}
        {workerStatus}

        {/* MILESTONES */}
        <div className="RFW-milestones">
          <h2 className="RFW-milestones-title">Milestones</h2>
          {rfw.milestones.map(ms => (
            <ScrollToDiv key={ms.id} when={{ arg: 'milestone', value: String(ms.id) }}>
              <RFWMilestoneItem
                {...ms}
                isWorker={
                  !!rfw.authedWorker &&
                  rfw.authedWorker.status === RFW_WORKER_STATUS.ACCEPTED
                }
                isClaimable={ms.isAuthedActive}
                onChange={(text, url) => this.handleMilestoneClaim(ms.id, text, url)}
              />
            </ScrollToDiv>
          ))}
        </div>
      </div>
    );
  }

  private openRequestWork = () => {
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
    });
  };

  private handleWorkRequest = async (statusMessage: string) => {
    if (!this.props.detail) {
      return;
    }
    // send request api call
    const { id: rfwId } = this.props.detail;
    try {
      await rfwWorkerRequest({ rfwId, statusMessage });
    } catch (error) {
      message.error(error.toString());
      return;
    }
    // update detail if successful
    await this.props.fetchRFW(this.props.rfwId);
    message.success('Work request sent');
  };

  private handleMilestoneClaim = async (msId: number, m: string, url: string) => {
    if (!this.props.detail || !this.props.detail.authedWorker) {
      return;
    }
    const {
      id: rfwId,
      authedWorker: { id: workerId },
    } = this.props.detail;
    try {
      await rfwMilestoneClaim({ rfwId, msId, workerId, message: m, url });
    } catch (error) {
      message.error(error.toString());
    }
    // update detail if successful
    await this.props.fetchRFW(rfwId);
    message.success('Claim sent');
  };
}

function mapStateToProps(state: AppState, _: OwnProps) {
  return {
    detail: state.rfw.detail,
    isFetchingDetail: state.rfw.isFetchingDetail,
    detailError: state.rfw.detailError,
    user: state.auth.user,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return bindActionCreators({ ...rfwActions }, dispatch);
}

const withConnect = connect<StateProps, DispatchProps, OwnProps, AppState>(
  mapStateToProps,
  mapDispatchToProps,
);

const ConnectedRFW = compose<Props, OwnProps>(
  withRouter,
  withConnect,
)(RFWDetail);

export default ConnectedRFW;
