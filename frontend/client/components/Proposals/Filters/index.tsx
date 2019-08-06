import React from 'react';
import { Select, Checkbox, Radio } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { SelectValue } from 'antd/lib/select';
import {
  PROPOSAL_SORT,
  SORT_LABELS,
  PROPOSAL_CATEGORY,
  CATEGORY_UI,
  PROPOSAL_STAGE,
  STAGE_UI,
} from 'api/constants';
import { typedKeys } from 'utils/ts';
import { ProposalPage } from 'types';
import './style.less';

interface Props {
  sort: ProposalPage['sort'];
  filters: ProposalPage['filters'];
  handleChangeSort(sort: ProposalPage['sort']): void;
  handleChangeFilters(filters: ProposalPage['filters']): void;
}

export default class ProposalFilters extends React.Component<Props> {
  render() {
    const { sort, filters } = this.props;

    return (
      <div className="ProposalFilters">
        <div className="ProposalFilters-section ProposalFilters-sort">
          <h3 className="ProposalFilters-section-title">Sort</h3>
          <Select onChange={this.handleChangeSort} value={sort} style={{ width: '100%' }}>
            {typedKeys(PROPOSAL_SORT).map(s => (
              <Select.Option key={s} value={s}>
                {SORT_LABELS[s]}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="ProposalFilters-section ProposalFilters-category">
          <h3 className="ProposalFilters-section-title">Category</h3>
          {typedKeys(PROPOSAL_CATEGORY).map(c => (
            <div key={c} className="ProposalFilters-category-option">
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

        <div className="ProposalFilters-section ProposalFilters-stage">
          <h4 className="ProposalFilters-section-title">Proposal stage</h4>
          <div className="ProposalFilters-stage-option">
            <Radio
              value="ALL"
              name="stage"
              checked={filters.stage.length === 0}
              onChange={this.handleStageChange}
            >
              All
            </Radio>
          </div>
          {typedKeys(PROPOSAL_STAGE)
            .filter(
              s =>
                ![
                  PROPOSAL_STAGE.PREVIEW,
                  PROPOSAL_STAGE.FAILED,
                  PROPOSAL_STAGE.CANCELED,
                  PROPOSAL_STAGE.FUNDING_REQUIRED,
                ].includes(s as PROPOSAL_STAGE),
            ) // skip a few
            .map(s => (
              <div key={s} style={{ marginBottom: '0.25rem' }}>
                <Radio
                  value={s}
                  name="stage"
                  checked={filters.stage.includes(s as PROPOSAL_STAGE)}
                  onChange={this.handleStageChange}
                >
                  {STAGE_UI[s].label}
                </Radio>
              </div>
            ))}
        </div>

        <a className="ProposalFilters-reset" onClick={this.resetFilters}>
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

  private handleStageChange = (ev: RadioChangeEvent) => {
    let stage = [] as PROPOSAL_STAGE[];
    if (ev.target.value !== 'ALL') {
      stage = [ev.target.value as PROPOSAL_STAGE];
    }
    this.props.handleChangeFilters({
      ...this.props.filters,
      stage,
    });
  };

  private handleChangeSort = (sort: SelectValue) => {
    this.props.handleChangeSort(sort as PROPOSAL_SORT);
  };

  private resetFilters = (ev?: React.MouseEvent<HTMLAnchorElement>) => {
    if (ev) {
      ev.preventDefault();
    }
    this.props.handleChangeFilters({
      category: [],
      stage: [],
    });
  };
}
