import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Icon, message, Popconfirm, Spin } from 'antd';
import Placeholder from 'components/Placeholder';
import { getIsVerified } from 'modules/auth/selectors';
import Loader from 'components/Loader';
import { STATUS } from 'types';
import {
  createDraft,
  deleteDraft,
  fetchDrafts,
  fetchAndCreateDrafts,
} from 'modules/create/actions';
import { AppState } from 'store/reducers';
import './style.less';

interface StateProps {
  drafts: AppState['create']['drafts'];
  isFetchingDrafts: AppState['create']['isFetchingDrafts'];
  fetchDraftsError: AppState['create']['fetchDraftsError'];
  isCreatingDraft: AppState['create']['isCreatingDraft'];
  createDraftError: AppState['create']['createDraftError'];
  isDeletingDraft: AppState['create']['isDeletingDraft'];
  deleteDraftError: AppState['create']['deleteDraftError'];
  isVerified: ReturnType<typeof getIsVerified>;
}

interface DispatchProps {
  fetchDrafts: typeof fetchDrafts;
  createDraft: typeof createDraft;
  deleteDraft: typeof deleteDraft;
  fetchAndCreateDrafts: typeof fetchAndCreateDrafts;
}

interface OwnProps {
  createIfNone?: boolean;
  createWithRfpId?: number;
}

type Props = StateProps & DispatchProps & OwnProps;

interface State {
  deletingId: number | null;
}

class DraftList extends React.Component<Props, State> {
  state: State = {
    deletingId: null,
  };

  componentDidMount() {
    const { createIfNone, createWithRfpId } = this.props;
    if (createIfNone || createWithRfpId) {
      this.props.fetchAndCreateDrafts({
        rfpId: createWithRfpId,
        redirect: true,
      });
    } else {
      this.props.fetchDrafts();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { isDeletingDraft, deleteDraftError, createDraftError } = this.props;
    if (prevProps.isDeletingDraft && !isDeletingDraft) {
      this.setState({ deletingId: null });
    }
    if (deleteDraftError && prevProps.deleteDraftError !== deleteDraftError) {
      message.error(deleteDraftError, 3);
    }
    if (createDraftError && prevProps.createDraftError !== createDraftError) {
      message.error(createDraftError, 3);
    }
  }

  render() {
    const { drafts, isCreatingDraft, isVerified } = this.props;
    const { deletingId } = this.state;

    if (!isVerified) {
      return (
        <div className="DraftList">
          <Placeholder
            title="Your email is not verified"
            subtitle="Please confirm your email before making a proposal."
          />
        </div>
      );
    }

    if (!drafts || isCreatingDraft) {
      return <Loader size="large" />;
    }

    let draftsEl;
    if (drafts.length) {
      draftsEl = (
        <div className="DraftList-drafts">
          {drafts.map(d => (
            <Spin tip="deleting..." spinning={deletingId === d.id} key={d.id}>
              <div className="DraftItem">
                <Popconfirm
                  key="delete"
                  title="Are you sure?"
                  onConfirm={() => this.deleteDraft(d.id)}
                >
                  <button className="DraftItem-delete">
                    <Icon type="close" />
                  </button>
                </Popconfirm>
                <div className="DraftItem-info">
                  <Link key="edit" to={`/proposals/${d.id}/edit`}>
                    <h3 className="DraftItem-info-title">
                      {d.title || <em>Untitled proposal</em>}
                      {d.status === STATUS.REJECTED && <em> (rejected)</em>}
                    </h3>
                    <div className="DraftItem-info-description">
                      {d.brief || <em>No description</em>}
                    </div>
                  </Link>
                </div>
              </div>
            </Spin>
          ))}
        </div>
      );
    } else {
      draftsEl = (
        <Placeholder
          title="You have no drafts"
          subtitle="Why not make one now? Click below to start."
        />
      );
    }

    return (
      <div className="DraftList">
        <h2 className="DraftList-title">Your drafts</h2>
        {draftsEl}
        <Button
          className="DraftList-create"
          type="primary"
          size="large"
          block
          onClick={() => this.createDraft()}
          loading={isCreatingDraft}
        >
          Create a new Proposal
        </Button>
      </div>
    );
  }

  private createDraft = (rfpId?: number) => {
    this.props.createDraft({ rfpId, redirect: true });
  };

  private deleteDraft = (proposalId: number) => {
    this.props.deleteDraft(proposalId);
    this.setState({ deletingId: proposalId });
  };
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(
  state => ({
    drafts: state.create.drafts,
    isFetchingDrafts: state.create.isFetchingDrafts,
    fetchDraftsError: state.create.fetchDraftsError,
    isCreatingDraft: state.create.isCreatingDraft,
    createDraftError: state.create.createDraftError,
    isDeletingDraft: state.create.isDeletingDraft,
    deleteDraftError: state.create.deleteDraftError,
    isVerified: getIsVerified(state),
  }),
  {
    fetchDrafts,
    createDraft,
    deleteDraft,
    fetchAndCreateDrafts,
  },
)(DraftList);
