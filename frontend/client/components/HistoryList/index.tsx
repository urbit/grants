import React from 'react';
import moment from 'moment';
import { ServerPage, HistoryEvent } from 'types';
import { List, Pagination } from 'antd';
import Loader from 'components/Loader';
import UserAvatar from 'components/UserAvatar';
import Markdown from 'components/Markdown';
import LogoAvatar from 'static/images/avatar-logo.png';
import { getHistory } from 'api/api';
import './index.less';

interface State {
  data: ServerPage<HistoryEvent> | null;
  isLoading: boolean;
  error: string;
}

export default class HistoryList extends React.Component<{}, State> {
  state: State = {
    data: null,
    isLoading: true,
    error: '',
  };

  componentDidMount() {
    this.changePage(1);
  }

  render() {
    const { data, isLoading, error } = this.state;

    if (error) {
      return error;
    }

    if (!data) {
      return <Loader />;
    }

    return (
      <div className="HistoryList">
        <h1 className="HistoryList-title">History</h1>
        <List
          loading={isLoading}
          dataSource={data.items}
          renderItem={(h: HistoryEvent) => (
            <List.Item key={h.id} className="HistoryList-item">
              <div className="HistoryList-item-image">
                {h.user ? <UserAvatar user={h.user} /> : <img src={LogoAvatar} />}
              </div>
              <div className="HistoryList-item-info">
                <h3 className="HistoryList-item-info-title">{h.title}</h3>
                <div className="HistoryList-item-info-date">
                  {moment(h.date * 1000).format('MMMM Do, YYYY')}
                </div>
                {h.content && (
                  <Markdown
                    className="HistoryList-item-info-content"
                    source={h.content}
                  />
                )}
              </div>
            </List.Item>
          )}
        />
        <Pagination
          current={data.page}
          total={data.total}
          pageSize={data.pageSize}
          onChange={this.changePage}
        />
      </div>
    );
  }

  private changePage = async (page: number) => {
    this.setState({ isLoading: true, error: '' });
    try {
      const res = await getHistory({
        page,
        search: '',
        sort: 'DATE:DESC',
        filters: [],
      });
      this.setState({ data: res.data });
    } catch (err) {
      this.setState({ error: err.message });
    }
    this.setState({ isLoading: false });
  };
}
