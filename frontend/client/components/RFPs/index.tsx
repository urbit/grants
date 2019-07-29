import React from 'react';
import { connect } from 'react-redux';
import { fetchRfps } from 'modules/rfps/actions';
import { AppState } from 'store/reducers';
import { RFP } from 'types';
import { RFP_STATUS } from 'api/constants';
import Loader from 'components/Loader';
import Placeholder from 'components/Placeholder';
import RFPItem from './RFPItem';
import './index.less';

interface StateProps {
  rfps: AppState['rfps']['rfps'];
  isFetchingRfps: AppState['rfps']['isFetchingRfps'];
  hasFetchedRfps: AppState['rfps']['hasFetchedRfps'];
  fetchRfpsError: AppState['rfps']['fetchRfpsError'];
}

interface DispatchProps {
  fetchRfps: typeof fetchRfps;
}

type Props = StateProps & DispatchProps;

class RFPs extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchRfps();
  }

  render() {
    const { rfps, isFetchingRfps, hasFetchedRfps, fetchRfpsError } = this.props;

    let rfpsEl;
    if (fetchRfpsError) {
      rfpsEl = (
        <div className="RFPs-error">
          <Placeholder
            title="Something went wrong"
            subtitle="We had an issue fetching requests, try again later"
          />
        </div>
      );
    } else if (!hasFetchedRfps && isFetchingRfps) {
      rfpsEl = (
        <div className="RFPs-loading">
          <Loader size="large" />
        </div>
      );
    } else {
      const live = rfps.filter(rfp => rfp.status === RFP_STATUS.LIVE);
      const closed = rfps.filter(rfp => rfp.status === RFP_STATUS.CLOSED);
      rfpsEl = (
        <>
          <div className="RFPs-section">
            <h2 className="RFPs-section-title">Open Requests</h2>
            {this.renderRfpsList(live)}
          </div>
          {!!closed.length && (
            <div className="RFPs-section">
              <h2 className="RFPs-section-title">Closed Requests</h2>
              {this.renderRfpsList(closed, true)}
            </div>
          )}
        </>
      );
    }

    return <div className="RFPs">{rfpsEl}</div>;
  }

  private renderRfpsList = (rfps: RFP[], isSmall?: boolean) => {
    return (
      <div className="RFPs-section-list">
        {rfps.map(rfp => (
          <RFPItem key={rfp.id} rfp={rfp} isSmall={isSmall} />
        ))}
        {!rfps.length && (
          <Placeholder
            title="No requests are currently active"
            subtitle="Check back later for more opportunities"
            loading={this.props.isFetchingRfps}
          />
        )}
      </div>
    );
  };
}

export default connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    rfps: state.rfps.rfps,
    isFetchingRfps: state.rfps.isFetchingRfps,
    hasFetchedRfps: state.rfps.hasFetchedRfps,
    fetchRfpsError: state.rfps.fetchRfpsError,
  }),
  { fetchRfps },
)(RFPs);
