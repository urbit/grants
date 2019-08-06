import React from 'react';
import { view } from 'react-easy-state';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Row, Col, Collapse, Card, Button, Popconfirm, Spin, message, Alert } from 'antd';
import Exception from 'ant-design-pro/lib/Exception';
import Back from 'components/Back';
import Markdown from 'components/Markdown';
import { formatDateSeconds, formatDurationMs } from 'util/time';
import store from 'src/store';
import { RFW_WORKER_STATUS, RFW_MILESTONE_CLAIM_STAGE } from 'src/types';
import FeedbackModal from '../FeedbackModal';
import './index.less';

type Props = RouteComponentProps<{ id?: string }>;

class RFWDetail extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.loadDetail();
  }

  render() {
    const rfw = store.rfwDetail;

    if (!rfw && store.rfwDetailFetching) {
      return <Spin />;
    }

    if (!rfw) {
      return <Exception type="404" desc="This bounty does not exist" />;
    }

    const renderDeetItem = (name: string, val: any) => (
      <div className="RFWDetail-deet">
        <span>{name}</span>
        {val}
      </div>
    );

    const pendingWorkers = rfw.workers.filter(
      x => x.status === RFW_WORKER_STATUS.REQUESTED && x.user,
    );
    const acceptedWorkers = rfw.workers.filter(
      x => x.status === RFW_WORKER_STATUS.ACCEPTED && x.user,
    );

    const renderWorkerReview = () =>
      rfw.workers.map(
        w =>
          w.status === RFW_WORKER_STATUS.REQUESTED && (
            <Alert
              key={w.id}
              showIcon
              type="warning"
              message="Review Worker"
              description={
                <div>
                  <p>
                    <Link to={`/users/${w.user!.id}`}>{w.user!.displayName}</Link> would
                    like to work on this request.
                  </p>
                  <p>
                    <small>message:</small>
                    <br />
                    <q>{w.statusMessage}</q>
                  </p>
                  <Button
                    loading={store.rfwDetailBusy}
                    icon="check"
                    type="primary"
                    onClick={() => {
                      FeedbackModal.open({
                        title: 'Approve this worker?',
                        label: 'Provide a message:',
                        okText: 'Approve',
                        onOk: x => this.handleApprove(w.id, x),
                      });
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    loading={store.rfwDetailBusy}
                    icon="close"
                    type="danger"
                    onClick={() => {
                      FeedbackModal.open({
                        title: 'Reject this worker?',
                        label: 'Please provide a reason:',
                        okText: 'Reject',
                        onOk: x => this.handleReject(w.id, x),
                      });
                    }}
                  >
                    Reject
                  </Button>
                </div>
              }
            />
          ),
      );

    const renderClaimReview = () =>
      rfw.milestones.filter(ms => !ms.closed).map(ms =>
        ms.claims.filter(c => c.stage === RFW_MILESTONE_CLAIM_STAGE.REQUESTED).map(c => (
          <Alert
            key={c.id}
            showIcon
            type="warning"
            message="Review Claim"
            description={
              <div>
                <p>
                  <Link to={`/users/${c.worker!.user!.id}`}>
                    {c.worker!.user!.displayName}
                  </Link>{' '}
                  has claimed work on <b>{ms.title}</b> (milestone {ms.index + 1})
                </p>
                <p>
                  <small>message:</small>
                  <br />
                  <q>{c.stageMessage}</q>
                  <br />
                  <br />
                  {c.stageUrl && (
                    <>
                      <small>URL:</small>{' '}
                      <a target="_blank" href={c.stageUrl}>
                        {c.stageUrl}
                      </a>
                    </>
                  )}
                </p>
                <Button
                  loading={store.rfwDetailBusy}
                  icon="check"
                  type="primary"
                  onClick={() => {
                    FeedbackModal.open({
                      title: 'Approve this claim?',
                      label: 'Provide a message:',
                      okText: 'Approve',
                      onOk: x => this.handleApproveClaim(ms.id, c.id, x),
                    });
                  }}
                >
                  Approve
                </Button>
                <Button
                  loading={store.rfwDetailBusy}
                  icon="close"
                  type="danger"
                  onClick={() => {
                    FeedbackModal.open({
                      title: 'Reject this claim?',
                      label: 'Please provide a reason:',
                      okText: 'Reject',
                      onOk: x => this.handleRejectClaim(ms.id, c.id, x),
                    });
                  }}
                >
                  Reject
                </Button>
              </div>
            }
          />
        )),
      );

    return (
      <div className="RFWDetail">
        <Back to="/bounties" text="Bounties" />
        <h1>{rfw.title}</h1>
        <Row gutter={16}>
          {/* MAIN */}
          <Col span={18}>
            {renderWorkerReview()}
            {renderClaimReview()}
            <Collapse defaultActiveKey={['brief', 'content', 'milestones']}>
              <Collapse.Panel key="brief" header="brief">
                {rfw.brief}
              </Collapse.Panel>

              <Collapse.Panel key="content" header="content">
                <Markdown source={rfw.content} />
              </Collapse.Panel>

              <Collapse.Panel
                key="milestones"
                header={`milestones (${rfw.milestones.length})`}
              >
                {rfw.milestones.map((milestone, i) => (
                  <Card
                    title={<>{milestone.title + ' '}</>}
                    extra={`${milestone.bounty} STARS`}
                    key={i}
                  >
                    <p>
                      <b>Estimated Effort:</b> {formatDurationMs(milestone.effortFrom)} -{' '}
                      {formatDurationMs(milestone.effortTo)}
                    </p>
                    <p>{milestone.content}</p>
                  </Card>
                ))}
              </Collapse.Panel>

              <Collapse.Panel key="json" header="json">
                <pre>{JSON.stringify(rfw, null, 4)}</pre>
              </Collapse.Panel>
            </Collapse>
          </Col>

          {/* RIGHT SIDE */}
          <Col span={6}>
            {/* ACTIONS */}
            <Card className="RFWDetail-actions" size="small">
              <Link to={`/bounties/${rfw.id}/edit`}>
                <Button type="primary" icon="edit" block>
                  Edit
                </Button>
              </Link>
              <Popconfirm
                onConfirm={this.handleDelete}
                title="Delete rfw?"
                okText="delete"
                cancelText="cancel"
              >
                <Button loading={store.rfwDeleting} icon="delete" block>
                  Delete
                </Button>
              </Popconfirm>
            </Card>

            {/* DETAILS */}
            <Card title="details" size="small">
              {renderDeetItem('id', rfw.id)}
              {renderDeetItem('created', formatDateSeconds(rfw.dateCreated))}
              {renderDeetItem('status', rfw.status)}
              {renderDeetItem('category', rfw.category)}
              {renderDeetItem('bounty total', `${rfw.bounty} STARS`)}
            </Card>

            {/* WORKERS */}
            <Card title="Approved Workers" size="small">
              {acceptedWorkers.map(
                w =>
                  w.user && (
                    <Link
                      key={w.id}
                      className="RFWDetails-worker"
                      to={`/users/${w.user!.id}`}
                    >
                      <div>{w.user.displayName}</div>
                    </Link>
                  ),
              )}
              {!acceptedWorkers.length && <em>No workers accepted</em>}
            </Card>
            <Card title="Pending Workers" size="small">
              {pendingWorkers.map(
                w =>
                  w.user && (
                    <Link
                      key={w.id}
                      className="RFWDetails-worker"
                      to={`/users/${w.user!.id}`}
                    >
                      <div>{w.user.displayName}</div>
                    </Link>
                  ),
              )}
              {!pendingWorkers.length && <em>No workers pending</em>}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  private loadDetail = () => {
    store.fetchRFWDetail(Number(this.props.match.params.id));
  };

  private handleDelete = async () => {
    await store.deleteRFW(store.rfwDetail!.id);
    if (store.rfwDeleted) {
      message.success('Successfully deleted', 2);
    }
  };

  private handleApprove = (workerId: number, m: string) => {
    store.approveRFWWorker(workerId, true, m);
    message.info('Work request approved');
  };

  private handleReject = async (workerId: number, m: string) => {
    await store.approveRFWWorker(workerId, false, m);
    message.info('Work request reviewed');
  };

  private handleApproveClaim = async (msId: number, claimId: number, m: string) => {
    await store.acceptRFWClaim(msId, claimId, true, m);
    message.info('Claim approved');
  };

  private handleRejectClaim = async (msId: number, claimId: number, m: string) => {
    await store.acceptRFWClaim(msId, claimId, false, m);
    message.info('Claim reviewed');
  };
}

export default withRouter(view(RFWDetail));
