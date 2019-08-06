import React, { ReactNode } from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import Markdown from 'components/Markdown';
import LinkableTabs from 'components/LinkableTabs';
import Loader from 'components/Loader';
import { proposalActions } from 'modules/proposals';
import { bindActionCreators, Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import { STATUS } from 'types';
import { Tabs, Icon, Dropdown, Menu, Button, Alert } from 'antd';
import { AlertProps } from 'antd/lib/alert';
import ExceptionPage from 'components/ExceptionPage';
import HeaderDetails from 'components/HeaderDetails';
import DetailBlock from './DetailBlock';
import TeamBlock from './TeamBlock';
import RFPBlock from './RFPBlock';
import Milestones from './Milestones';
import CommentsTab from './Comments';
import UpdatesTab from './Updates';
import UpdateModal from './UpdateModal';
import CancelModal from './CancelModal';
import classnames from 'classnames';
import Follow from 'components/Follow';
import './index.less';

interface OwnProps {
  proposalId: number;
  isPreview?: boolean;
}

interface StateProps {
  detail: AppState['proposal']['detail'];
  isFetchingDetail: AppState['proposal']['isFetchingDetail'];
  detailError: AppState['proposal']['detailError'];
  user: AppState['auth']['user'];
}

interface DispatchProps {
  fetchProposal: proposalActions.TFetchProposal;
}

type Props = StateProps & DispatchProps & OwnProps & RouteComponentProps;

interface State {
  isBodyExpanded: boolean;
  isBodyOverflowing: boolean;
  isUpdateOpen: boolean;
  isCancelOpen: boolean;
}

export class ProposalDetail extends React.Component<Props, State> {
  state: State = {
    isBodyExpanded: false,
    isBodyOverflowing: false,
    isUpdateOpen: false,
    isCancelOpen: false,
  };

  bodyEl: HTMLElement | null = null;

  componentDidMount() {
    // always refresh from server
    this.props.fetchProposal(this.props.proposalId);

    if (this.props.detail) {
      this.checkBodyOverflow();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.checkBodyOverflow);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.checkBodyOverflow);
    }
  }

  componentDidUpdate() {
    if (this.props.detail) {
      this.checkBodyOverflow();
    }
  }

  render() {
    const { detail: proposal, isPreview, detailError } = this.props;
    const { isBodyExpanded, isBodyOverflowing, isCancelOpen, isUpdateOpen } = this.state;
    const showExpand = !isBodyExpanded && isBodyOverflowing;
    const wrongProposal = proposal && proposal.id !== this.props.proposalId;

    if (detailError) {
      return <ExceptionPage code="404" desc="Could not find that proposal" />;
    }
    if (!proposal || wrongProposal) {
      return <Loader size="large" />;
    }

    const isTrustee = proposal.isTeamMember;
    const isLive = proposal.status === STATUS.LIVE;

    const adminMenu = (
      <Menu>
        <Menu.Item disabled={!isLive} onClick={this.openUpdateModal}>
          Post an Update
        </Menu.Item>
        <Menu.Item disabled={!isLive} onClick={this.openCancelModal}>
          Cancel proposal
        </Menu.Item>
      </Menu>
    );

    // BANNER
    const statusBanner = {
      [STATUS.PENDING]: {
        blurb: (
          <>
            Your proposal is being reviewed and is only visible to the team. You will get
            an email when it is complete.
          </>
        ),
        type: 'warning',
      },
      [STATUS.APPROVED]: {
        blurb: (
          <>
            Your proposal has been approved! It is currently only visible to the team.
            Visit your <Link to="/profile?tab=pending">profile's pending tab</Link> to
            publish.
          </>
        ),
        type: 'success',
      },
      [STATUS.REJECTED]: {
        blurb: (
          <>
            Your proposal was rejected and is only visible to the team. Visit your{' '}
            <Link to="/profile?tab=pending">profile's pending tab</Link> for more
            information.
          </>
        ),
        type: 'error',
      },
    } as { [key in STATUS]: { blurb: ReactNode; type: AlertProps['type'] } };
    let banner = statusBanner[proposal.status];
    if (!banner && proposal.private) {
      banner = {
        blurb: 'This proposal is private. It is only viewable by the team.',
        type: 'info',
      };
    }
    if (isPreview) {
      banner = {
        blurb: (
          <>
            This is a preview of your proposal. It has not yet been published.{' '}
            <a onClick={this.goBack}>Click here to go back</a>.
          </>
        ),
        type: 'info',
      };
    }

    return (
      <div className="Proposal">
        <HeaderDetails title={proposal.title} description={proposal.brief} />
        {banner && (
          <div className="Proposal-banner">
            <Alert type={banner.type} message={banner.blurb} showIcon={false} banner />
          </div>
        )}
        <div className="Proposal-top">
          <div className="Proposal-top-main">
            <div className="Proposal-top-main-title">
              <h1>{proposal ? proposal.title : <span>&nbsp;</span>}</h1>
              {isLive && (
                <div className="Proposal-top-main-title-menu">
                  {isTrustee && (
                    <Dropdown
                      overlay={adminMenu}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button>
                        <span>Actions</span>
                        <Icon type="down" style={{ marginRight: '-0.25rem' }} />
                      </Button>
                    </Dropdown>
                  )}
                  <Follow proposal={proposal} />
                </div>
              )}
            </div>
            <div className="Proposal-top-main-block" style={{ flexGrow: 1 }}>
              <div
                ref={el => (this.bodyEl = el)}
                className={classnames({
                  ['Proposal-top-main-block-bodyText']: true,
                  ['is-expanded']: isBodyExpanded,
                })}
              >
                {proposal ? <Markdown source={proposal.content} /> : <Loader />}
              </div>
              {showExpand && (
                <div className="Proposal-top-main-block-bodyExpand">
                  <Button onClick={this.expandBody} block>
                    Read more
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="Proposal-top-side">
            <DetailBlock proposal={proposal} isPreview={isPreview} />
            <TeamBlock proposal={proposal} />
            {proposal.rfp && <RFPBlock rfp={proposal.rfp} />}
          </div>
        </div>

        <div className="Proposal-bottom">
          <LinkableTabs scrollToTabs defaultActiveKey="milestones">
            <Tabs.TabPane tab="Milestones" key="milestones">
              <Milestones proposal={proposal} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Discussion" key="discussions" disabled={!isLive}>
              <CommentsTab proposalId={proposal.id} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Updates" key="updates" disabled={!isLive}>
              <UpdatesTab proposalId={proposal.id} />
            </Tabs.TabPane>
          </LinkableTabs>
        </div>

        {isTrustee && (
          <>
            <UpdateModal
              proposalId={proposal.id}
              isVisible={isUpdateOpen}
              handleClose={this.closeUpdateModal}
            />
            <CancelModal
              proposal={proposal}
              isVisible={isCancelOpen}
              handleClose={this.closeCancelModal}
            />
          </>
        )}
      </div>
    );
  }

  private expandBody = () => {
    this.setState({ isBodyExpanded: true });
  };

  private checkBodyOverflow = () => {
    const { isBodyExpanded, isBodyOverflowing } = this.state;
    if (isBodyExpanded || !this.bodyEl) {
      return;
    }

    if (isBodyOverflowing && this.bodyEl.scrollHeight <= this.bodyEl.clientHeight) {
      this.setState({ isBodyOverflowing: false });
    } else if (
      !isBodyOverflowing &&
      this.bodyEl.scrollHeight > this.bodyEl.clientHeight
    ) {
      this.setState({ isBodyOverflowing: true });
    }
  };

  private goBack = () => {
    this.props.history.goBack();
  };

  private openUpdateModal = () => this.setState({ isUpdateOpen: true });
  private closeUpdateModal = () => this.setState({ isUpdateOpen: false });

  private openCancelModal = () => this.setState({ isCancelOpen: true });
  private closeCancelModal = () => this.setState({ isCancelOpen: false });
}

function mapStateToProps(state: AppState, _: OwnProps) {
  return {
    detail: state.proposal.detail,
    isFetchingDetail: state.proposal.isFetchingDetail,
    detailError: state.proposal.detailError,
    user: state.auth.user,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return bindActionCreators({ ...proposalActions }, dispatch);
}

const withConnect = connect<StateProps, DispatchProps, OwnProps, AppState>(
  mapStateToProps,
  mapDispatchToProps,
);

const ConnectedProposal = compose<Props, OwnProps>(
  withRouter,
  withConnect,
)(ProposalDetail);

export default ConnectedProposal;
