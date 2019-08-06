import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Popconfirm, message, Tag } from 'antd';
import { UserProposal, STATUS } from 'types';
import { deletePendingProposal, publishPendingProposal } from 'modules/users/actions';
import { connect } from 'react-redux';
import { AppState } from 'store/reducers';
import './ProfilePending.less';

interface OwnProps {
  proposal: UserProposal;
  onPublish(id: UserProposal['id']): void;
}

interface StateProps {
  user: AppState['auth']['user'];
}

interface DispatchProps {
  deletePendingProposal: typeof deletePendingProposal;
  publishPendingProposal: typeof publishPendingProposal;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
  isDeleting: boolean;
  isPublishing: boolean;
}

class ProfilePending extends React.Component<Props, State> {
  state: State = {
    isDeleting: false,
    isPublishing: false,
  };

  render() {
    const { status, title, id, rejectReason } = this.props.proposal;
    const { isDeleting, isPublishing } = this.state;

    const isDisableActions = isDeleting || isPublishing;

    const st = {
      [STATUS.APPROVED]: {
        color: 'green',
        tag: 'Approved',
        blurb: <div>You may publish this proposal when you are ready.</div>,
      },
      [STATUS.REJECTED]: {
        color: 'red',
        tag: 'Rejected',
        blurb: (
          <>
            <div>This proposal was rejected for the following reason:</div>
            <q>{rejectReason}</q>
            <div>You may edit this proposal and re-submit it for approval.</div>
          </>
        ),
      },
      [STATUS.PENDING]: {
        color: 'orange',
        tag: 'Pending',
        blurb: (
          <div>
            You will receive an email when this proposal has completed the review process.
          </div>
        ),
      },
    } as { [key in STATUS]: { color: string; tag: string; blurb: ReactNode } };

    return (
      <div className="ProfilePending">
        <div className="ProfilePending-block">
          <Link to={`/proposals/${id}`} className="ProfilePending-title">
            {title} <Tag color={st[status].color}>{st[status].tag}</Tag>
          </Link>
          <div className={`ProfilePending-status is-${status.toLowerCase()}`}>
            {st[status].blurb}
          </div>
        </div>
        <div className="ProfilePending-block is-actions">
          {STATUS.APPROVED === status && (
            <Button
              loading={isPublishing}
              disabled={isDisableActions}
              type="primary"
              onClick={this.handlePublish}
            >
              Publish
            </Button>
          )}
          {STATUS.REJECTED === status && (
            <Link to={`/proposals/${id}/edit`}>
              <Button disabled={isDisableActions} type="primary">
                Edit
              </Button>
            </Link>
          )}

          <Popconfirm
            key="delete"
            title="Are you sure?"
            onConfirm={() => this.handleDelete()}
          >
            <Button type="default" disabled={isDisableActions} loading={isDeleting}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      </div>
    );
  }

  private handlePublish = async () => {
    const {
      user,
      proposal: { id },
      onPublish,
    } = this.props;
    if (!user) return;
    this.setState({ isPublishing: true });
    try {
      await this.props.publishPendingProposal(user.id, id);
      onPublish(id);
    } catch (e) {
      message.error(e.message || e.toString());
      this.setState({ isPublishing: false });
    }
  };

  private handleDelete = async () => {
    const {
      user,
      proposal: { id },
    } = this.props;
    if (!user) return;
    this.setState({ isDeleting: true });
    try {
      await this.props.deletePendingProposal(user.id, id);
      message.success('Proposal deleted.');
    } catch (e) {
      message.error(e.message || e.toString());
      this.setState({ isDeleting: false });
    }
  };
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(
  state => ({
    user: state.auth.user,
  }),
  {
    deletePendingProposal,
    publishPendingProposal,
  },
)(ProfilePending);
