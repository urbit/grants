import React from 'react';
import { view } from 'react-easy-state';
import { hot } from 'react-hot-loader';
import { Switch, Route, RouteComponentProps, withRouter } from 'react-router';

import Template from 'components/Template';
import store from './store';
import Login from 'components/Login';
import MFAuth from 'components/MFAuth';
import Home from 'components/Home';
import Users from 'components/Users';
import UserDetail from 'components/UserDetail';
import Emails from 'components/Emails';
import Proposals from 'components/Proposals';
import ProposalDetail from 'components/ProposalDetail';
import RFWs from 'components/RFWs';
import RFWForm from 'components/RFWForm';
import RFWDetail from 'components/RFWDetail';
import HistoryEvents from 'components/HistoryEvents';
import HistoryForm from 'components/HistoryForm';
import Moderation from 'components/Moderation';
import AdminLog from 'components/AdminLog';
import Settings from 'components/Settings';

import 'styles/style.less';

type Props = RouteComponentProps<any>;

class Routes extends React.Component<Props> {
  render() {
    const { hasCheckedLogin, isLoggedIn, is2faAuthed } = store;
    if (!hasCheckedLogin) {
      return <div>checking auth status...</div>;
    }

    return (
      <Template>
        {!isLoggedIn ? (
          <Login />
        ) : !is2faAuthed ? (
          <MFAuth />
        ) : (
          <Switch>
            <Route path="/" exact={true} component={Home} />
            <Route path="/users/:id" component={UserDetail} />
            <Route path="/users" component={Users} />
            <Route path="/proposals/:id" component={ProposalDetail} />
            <Route path="/proposals" component={Proposals} />
            <Route path="/rfws/new" component={RFWForm} />
            <Route path="/rfws/:id/edit" component={RFWForm} />
            <Route path="/rfws/:id" component={RFWDetail} />
            <Route path="/rfws" component={RFWs} />
            <Route path="/history/new" component={HistoryForm} />
            <Route path="/history/:id/edit" component={HistoryForm} />
            <Route path="/history" component={HistoryEvents} />
            <Route path="/emails/:type?" component={Emails} />
            <Route path="/moderation" component={Moderation} />
            <Route path="/logs" component={AdminLog} />
            <Route path="/settings/2fa-reset" render={() => <MFAuth isReset={true} />} />
            <Route path="/settings" component={Settings} />
          </Switch>
        )}
      </Template>
    );
  }
}

const ConnectedRoutes = withRouter(view(Routes));
export default hot(module)(ConnectedRoutes);
