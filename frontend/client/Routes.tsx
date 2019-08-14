import React from 'react';
import { hot } from 'react-hot-loader';
import {
  Switch,
  Route,
  RouteProps,
  RouteComponentProps,
  withRouter,
  matchPath,
} from 'react-router';
import loadable from '@loadable/component';
import AuthRoute from 'components/AuthRoute';
import Template, { TemplateProps } from 'components/Template';
import ErrorWrap from 'components/ErrorWrap';
import Loader from 'components/Loader';
import { jumpToTop } from 'utils/misc';
import 'styles/style.less';

// wrap components in loadable...import & they will be split
// Make sure you specify chunkname! Must replace slashes with dashes.
const opts = { fallback: <Loader size="large" /> };
const Home = loadable(() => import('pages/index'), opts);
const Create = loadable(() => import('pages/create'), opts);
const ProposalEdit = loadable(() => import('pages/proposal-edit'), opts);
const Proposals = loadable(() => import('pages/proposals'), opts);
const Proposal = loadable(() => import('pages/proposal'), opts);
const Auth = loadable(() => import('pages/auth'));
const SignOut = loadable(() => import('pages/sign-out'), opts);
const Profile = loadable(() => import('pages/profile'), opts);
const Settings = loadable(() => import('pages/settings'), opts);
const Exception = loadable(() => import('pages/exception'), opts);
const About = loadable(() => import('pages/about'), opts);
const VerifyEmail = loadable(() => import('pages/email-verify'), opts);
const Callback = loadable(() => import('pages/callback'), opts);
const RecoverEmail = loadable(() => import('pages/email-recover'), opts);
const UnsubscribeEmail = loadable(() => import('pages/email-unsubscribe'), opts);
const RFP = loadable(() => import('pages/rfp'), opts);
const RFPs = loadable(() => import('pages/rfps'), opts);
const RFWs = loadable(() => import('pages/rfws'), opts);
const RFW = loadable(() => import('pages/rfw'), opts);
const History = loadable(() => import('pages/history'), opts);

interface RouteConfig extends RouteProps {
  route: RouteProps;
  template: TemplateProps;
  requiresAuth?: boolean;
  onlyLoggedIn?: boolean;
  onlyLoggedOut?: boolean;
}

const routeConfigs: RouteConfig[] = [
  {
    // Homepage
    route: {
      path: '/',
      component: Home,
      exact: true,
    },
    template: {
      title: 'Home',
      isHeaderTransparent: true,
      isFullScreen: true,
    },
  },
  {
    // Create proposal
    route: {
      path: '/create',
      component: Create,
    },
    template: {
      title: 'Create a Proposal',
    },
    onlyLoggedIn: true,
  },
  {
    // Browse proposals
    route: {
      path: '/proposals',
      component: Proposals,
      exact: true,
    },
    template: {
      title: 'Browse proposals',
    },
  },
  {
    // Proposal edit page
    route: {
      path: '/proposals/:id/edit',
      component: ProposalEdit,
    },
    template: {
      title: 'Edit proposal',
    },
    onlyLoggedIn: true,
  },
  {
    // Proposal detail page
    route: {
      path: '/proposals/:id',
      component: Proposal,
    },
    template: {
      title: 'Proposal',
    },
  },
  {
    // RFP list page,
    route: {
      path: '/requests',
      component: RFPs,
      exact: true,
    },
    template: {
      title: 'Requests',
    },
  },
  {
    // RFP detail page
    route: {
      path: '/requests/:id',
      component: RFP,
    },
    template: {
      title: 'Request',
    },
  },

  {
    // Browse rfws
    route: {
      path: '/rfws',
      component: RFWs,
      exact: true,
    },
    template: {
      title: 'Browse bounties',
    },
  },
  {
    // RFW detail page
    route: {
      path: '/rfws/:id',
      component: RFW,
    },
    template: {
      title: 'Bounty',
    },
  },

  {
    // Self profile
    route: {
      path: '/profile',
      component: Profile,
      exact: true,
    },
    template: {
      title: 'Profile',
    },
    onlyLoggedIn: true,
  },
  {
    // Settings page
    route: {
      path: '/profile/settings',
      component: Settings,
      exact: true,
    },
    template: {
      title: 'Settings',
    },
    onlyLoggedIn: true,
  },
  {
    // About page
    route: {
      path: '/about',
      component: About,
      exact: true,
    },
    template: {
      title: 'About',
    },
    onlyLoggedIn: false,
  },
  {
    // User profile
    route: {
      path: '/profile/:id',
      component: Profile,
    },
    template: {
      title: 'Profile',
    },
  },
  {
    // History list page
    route: {
      path: '/history',
      component: History,
    },
    template: {
      title: 'History',
    },
  },
  {
    // Sign out
    route: {
      path: '/auth/sign-out',
      component: SignOut,
      exact: true,
    },
    template: {
      title: 'Signed out',
    },
  },
  {
    // Sign in / sign up / recover (nested routes)
    route: {
      path: '/auth',
      component: Auth,
    },
    template: {
      title: 'Sign in',
    },
    onlyLoggedOut: true,
  },
  {
    // Verify email
    route: {
      path: '/email/verify',
      component: VerifyEmail,
      exact: true,
    },
    template: {
      title: 'Verify email',
    },
  },
  {
    // Recover email
    route: {
      path: '/email/recover',
      component: RecoverEmail,
      exact: true,
    },
    template: {
      title: 'Recover email',
    },
  },
  {
    // Unsubscribe email
    route: {
      path: '/email/unsubscribe',
      component: UnsubscribeEmail,
      exact: true,
    },
    template: {
      title: 'Unsubscribe email',
    },
  },
  {
    // oauth callbacks
    route: {
      path: '/callback',
      component: Callback,
    },
    template: {
      title: 'OAuth Callback',
    },
  },
  {
    // 404
    route: {
      path: '/*',
      render: () => <Exception code="404" />,
    },
    template: {
      title: 'Page not found',
    },
  },
];

type Props = RouteComponentProps<any>;

class Routes extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      jumpToTop();
    }
  }

  render() {
    const { pathname } = this.props.location;
    const currentRoute =
      routeConfigs.find(config => !!matchPath(pathname, config.route)) ||
      routeConfigs[routeConfigs.length - 1];
    const routeComponents = routeConfigs.map(config => {
      const { route, onlyLoggedIn, onlyLoggedOut } = config;
      if (onlyLoggedIn || onlyLoggedOut) {
        return (
          <AuthRoute
            key={route.path as string}
            onlyLoggedOut={onlyLoggedOut}
            {...route}
          />
        );
      } else {
        return <Route key={route.path as string} {...route} />;
      }
    });

    return (
      <Template {...currentRoute.template}>
        <ErrorWrap key={currentRoute.route.path as string}>
          <Switch>{routeComponents}</Switch>
        </ErrorWrap>
      </Template>
    );
  }
}

const RouterAwareRoutes = withRouter(Routes);
export default hot(module)(RouterAwareRoutes);
