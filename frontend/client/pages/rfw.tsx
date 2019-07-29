import React, { Component } from 'react';
import RFW from 'components/RFW';
import { extractIdFromSlug } from 'utils/api';

import { withRouter, RouteComponentProps } from 'react-router';

type RouteProps = RouteComponentProps<any>;

class RFWPage extends Component<RouteProps> {
  render() {
    const rfwId = extractIdFromSlug(this.props.match.params.id);
    return <RFW rfwId={rfwId} />;
  }
}

export default withRouter(RFWPage);
