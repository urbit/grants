import React from 'react';
import { findDOMNode } from 'react-dom';
import qs from 'query-string';
import { History } from 'history';
import { withRouter, RouteComponentProps } from 'react-router';
import { Tabs } from 'antd';
import { TabsProps } from 'antd/lib/tabs';

interface OwnProps extends TabsProps {
  scrollToTabs?: boolean;
}

type Props = OwnProps & RouteComponentProps;

interface State {
  activeKey: string | undefined;
  defaultActiveKey: string | undefined;
}

class LinkableTabs extends React.Component<Props, State> {
  private historyUnlisten: () => void;
  private scrollTimeout: any;

  constructor(props: Props) {
    super(props);

    let { defaultActiveKey } = props;
    let activeKey = this.getDefaultKey();
    const tab = this.getTabFromUrl(props.location);
    if (tab) {
      defaultActiveKey = tab;
      activeKey = tab;
    }
    this.state = { defaultActiveKey, activeKey };
    this.historyUnlisten = this.props.history.listen(this.handlePop);
  }

  componentDidMount() {
    // Scroll to active tab if set
    const tab = this.getTabFromUrl(this.props.location);
    if (tab && this.props.scrollToTabs) {
      this.scrollTimeout = setTimeout(() => {
        // Don't wrestle control from the user
        if (window.scrollY !== 0) {
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

  componentWillUnmount() {
    clearTimeout(this.scrollTimeout);
    if (this.historyUnlisten) {
      this.historyUnlisten();
    }
  }

  render() {
    const { defaultActiveKey, activeKey } = this.state;
    return (
      <Tabs
        {...this.props}
        onChange={this.handleChange}
        activeKey={activeKey}
        defaultActiveKey={defaultActiveKey}
        animated={false}
      />
    );
  }

  private handleChange = (key: string) => {
    const { history, location } = this.props;
    history.push(`${location.pathname}?tab=${key}`);
    this.setState({ activeKey: key });

    if (this.props.onChange) {
      this.props.onChange(key);
    }
  };

  private handlePop: History.LocationListener = (location, action) => {
    if (action === 'POP') {
      const searchValues = qs.parse(location.search);
      const tab = searchValues.tab;
      this.setState({ activeKey: tab || this.getDefaultKey() });
    }
  };

  private getTabFromUrl(location: RouteComponentProps['location']): string | undefined {
    const args = qs.parse(location.search);
    return args.tab;
  }

  private getDefaultKey() {
    let firstKey = undefined as string | undefined;
    React.Children.forEach(this.props.children, child => {
      if (child && (child as any).key) {
        firstKey = firstKey || ((child as any).key as string);
      }
    });
    return firstKey;
  }
}

export default withRouter(LinkableTabs);
