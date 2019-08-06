import React from 'react';
import {
  withRouter,
  RouteComponentProps,
  Redirect,
  Switch,
  Route,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Tabs, Badge } from 'antd';
import { usersActions } from 'modules/users';
import { AppState } from 'store/reducers';
import HeaderDetails from 'components/HeaderDetails';
import ProfileUser from './ProfileUser';
import ProfileEdit from './ProfileEdit';
import ProfilePendingList from './ProfilePendingList';
import ProfileProposal from './ProfileProposal';
import ProfileComment from './ProfileComment';
import ProfileInvite from './ProfileInvite';
import Placeholder from 'components/Placeholder';
import Loader from 'components/Loader';
import ExceptionPage from 'components/ExceptionPage';
import LinkableTabs from 'components/LinkableTabs';
import ProfileWork from './ProfileWork';
import './style.less';

interface StateProps {
  usersMap: AppState['users']['map'];
  authUser: AppState['auth']['user'];
}

interface DispatchProps {
  fetchUser: typeof usersActions['fetchUser'];
  fetchUserInvites: typeof usersActions['fetchUserInvites'];
}

type Props = RouteComponentProps<any> & StateProps & DispatchProps;

class Profile extends React.Component<Props> {
  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps: Props) {
    const userLookupId = this.props.match.params.id;
    const prevUserLookupId = prevProps.match.params.id;
    if (userLookupId !== prevUserLookupId) {
      window.scrollTo(0, 0);
      this.fetchData();
    }
  }

  render() {
    const { authUser, match, location } = this.props;
    const userLookupParam = match.params.id;

    if (!userLookupParam) {
      if (authUser && authUser.id) {
        return <Redirect to={{ ...location, pathname: `/profile/${authUser.id}` }} />;
      } else {
        return <Redirect to={{ ...location, pathname: '/auth' }} />;
      }
    }

    const user = this.props.usersMap[userLookupParam];
    const waiting = !user || !user.hasFetched;
    const isAuthedUser = user && authUser && user.id === authUser.id;

    if (waiting) {
      return <Loader size="large" />;
    }

    if (user.fetchError) {
      return <ExceptionPage code="404" desc="No user could be found" />;
    }

    const { proposals, pendingProposals, comments, invites, work } = user;

    const isLoading = user.isFetching;
    const nonePending = pendingProposals.length === 0;
    const noneCreated = proposals.length === 0;
    const noneCommented = comments.length === 0;
    const noneInvites = user.hasFetchedInvites && invites.length === 0;
    const workAndClaimLength = user.work.reduce((sum, w) => sum + 1 + w.claims.length, 0);
    const noneWork = user.work.length === 0;

    return (
      <div className="Profile">
        <HeaderDetails
          title={`${user.displayName} is on Urbit Grants`}
          description={`Join ${
            user.displayName
          } in participating in the future of Urbit development!`}
          image={user.avatar ? user.avatar.imageUrl : undefined}
        />
        <Switch>
          <Route
            path={`${match.path}`}
            exact={true}
            render={() => <ProfileUser user={user} />}
          />
          <Route
            path={`${match.path}/edit`}
            exact={true}
            render={() => <ProfileEdit user={user} />}
          />
        </Switch>
        <div className="Profile-tabs">
          <LinkableTabs defaultActiveKey={(isAuthedUser && 'pending') || 'created'}>
            {isAuthedUser && (
              <Tabs.TabPane
                tab={TabTitle('Pending', pendingProposals.length)}
                key="pending"
              >
                <div>
                  {nonePending && (
                    <Placeholder
                      loading={isLoading}
                      title="No pending proposals"
                      subtitle="You do not have any proposals awaiting approval."
                    />
                  )}
                  <ProfilePendingList proposals={pendingProposals} />
                </div>
              </Tabs.TabPane>
            )}
            <Tabs.TabPane tab={TabTitle('Created', proposals.length)} key="created">
              <div>
                {noneCreated && (
                  <Placeholder
                    loading={isLoading}
                    title="No created proposals"
                    subtitle="There have not been any created proposals."
                  />
                )}
                {proposals.map(p => (
                  <ProfileProposal key={p.id} proposal={p} />
                ))}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={TabTitle('Work', workAndClaimLength)} key="work">
              <div>
                {noneWork && (
                  <Placeholder
                    loading={isLoading}
                    title="No work"
                    subtitle="This user has not become a worker."
                  />
                )}
                {work.map(w => (
                  <ProfileWork key={w.id} worker={w} />
                ))}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={TabTitle('Comments', comments.length)} key="comments">
              <div>
                {noneCommented && (
                  <Placeholder
                    loading={isLoading}
                    title="No comments"
                    subtitle="There have not been any comments made"
                  />
                )}
                {comments.map(c => (
                  <ProfileComment key={c.id} userName={user.displayName} comment={c} />
                ))}
              </div>
            </Tabs.TabPane>
            {isAuthedUser && (
              <Tabs.TabPane
                tab={TabTitle('Invites', invites.length)}
                key="invites"
                disabled={!user.hasFetchedInvites}
              >
                <div>
                  {noneInvites && (
                    <Placeholder
                      loading={isLoading}
                      title="No invitations"
                      subtitle="You’ll be notified when you’ve been invited to join a proposal"
                    />
                  )}
                  {invites.map(invite => (
                    <ProfileInvite key={invite.id} userId={user.id} invite={invite} />
                  ))}
                </div>
              </Tabs.TabPane>
            )}
          </LinkableTabs>
        </div>
      </div>
    );
  }

  private fetchData() {
    const { match } = this.props;
    const userLookupId = match.params.id;
    if (userLookupId) {
      this.props.fetchUser(userLookupId);
      this.props.fetchUserInvites(userLookupId);
    }
  }
}

const TabTitle = (disp: string, count: number) => (
  <div>
    {disp}
    <Badge
      className={`Profile-tabBadge ${count > 0 ? 'is-not-zero' : 'is-zero'}`}
      showZero={true}
      count={count}
    />
  </div>
);

const withConnect = connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    usersMap: state.users.map,
    authUser: state.auth.user,
  }),
  {
    fetchUser: usersActions.fetchUser,
    fetchUserInvites: usersActions.fetchUserInvites,
  },
);

export default compose<Props, {}>(
  withRouter,
  withConnect,
)(Profile);
