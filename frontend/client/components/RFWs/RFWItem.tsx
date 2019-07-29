import React from 'react';
import moment from 'moment';
import ResultItem from 'components/ResultItem';
import { RFW, RFW_STATUS } from 'types';
import './RFWItem.less';

interface Props {
  rfw: RFW;
}

export default class RFPItem extends React.Component<Props> {
  render() {
    const { rfw } = this.props;
    const { urlId, title, brief, bounty, dateCreated, status } = rfw;

    const infos = [
      {
        title: 'Bounty',
        content: `${bounty} STARS`,
      },
      {
        title: 'Started',
        content: moment(dateCreated * 1000).format('MMMM Do, YYYY'),
      },
      {
        title: 'Status',
        content:
          status === RFW_STATUS.LIVE ? (
            'Open for application'
          ) : (
            <span className="is-error">Closed</span>
          ),
      },
    ];

    return (
      <ResultItem to={`/rfws/${urlId}`} title={title} content={brief} infos={infos} />
    );
  }
}
