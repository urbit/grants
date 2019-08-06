import React from 'react';
import { findDOMNode } from 'react-dom';
import qs from 'query-string';
import { withRouter, RouteComponentProps } from 'react-router';

interface OwnProps {
  when: {
    arg: string;
    value: string;
  };
  className?: string;
}

type Props = OwnProps & RouteComponentProps;

class ScrollToDiv extends React.Component<Props> {
  componentDidMount() {
    const isScroll = this.getScrollToMatch(this.props.location);
    if (isScroll) {
      const earlyScrollY = window.scrollY;
      setTimeout(() => {
        // Don't wrestle control from the user
        if (window.scrollY !== earlyScrollY) {
          return;
        }
        const node = findDOMNode(this);
        if (node instanceof HTMLElement) {
          window.scrollTo({
            top: node.offsetTop,
            behavior: 'smooth',
          });
        }
      }, 500);
    }
  }

  render() {
    return <div className={this.props.className || ''}>{this.props.children}</div>;
  }

  private getScrollToMatch(location: RouteComponentProps['location']) {
    const {
      when: { arg, value },
    } = this.props;
    const args = qs.parse(location.search);
    const qsMatch = args[arg] === value;
    const urlMatch = location.pathname.endsWith(`${arg}/${value}`);
    return qsMatch || urlMatch;
  }
}

export default withRouter(ScrollToDiv);
