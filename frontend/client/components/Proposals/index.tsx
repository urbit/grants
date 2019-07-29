import React from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { proposalActions } from 'modules/proposals';
import { bindActionCreators, Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import { Input, Drawer, Icon, Button } from 'antd';
import ProposalResults from './Results';
import ProposalFilters from './Filters';
import { PROPOSAL_SORT } from 'api/constants';
import './style.less';
import { jumpToTop } from 'utils/misc';

interface StateProps {
  page: AppState['proposal']['page'];
}

interface DispatchProps {
  fetchProposals: typeof proposalActions['fetchProposals'];
  setProposalPage: typeof proposalActions['setProposalPage'];
}

type Props = StateProps & DispatchProps;

interface State {
  isFiltersDrawered: boolean;
  isDrawerShowing: boolean;
  searchQuery: string;
}

class Proposals extends React.Component<Props, State> {
  state: State = {
    isFiltersDrawered: false,
    isDrawerShowing: false,
    // partially controlled search - set it at construction from store
    searchQuery: this.props.page.search,
  };

  private setSearch = debounce(search => this.props.setProposalPage({ search }), 1000);

  componentDidMount() {
    this.props.fetchProposals();
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const { isFiltersDrawered, isDrawerShowing } = this.state;
    const { filters, sort } = this.props.page;
    const filtersComponent = (
      <ProposalFilters
        sort={sort}
        filters={filters}
        handleChangeSort={this.handleChangeSort}
        handleChangeFilters={this.handleChangeFilters}
      />
    );
    return (
      <div className="Proposals">
        <div className="Proposals-controls">
          <h3 className="Proposals-controls-search-title">Search</h3>
          <div className="Proposals-controls-search">
            <Input.Search
              placeholder="Search for a proposal"
              onChange={this.handleChangeSearch}
              value={this.state.searchQuery}
            />
            <Button
              className="Proposals-controls-search-filter"
              type="primary"
              onClick={this.openFilterDrawer}
            >
              <Icon type="filter" /> Filters
            </Button>
          </div>

          {isFiltersDrawered ? (
            <Drawer
              placement="right"
              visible={isDrawerShowing}
              onClose={this.closeFilterDrawer}
              closable={false}
              width={300}
            >
              {filtersComponent}
              <Button
                type="primary"
                onClick={this.closeFilterDrawer}
                style={{ marginTop: '1rem' }}
                block
              >
                Done
              </Button>
            </Drawer>
          ) : (
            <div className="Proposals-controls-filters">{filtersComponent}</div>
          )}
        </div>

        <div className="Proposals-results">
          <ProposalResults page={this.props.page} onPageChange={this.handlePageChange} />
        </div>
      </div>
    );
  }

  private handleChangeSearch = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = ev.currentTarget.value;
    this.setState({ searchQuery });
    // debounced call to setProposalPage
    this.setSearch(searchQuery);
  };

  private handleChangeSort = (sort: PROPOSAL_SORT) => {
    this.props.setProposalPage({ sort });
  };

  private handleChangeFilters = (filters: StateProps['page']['filters']) => {
    this.props.setProposalPage({ filters });
  };

  private handlePageChange = (page: number) => {
    this.props.setProposalPage({ page });
    jumpToTop();
  };

  private handleResize = () => {
    if (this.state.isFiltersDrawered && window.innerWidth > 820) {
      this.setState({
        isFiltersDrawered: false,
        isDrawerShowing: false,
      });
    } else if (!this.state.isFiltersDrawered && window.innerWidth <= 820) {
      this.setState({
        isFiltersDrawered: true,
        isDrawerShowing: false,
      });
    }
  };

  private openFilterDrawer = () => this.setState({ isDrawerShowing: true });
  private closeFilterDrawer = () => this.setState({ isDrawerShowing: false });
}

function mapStateToProps(state: AppState) {
  return {
    page: state.proposal.page,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return bindActionCreators(proposalActions, dispatch);
}

const ConnectedProposals = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Proposals);

export default ConnectedProposals;
