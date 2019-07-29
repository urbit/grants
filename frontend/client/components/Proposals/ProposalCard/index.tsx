import React from 'react';
import moment from 'moment';
import ResultItem from 'components/ResultItem';
import { Proposal } from 'types';
import { CATEGORY_UI, PROPOSAL_STAGE } from 'api/constants';

export class ProposalCard extends React.Component<Proposal> {
  render() {
    const {
      title,
      brief,
      stage,
      urlId,
      category,
      team,
      currentMilestone,
      datePublished,
    } = this.props;

    const isComplete = stage === PROPOSAL_STAGE.COMPLETED;

    const infos = [
      {
        title: 'Current Milestone',
        content: isComplete ? (
          <span className="is-success">Proposal complete</span>
        ) : currentMilestone ? (
          currentMilestone.title
        ) : (
          'N/A'
        ),
      },
      {
        title: 'Started',
        content: moment((datePublished || 0) * 1000).format('MMMM Do, YYYY'),
      },
      {
        title: 'Category',
        content: (
          <span style={{ color: CATEGORY_UI[category].color }}>
            {CATEGORY_UI[category].label}
          </span>
        ),
      },
    ];

    return (
      <ResultItem
        to={`/proposals/${urlId}`}
        title={title}
        content={brief}
        users={team}
        infos={infos}
      />
    );
  }
}

export default ProposalCard;
