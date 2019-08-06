import React from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { rfwActions } from 'modules/bounties';
import { bindActionCreators, Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import { Input, Drawer, Icon, Button } from 'antd';
import RFWResults from './Results';
import RFWFilters from './Filters';
import { RFW_SORT } from 'api/constants';
import './style.less';
import { jumpToTop } from 'utils/misc';

interface StateProps {
  page: AppState['rfw']['page'];
}

interface DispatchProps {
  fetchRFWs: typeof rfwActions['fetchRFWs'];
  setRFWPage: typeof rfwActions['setRFWPage'];
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

  private setSearch = debounce(search => this.props.setRFWPage({ search }), 1000);

  componentDidMount() {
    this.props.fetchRFWs();
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
      <RFWFilters
        sort={sort}
        filters={filters}
        handleChangeSort={this.handleChangeSort}
        handleChangeFilters={this.handleChangeFilters}
      />
    );
    return (
      <div className="RFWs">
        <div className="RFWs-controls">
          <h3 className="RFWs-controls-search-title">Search</h3>
          <div className="RFWs-controls-search">
            <Input.Search
              placeholder="Search for a bounty"
              onChange={this.handleChangeSearch}
              value={this.state.searchQuery}
            />
            <Button
              className="RFWs-controls-search-filter"
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
            <div className="RFWs-controls-filters">{filtersComponent}</div>
          )}
        </div>

        <div className="RFWs-results">
          <RFWResults page={this.props.page} onPageChange={this.handlePageChange} />
        </div>
      </div>
    );
  }

  private handleChangeSearch = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = ev.currentTarget.value;
    this.setState({ searchQuery });
    // debounced call to setRFWPage
    this.setSearch(searchQuery);
  };

  private handleChangeSort = (sort: RFW_SORT) => {
    this.props.setRFWPage({ sort });
  };

  private handleChangeFilters = (filters: StateProps['page']['filters']) => {
    this.props.setRFWPage({ filters });
  };

  private handlePageChange = (page: number) => {
    this.props.setRFWPage({ page });
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
    page: state.rfw.page,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return bindActionCreators(rfwActions, dispatch);
}

const ConnectedProposals = connect<StateProps, DispatchProps, {}, AppState>(
  mapStateToProps,
  mapDispatchToProps,
)(Proposals);

export default ConnectedProposals;
