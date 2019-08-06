import React from 'react';
import moment from 'moment';
import { Icon } from 'antd';
import { Proposal, STATUS } from 'types';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { AppState } from 'store/reducers';
import { withRouter } from 'react-router';
import Loader from 'components/Loader';
import { CATEGORY_UI, PROPOSAL_STAGE } from 'api/constants';
import './index.less';

interface OwnProps {
  proposal: Proposal;
  isPreview?: boolean;
}

interface StateProps {
  authUser: AppState['auth']['user'];
}

type Props = OwnProps & StateProps;

export class ProposalDetailBlock extends React.Component<Props> {
  render() {
    const { proposal } = this.props;
    let content;
    if (proposal) {
      const { target } = proposal;
      const datePublished = proposal.datePublished || Date.now() / 1000;

      const isLive = proposal.status === STATUS.LIVE;
      const isComplete = proposal.stage === PROPOSAL_STAGE.COMPLETED;
      const isCanceled = proposal.stage === PROPOSAL_STAGE.CANCELED;

      content = (
        <React.Fragment>
          {isLive && (
            <div className="ProposalDetailBlock-info">
              <div className="ProposalDetailBlock-info-label">Started</div>
              <div className="ProposalDetailBlock-info-value">
                {moment(datePublished * 1000).format('MMMM Do, YYYY')}
              </div>
            </div>
          )}
          <div className="ProposalDetailBlock-info">
            <div className="ProposalDetailBlock-info-label">Category</div>
            <div
              className="ProposalDetailBlock-info-value"
              style={{ color: CATEGORY_UI[proposal.category].color }}
            >
              {CATEGORY_UI[proposal.category].label}
            </div>
          </div>
          <div className="ProposalDetailBlock-info">
            <div className="ProposalDetailBlock-info-label">Funding</div>
            <div className="ProposalDetailBlock-info-value">{target} STARS</div>
          </div>

          <div
            className={`ProposalDetailBlock-status ${isComplete ? 'is-complete' : ''} ${
              isCanceled ? 'is-canceled' : ''
            }`}
          >
            {isCanceled ? (
              <>
                <Icon type="close" />
                <span>Proposal canceled</span>
              </>
            ) : isComplete ? (
              <>
                <Icon type="check" />
                <span>Proposal completed</span>
              </>
            ) : (
              <></>
            )}
          </div>
        </React.Fragment>
      );
    } else {
      content = <Loader />;
    }

    return (
      <div className="ProposalDetailBlock Proposal-top-side-block">
        <h2 className="Proposal-top-main-block-title">Details</h2>
        <div className="Proposal-top-main-block">{content}</div>
      </div>
    );
  }
}

function mapStateToProps(state: AppState) {
  return {
    authUser: state.auth.user,
  };
}

const withConnect = connect(mapStateToProps);

const ConnectedProposalDetailBlock = compose<Props, OwnProps>(
  withRouter,
  withConnect,
)(ProposalDetailBlock);

export default ConnectedProposalDetailBlock;
