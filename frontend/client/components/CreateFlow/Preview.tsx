import React from 'react';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router';
import { ProposalDetail } from 'components/Proposal';
import { AppState } from 'store/reducers';
import { makeProposalPreviewFromDraft } from 'modules/create/utils';
import { ProposalDraft } from 'types';
import './Preview.less';

interface StateProps {
  form: ProposalDraft;
}

type Props = StateProps & RouteComponentProps;

class CreateFlowPreview extends React.Component<Props> {
  render() {
    const { form, ...routeProps } = this.props;
    const proposal = makeProposalPreviewFromDraft(form);
    return (
      <div className="Preview">
        <ProposalDetail
          user={null}
          proposalId={0}
          fetchProposal={(() => null) as any}
          detail={proposal}
          isFetchingDetail={false}
          detailError={null}
          isPreview
          {...routeProps}
        />
      </div>
    );
  }
}

const ConnectedCreateFlowPreview = connect<StateProps, {}, {}, AppState>(state => ({
  form: state.create.form as ProposalDraft,
}))(CreateFlowPreview);

export default withRouter(ConnectedCreateFlowPreview);
