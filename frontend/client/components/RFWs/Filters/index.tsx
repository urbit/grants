import React from 'react';
import qs from 'query-string';
import { withRouter, RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
import { Select, Checkbox, Radio } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { SelectValue } from 'antd/lib/select';
import {
  RFW_SORT,
  RFW_SORT_LABELS,
  PROPOSAL_CATEGORY,
  CATEGORY_UI,
  RFW_STATUS,
  RFW_STATUS_UI,
} from 'api/constants';
import { typedKeys } from 'utils/ts';
import { RFWPage } from 'types';
import { AppState } from 'store/reducers';
import { fetchTags } from 'modules/bounties/actions';
import './style.less';

interface StateProps {
  tags: AppState['rfw']['tags'];
  isFetchingTags: AppState['rfw']['isFetchingTags'];
}

interface DispatchProps {
  fetchTags: typeof fetchTags;
}

interface OwnProps {
  sort: RFWPage['sort'];
  filters: RFWPage['filters'];
  handleChangeSort(sort: RFWPage['sort']): void;
  handleChangeFilters(filters: RFWPage['filters']): void;
}

type Props = StateProps & DispatchProps & OwnProps & RouteComponentProps;

class RFWFilters extends React.Component<Props> {
  componentDidMount() {
    const { tags, filters, location } = this.props;
    if (!tags.length) {
      this.props.fetchTags();
    }

    const args = qs.parse(location.search);
    if (args.tags) {
      this.props.handleChangeFilters({
        ...filters,
        tags: args.tags.split(','),
      });
    }
  }

  render() {
    const { sort, filters, tags, isFetchingTags } = this.props;
    const showTags = !isFetchingTags && !!tags.length;

    return (
      <div className="RFWFilters">
        <div className="RFWFilters-section RFWFilters-sort">
          <h3 className="RFWFilters-section-title">Sort</h3>
          <Select onChange={this.handleChangeSort} value={sort} style={{ width: '100%' }}>
            {typedKeys(RFW_SORT).map(s => (
              <Select.Option key={s} value={s}>
                {RFW_SORT_LABELS[s]}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="RFWFilters-section RFWFilters-category">
          <h3 className="RFWFilters-section-title">Category</h3>
          {typedKeys(PROPOSAL_CATEGORY).map(c => (
            <div key={c} className="RFWFilters-category-option">
              <Checkbox
                checked={filters.category.includes(c as PROPOSAL_CATEGORY)}
                value={c}
                onChange={this.handleCategoryChange}
              >
                {CATEGORY_UI[c].label}
              </Checkbox>
            </div>
          ))}
        </div>

        {showTags && (
          <div className="RFWFilters-section RFWFilters-tags">
            <h4 className="RFWFilters-section-title">Tags</h4>
            {tags.map(t => (
              <div key={t.id} className="RFWFilters-tags-option">
                <Checkbox
                  checked={filters.tags.includes(t.id)}
                  value={t.id}
                  onChange={this.handleTagChange}
                >
                  {t.text}
                </Checkbox>
              </div>
            ))}
          </div>
        )}

        <div className="RFWFilters-section RFWFilters-status">
          <h4 className="RFWFilters-section-title">Bounty status</h4>
          <div className="RFWFilters-status-option">
            <Radio
              value="ALL"
              name="status"
              checked={filters.status.length === 0}
              onChange={this.handleStatusChange}
            >
              All
            </Radio>
          </div>
          {typedKeys(RFW_STATUS)
            .filter(s => s !== RFW_STATUS.DRAFT)
            .map(s => (
              <div key={s} className="RFWFilters-status-option">
                <Radio
                  value={s}
                  name="status"
                  checked={filters.status.includes(s as RFW_STATUS)}
                  onChange={this.handleStatusChange}
                >
                  {RFW_STATUS_UI[s].label}
                </Radio>
              </div>
            ))}
        </div>

        <a className="RFWFilters-reset" onClick={this.resetFilters}>
          Reset filters
        </a>
      </div>
    );
  }

  private handleCategoryChange = (ev: RadioChangeEvent) => {
    const { filters } = this.props;
    const cat = ev.target.value as PROPOSAL_CATEGORY;
    const category = ev.target.checked
      ? [...filters.category, cat]
      : filters.category.filter(c => c !== cat);

    this.props.handleChangeFilters({
      ...filters,
      category,
    });
  };

  private handleStatusChange = (ev: RadioChangeEvent) => {
    let status = [] as RFW_STATUS[];
    if (ev.target.value !== 'ALL') {
      status = [ev.target.value as RFW_STATUS];
    }
    this.props.handleChangeFilters({
      ...this.props.filters,
      status,
    });
  };

  private handleTagChange = (ev: RadioChangeEvent) => {
    const { filters } = this.props;
    const tag = ev.target.value;
    const tags = ev.target.checked
      ? [...filters.tags, tag]
      : filters.tags.filter(t => t !== tag);

    this.props.handleChangeFilters({
      ...filters,
      tags,
    });
  };

  private handleChangeSort = (sort: SelectValue) => {
    this.props.handleChangeSort(sort as RFW_SORT);
  };

  private resetFilters = (ev?: React.MouseEvent<HTMLAnchorElement>) => {
    if (ev) {
      ev.preventDefault();
    }
    this.props.handleChangeFilters({
      category: [],
      status: [],
      tags: [],
    });
  };
}

const ConnectedRFWFilters = connect<StateProps, DispatchProps, OwnProps, AppState>(
  s => ({
    tags: s.rfw.tags,
    isFetchingTags: s.rfw.isFetchingTags,
  }),
  { fetchTags },
)(RFWFilters);

export default withRouter(ConnectedRFWFilters);
