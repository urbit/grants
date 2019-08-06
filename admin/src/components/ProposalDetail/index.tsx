import React from 'react';
import { view } from 'react-easy-state';
import { RouteComponentProps, withRouter } from 'react-router';
import {
  Tag,
  Row,
  Col,
  Card,
  Alert,
  Button,
  Collapse,
  Popconfirm,
  message,
  Switch,
} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import store from 'src/store';
import { formatDateSeconds, formatDateDay } from 'util/time';
import { PROPOSAL_STATUS, MILESTONE_STAGE, PROPOSAL_STAGE } from 'src/types';
import { Link } from 'react-router-dom';
import Back from 'components/Back';
import Markdown from 'components/Markdown';
import FeedbackModal from '../FeedbackModal';
import Info from 'components/Info';
import './index.less';

type Props = RouteComponentProps<any>;

const STATE = {
  paidTxId: '',
  showCancelPopover: false,
};

type State = typeof STATE;

class ProposalDetailNaked extends React.Component<Props, State> {
  state = STATE;
  rejectInput: null | TextArea = null;
  componentDidMount() {
    this.loadDetail();
  }
  render() {
    const id = this.getIdFromQuery();
    const { proposalDetail: p, proposalDetailFetching } = store;
    const isLive = p && p.status === PROPOSAL_STATUS.LIVE;

    if (!p || (p && p.id !== id) || proposalDetailFetching) {
      return 'loading proposal...';
    }

    const renderCancelControl = () => {
      const disabled = this.getCancelDisabled();

      return (
        <Popconfirm
          title={
            <p>
              Are you sure you want to cancel this proposal?
              <br />
              This cannot be undone.
            </p>
          }
          placement="left"
          cancelText="cancel"
          okText="confirm"
          visible={this.state.showCancelPopover}
          okButtonProps={{
            loading: store.proposalDetailCanceling,
          }}
          onCancel={this.handleCancelCancel}
          onConfirm={this.handleConfirmCancel}
        >
          <Button
            icon="close-circle"
            className="ProposalDetail-controls-control"
            loading={store.proposalDetailCanceling}
            onClick={this.handleCancelClick}
            disabled={disabled}
            block
          >
            Cancel
          </Button>
        </Popconfirm>
      );
    };

    const renderPrivateControl = () => {
      return (
        <div className="ProposalDetail-controls-control">
          <Popconfirm
            overlayClassName="ProposalDetail-popover-overlay"
            onConfirm={this.handleTogglePrivate}
            title={
              <>
                {p.private ? 'Make visible to everyone?' : 'Hide from non-team members?'}
              </>
            }
            okText="ok"
            cancelText="cancel"
          >
            <Switch checked={p.private} loading={store.proposalDetailUpdating} />{' '}
          </Popconfirm>
          <span>
            Private{' '}
            <Info
              placement="right"
              content={
                <span>
                  <b>Make private</b>
                  <br /> Only team members will be able to view the proposal.
                </span>
              }
            />
          </span>
        </div>
      );
    };

    const renderApproved = () =>
      p.status === PROPOSAL_STATUS.APPROVED && (
        <Alert
          showIcon
          type="success"
          message={`Approved on ${formatDateSeconds(p.dateApproved)}`}
          description={`
            This proposal has been approved and will become live when a team-member
            publishes it.
          `}
        />
      );

    const renderReview = () =>
      p.status === PROPOSAL_STATUS.PENDING && (
        <Alert
          showIcon
          type="warning"
          message="Review Pending"
          description={
            <div>
              <p>Please review this proposal and render your judgment.</p>
              <Button
                loading={store.proposalDetailApproving}
                icon="check"
                type="primary"
                onClick={this.handleApprove}
              >
                Approve
              </Button>
              <Button
                loading={store.proposalDetailApproving}
                icon="close"
                type="danger"
                onClick={() => {
                  FeedbackModal.open({
                    title: 'Reject this proposal?',
                    label: 'Please provide a reason:',
                    okText: 'Reject',
                    onOk: this.handleReject,
                  });
                }}
              >
                Reject
              </Button>
            </div>
          }
        />
      );

    const renderRejected = () =>
      p.status === PROPOSAL_STATUS.REJECTED && (
        <Alert
          showIcon
          type="error"
          message="Rejected"
          description={
            <div>
              <p>
                This proposal has been rejected. The team will be able to re-submit it for
                approval should they desire to do so.
              </p>
              <b>Reason:</b>
              <br />
              <i>{p.rejectReason}</i>
            </div>
          }
        />
      );

    const renderRejectedMilestone = () => {
      if (p.stage === PROPOSAL_STAGE.FAILED || p.stage === PROPOSAL_STAGE.CANCELED) {
        return;
      }
      if (
        !(
          p.status === PROPOSAL_STATUS.LIVE &&
          p.currentMilestone &&
          p.currentMilestone.stage === MILESTONE_STAGE.REJECTED
        )
      ) {
        return;
      }
      const ms = p.currentMilestone;
      return (
        <Alert
          showIcon
          type="error"
          message={`Milestone ${ms.index + 1} - ${ms.title}`}
          description={
            <div>
              <p>
                This milestone was rejected. The team can request it for review again when
                they are ready.
              </p>
              <b>Reason:</b>
              <br />
              <i>{ms.rejectReason}</i>
            </div>
          }
        />
      );
    };

    const renderMilestoneRequested = () => {
      if (p.stage === PROPOSAL_STAGE.FAILED || p.stage === PROPOSAL_STAGE.CANCELED) {
        return;
      }
      if (
        !(
          p.status === PROPOSAL_STATUS.LIVE &&
          p.currentMilestone &&
          p.currentMilestone.stage === MILESTONE_STAGE.REQUESTED
        )
      ) {
        return;
      }
      const ms = p.currentMilestone;
      return (
        <Alert
          className="ProposalDetail-alert"
          showIcon
          type="warning"
          message={null}
          description={
            <div>
              <p>
                <b>
                  Milestone {ms.index + 1} - {ms.title}
                </b>{' '}
              </p>
              <p>
                Payout was requested at {formatDateSeconds(ms.dateRequested)} for{' '}
                <b>{ms.payoutAmount} STARS</b>
              </p>
              <Button
                loading={store.proposalDetailAcceptingMilestone}
                icon="check"
                type="primary"
                onClick={this.handleAcceptMilestone}
              >
                Approve &amp; Mark Paid
              </Button>
              <Button
                loading={store.proposalDetailRejectingMilestone}
                icon="close"
                type="danger"
                onClick={() => {
                  FeedbackModal.open({
                    title: 'Reject this milestone?',
                    label: 'Please provide a reason:',
                    okText: 'Reject',
                    onOk: this.handleRejectMilestone,
                  });
                }}
              >
                Reject
              </Button>
            </div>
          }
        />
      );
    };

    const renderDeetItem = (name: string, val: any) => (
      <div className="ProposalDetail-deet">
        <span>{name}</span>
        {val} &nbsp;
      </div>
    );

    return (
      <div className="ProposalDetail">
        <Back to="/proposals" text="Proposals" />
        <h1>{p.title}</h1>
        <Row gutter={16}>
          {/* MAIN */}
          <Col span={18}>
            {renderApproved()}
            {renderReview()}
            {renderRejected()}
            {renderMilestoneRequested()}
            {renderRejectedMilestone()}
            <Collapse defaultActiveKey={['brief', 'content']}>
              <Collapse.Panel key="brief" header="brief">
                {p.brief}
              </Collapse.Panel>

              <Collapse.Panel key="content" header="content">
                <Markdown source={p.content} />
              </Collapse.Panel>

              <Collapse.Panel
                key="milestones"
                header={`milestones (${p.milestones.length})`}
              >
                {p.milestones.map((milestone, i) => (
                  <Card
                    title={
                      <>
                        {milestone.title + ' '}
                        {milestone.immediatePayout && (
                          <Tag color="magenta">Immediate Payout</Tag>
                        )}
                        {isLive &&
                          p.currentMilestone &&
                          p.currentMilestone.index === i && (
                            <Tag color="blue">Active</Tag>
                          )}
                        <Tag>{milestone.stage}</Tag>
                      </>
                    }
                    extra={`${milestone.payoutAmount} STARS Payout`}
                    key={i}
                  >
                    <p>
                      <b>Estimated Date:</b>{' '}
                      {formatDateDay(milestone.dateEstimated)}{' '}
                    </p>
                    <p>{milestone.content}</p>
                  </Card>
                ))}
              </Collapse.Panel>

              <Collapse.Panel key="json" header="json">
                <pre>{JSON.stringify(p, null, 4)}</pre>
              </Collapse.Panel>
            </Collapse>
          </Col>

          {/* RIGHT SIDE */}
          <Col span={6}>
            {/* ACTIONS */}
            <Card size="small" className="ProposalDetail-controls">
              {renderCancelControl()}
              {renderPrivateControl()}
            </Card>

            {/* DETAILS */}
            <Card title="Details" size="small">
              {renderDeetItem('id', p.id)}
              {renderDeetItem('created', formatDateSeconds(p.dateCreated))}
              {renderDeetItem(
                'published',
                p.datePublished ? formatDateSeconds(p.datePublished) : 'n/a',
              )}
              {renderDeetItem('isFailed', JSON.stringify(p.isFailed))}
              {renderDeetItem('status', p.status)}
              {renderDeetItem('stage', p.stage)}
              {renderDeetItem('category', p.category)}
              {renderDeetItem('target', p.target)}
              {renderDeetItem('followersCount', p.followersCount)}
              {renderDeetItem('private', JSON.stringify(p.private))}
              {p.rfp &&
                renderDeetItem(
                  'rfp',
                  <Link to={`/rfps/${p.rfp.id}`}>{p.rfp.title}</Link>,
                )}
            </Card>

            {/* TEAM */}
            <Card title="Team" size="small">
              {p.team.map(t => (
                <div key={t.id}>
                  <Link to={`/users/${t.id}`}>{t.displayName}</Link>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  private getCancelDisabled = () => {
    const { proposalDetail: p } = store;
    if (!p) {
      return true;
    }
    return (
      p.status !== PROPOSAL_STATUS.LIVE ||
      p.stage === PROPOSAL_STAGE.FAILED ||
      p.stage === PROPOSAL_STAGE.CANCELED ||
      p.isFailed
    );
  };

  private handleCancelClick = () => {
    const disabled = this.getCancelDisabled();
    if (!disabled) {
      if (!this.state.showCancelPopover) {
        this.setState({ showCancelPopover: true });
      }
    }
  };

  private getIdFromQuery = () => {
    return Number(this.props.match.params.id);
  };

  private loadDetail = () => {
    store.fetchProposalDetail(this.getIdFromQuery());
  };

  private handleCancelCancel = () => {
    this.setState({ showCancelPopover: false });
  };

  private handleConfirmCancel = () => {
    if (!store.proposalDetail) return;
    store.cancelProposal(store.proposalDetail.id);
    this.setState({ showCancelPopover: false });
  };

  private handleApprove = () => {
    store.approveProposal(true);
  };

  private handleReject = async (reason: string) => {
    await store.approveProposal(false, reason);
    message.info('Proposal rejected');
  };

  private handleRejectMilestone = async (reason: string) => {
    const pid = store.proposalDetail!.id;
    const mid = store.proposalDetail!.currentMilestone!.id;
    await store.rejectMilestone(pid, mid, reason);
    message.success('Milestone rejected');
  };

  private handleAcceptMilestone = async () => {
    const pid = store.proposalDetail!.id;
    const mid = store.proposalDetail!.currentMilestone!.id;
    await store.acceptMilestone(pid, mid);
    await store.markMilestonePaid(pid, mid);
    message.success('Milestone accepted & marked paid');
  };

  private handleTogglePrivate = async () => {
    if (!store.proposalDetail) {
      return;
    }
    const { private: isPrivate } = store.proposalDetail;
    await store.updateProposalDetail({ private: !isPrivate });
  };
}

const ProposalDetail = withRouter(view(ProposalDetailNaked));
export default ProposalDetail;
