import React from 'react';
import moment from 'moment';
import classnames from 'classnames';
import { Tag } from 'antd';
import { Link } from 'react-router-dom';
import { RFP } from 'types';
import './RFPItem.less';

interface Props {
  rfp: RFP;
  isSmall?: boolean;
}

export default class RFPItem extends React.Component<Props> {
  render() {
    const { rfp, isSmall } = this.props;
    const {
      urlId,
      title,
      brief,
      acceptedProposals,
      dateOpened,
      dateCloses,
      dateClosed,
      bounty,
      matching,
    } = rfp;
    const closeDate = dateCloses || dateClosed;

    const tags = [];
    if (!isSmall) {
      if (bounty) {
        tags.push(
          <Tag key="bounty" color="#530EEC">
            {bounty} bounty
          </Tag>,
        );
      }
      if (matching) {
        tags.push(
          <Tag key="matching" color="#1890ff">
            x2 matching
          </Tag>,
        );
      }
    }

    return (
      <Link
        className={classnames('RFPItem', isSmall && 'is-small')}
        to={`/requests/${urlId}`}
      >
        <h3 className="RFPItem-title">
          {title}
          {tags}
        </h3>
        <p className="RFPItem-brief">{brief}</p>

        <div className="RFPItem-details">
          <div className="RFPItem-details-detail">
            {moment(dateOpened * 1000).format('LL')}
            {closeDate && <> – {moment(closeDate * 1000).format('LL')}</>}
          </div>
          <div className="RFPItem-details-detail">
            {acceptedProposals.length} proposals approved
          </div>
        </div>
      </Link>
    );
  }
}
