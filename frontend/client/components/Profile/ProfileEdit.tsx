import React from 'react';
import lodash from 'lodash';
import qs from 'query-string';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import axios from 'api/axios';
import { getSocialAuthUrl, verifySocial, setUserAzimuth } from 'api/api';
import { usersActions } from 'modules/users';
import { AppState } from 'store/reducers';
import { Input, Form, Col, Row, Button, Alert, Icon, message } from 'antd';
import { SOCIAL_INFO } from 'utils/social';
import { SOCIAL_SERVICE, User } from 'types';
import { UserState } from 'modules/users/reducers';
import { validateUserProfile } from 'modules/create/utils';
import { EIP712Data } from 'utils/web3';
import AvatarEdit from './AvatarEdit';
import AzimuthPoints from './AzimuthPoints';
import AzimuthIcon from 'static/images/azimuth.svg';
import './ProfileEdit.less';

interface OwnProps {
  user: UserState;
}

interface StateProps {
  authUser: AppState['auth']['user'];
  hasCheckedAuthUser: AppState['auth']['hasCheckedUser'];
}

interface DispatchProps {
  fetchUser: typeof usersActions['fetchUser'];
  updateUser: typeof usersActions['updateUser'];
}

type Props = OwnProps & StateProps & DispatchProps & RouteComponentProps;

interface State {
  fields: User;
  isChanged: boolean;
  showError: boolean;
  socialVerificationError: string;
  activeSocialService: SOCIAL_SERVICE | null;
  isAddingAzimuthPoint: boolean;
}

class ProfileEdit extends React.PureComponent<Props, State> {
  state: State = {
    fields: { ...this.props.user } as User,
    isChanged: false,
    showError: false,
    socialVerificationError: '',
    activeSocialService: null,
    isAddingAzimuthPoint: false,
  };

  componentDidMount() {
    this.verifySocial();
  }

  componentDidUpdate(prevProps: Props, _: State) {
    if (
      prevProps.user.isUpdating &&
      !this.props.user.isUpdating &&
      !this.state.showError
    ) {
      this.setState({ showError: true });
    }
    if (
      prevProps.user.isUpdating &&
      !this.props.user.isUpdating &&
      !this.props.user.updateError
    ) {
      this.handleDone();
    }
  }

  render() {
    const { user } = this.props;
    const {
      fields,
      socialVerificationError,
      activeSocialService,
      isAddingAzimuthPoint,
    } = this.state;
    const error = validateUserProfile(fields);
    const isMissingField = !fields.displayName || !fields.title;
    const isDisabled =
      !!error || isMissingField || !this.state.isChanged || !!activeSocialService;

    return (
      <>
        <div className="ProfileEdit">
          <AvatarEdit
            user={fields}
            onDone={this.handleChangePhoto}
            onDelete={this.handleDeletePhoto}
          />

          <div className="ProfileEdit-info">
            <Form
              className="ProfileEdit-info-form"
              layout="vertical"
              onSubmit={this.handleSave}
            >
              <Form.Item>
                <Input
                  name="displayName"
                  autoComplete="off"
                  placeholder="Display name (Required)"
                  value={fields.displayName}
                  onChange={this.handleChangeField}
                />
              </Form.Item>

              <Form.Item>
                <Input
                  name="title"
                  autoComplete="off"
                  placeholder="Title (Required)"
                  value={fields.title}
                  onChange={this.handleChangeField}
                />
              </Form.Item>

              <Row gutter={12}>
                {/* Azimuth point */}
                <Col xs={24} md={8}>
                  <Form.Item>
                    {fields.azimuth ? (
                      <Button
                        className="ProfileEdit-socialButton is-delete"
                        type="primary"
                        onClick={this.handleDeleteAzimuthPoint}
                        block
                      >
                        <div className="ProfileEdit-socialButton-text">
                          <Icon component={AzimuthIcon} viewBox="0 0 210 210" />{' '}
                          <strong>{fields.azimuth.point}</strong>
                        </div>
                        <div className="ProfileEdit-socialButton-delete">
                          <Icon type="delete" /> Remove point
                        </div>
                      </Button>
                    ) : (
                      <Button
                        className="ProfileEdit-socialButton is-add"
                        onClick={this.openAzimuthPoints}
                        loading={isAddingAzimuthPoint}
                        block
                      >
                        {!isAddingAzimuthPoint && (
                          <Icon component={AzimuthIcon} viewBox="0 0 210 210" />
                        )}{' '}
                        Link Azimuth Point
                      </Button>
                    )}
                  </Form.Item>
                </Col>
                {/* Social connections */}
                {Object.values(SOCIAL_INFO).map(s => {
                  const field = fields.socialMedias.find(sm => sm.service === s.service);
                  const loading = s.service === activeSocialService;
                  return (
                    <Col xs={24} md={8} key={s.service}>
                      <Form.Item>
                        {field &&
                          field.username && (
                            <Button
                              className="ProfileEdit-socialButton is-delete"
                              type="primary"
                              onClick={() => this.handleSocialDelete(s.service)}
                              loading={loading}
                              block
                            >
                              <div className="ProfileEdit-socialButton-text">
                                {!loading && s.icon} <strong>{field.username}</strong>
                              </div>
                              <div className="ProfileEdit-socialButton-delete">
                                <Icon type="delete" /> Unlink account
                              </div>
                            </Button>
                          )}
                        {!field && (
                          <Button
                            className="ProfileEdit-socialButton is-add"
                            onClick={() => this.handleSocialAdd(s.service)}
                            loading={loading}
                            block
                          >
                            {!loading && s.icon} <>Connect to {s.name}</>
                          </Button>
                        )}
                      </Form.Item>
                    </Col>
                  );
                })}
              </Row>
              {socialVerificationError && (
                <Alert type="error" message={socialVerificationError} closable />
              )}

              {!isMissingField &&
                error && <Alert type="error" message={error} showIcon />}

              <Row>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={isDisabled}
                  loading={user.isUpdating}
                >
                  Save changes
                </Button>
                <Button type="ghost" htmlType="button" onClick={this.handleCancel}>
                  Cancel
                </Button>
              </Row>
            </Form>
            {this.state.showError &&
              user.updateError && (
                <Alert
                  className="ProfileEdit-alert"
                  message={`There was an error attempting to update your profile. (code ${
                    user.updateError
                  })`}
                  type="error"
                />
              )}
          </div>
        </div>
        {isAddingAzimuthPoint && (
          <AzimuthPoints
            onCancel={this.closeAzimuthPoints}
            onSelectPoint={this.handleSetAzimuthPoint}
          />
        )}
      </>
    );
  }

  private verifySocial = () => {
    const args = qs.parse(this.props.location.search);
    const { id } = this.props.user;
    if (args.code && args.service) {
      this.setState({ activeSocialService: args.service });
      verifySocial(args.service, args.code)
        .then(async res => {
          // refresh user data
          await this.props.fetchUser(id.toString());
          // update just the socialMedias on state.fields
          const socialMedias = this.props.user.socialMedias;
          const fields = {
            ...this.state.fields,
            socialMedias,
          };
          this.setState({
            fields,
            activeSocialService: null,
          });
          message.success(
            `Verified ${res.data.username} on ${args.service.toLowerCase()}.`,
          );
          // remove search query from url
          this.props.history.push({ pathname: `/profile/${id}/edit` });
        })
        .catch(e => {
          this.setState({
            activeSocialService: null,
            socialVerificationError: e.message || e.toString(),
          });
        });
    }
  };

  private handleSave = (evt: React.SyntheticEvent<any>) => {
    evt.preventDefault();
    this.props.updateUser(this.state.fields);
  };

  private handleCancel = () => {
    const propsAvatar = this.props.user.avatar;
    const stateAvatar = this.state.fields.avatar;
    // cleanup uploaded file if we cancel
    if (
      stateAvatar &&
      stateAvatar.imageUrl &&
      (!propsAvatar || propsAvatar.imageUrl !== stateAvatar.imageUrl)
    ) {
      axios.delete('/api/v1/users/avatar', {
        params: { url: stateAvatar.imageUrl },
      });
    }
    this.handleDone();
  };

  private handleChangeField = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.currentTarget;
    const fields = {
      ...this.state.fields,
      [name as any]: value,
    };
    const isChanged = this.isChangedCheck(fields);
    this.setState({
      isChanged,
      fields,
    });
  };

  private handleSocialAdd = async (service: SOCIAL_SERVICE) => {
    this.setState({ activeSocialService: service });
    if (this.state.isChanged) {
      // save any changes first
      await this.props.updateUser(this.state.fields);
    }
    try {
      const res = await getSocialAuthUrl(service);
      window.location.href = res.data.url;
    } catch (e) {
      this.setState({
        activeSocialService: null,
        socialVerificationError: e.message || e.toString(),
      });
    }
  };

  private handleSocialDelete = (service: SOCIAL_SERVICE) => {
    const socialMedias = this.state.fields.socialMedias.filter(
      sm => sm.service !== service,
    );
    const fields = {
      ...this.state.fields,
      socialMedias,
    };
    this.setState({
      fields,
      isChanged: this.isChangedCheck(fields),
    });
  };

  private openAzimuthPoints = () => this.setState({ isAddingAzimuthPoint: true });
  private closeAzimuthPoints = () => this.setState({ isAddingAzimuthPoint: false });

  private handleSetAzimuthPoint = async (data: EIP712Data, signature: string) => {
    // Similar to social fields, azimuth point claiming is saved instantly
    try {
      const res = await setUserAzimuth(data, signature);
      this.setState({
        fields: {
          ...this.state.fields,
          azimuth: res.data.azimuth,
        },
      });
      await this.props.fetchUser(this.props.user.id.toString());
      message.success(`Verified ownership of ${data.message.point}`);
    } catch (err) {
      message.error(err.message);
    }
    this.setState({ isAddingAzimuthPoint: false });
  };

  private handleDeleteAzimuthPoint = () => {
    const fields = {
      ...this.state.fields,
      azimuth: null,
    };
    const isChanged = this.isChangedCheck(fields);
    this.setState({ isChanged, fields });
  };

  private handleChangePhoto = (url: string) => {
    const fields = {
      ...this.state.fields,
      avatar: {
        imageUrl: url,
      },
    };
    const isChanged = this.isChangedCheck(fields);
    this.setState({
      isChanged,
      fields,
    });
  };

  private handleDeletePhoto = () => {
    const fields = {
      ...this.state.fields,
      avatar: null,
    };
    const isChanged = this.isChangedCheck(fields);
    this.setState({ isChanged, fields });
  };

  private isChangedCheck = (a: User) => {
    return !lodash.isEqual(a, this.props.user);
  };

  private handleDone = () => {
    this.props.history.replace(`/profile/${this.props.user.id}`);
  };
}

const withConnect = connect<StateProps, DispatchProps, OwnProps, AppState>(
  state => ({
    authUser: state.auth.user,
    hasCheckedAuthUser: state.auth.hasCheckedUser,
  }),
  {
    fetchUser: usersActions.fetchUser,
    updateUser: usersActions.updateUser,
  },
);

export default compose<Props, OwnProps>(
  withRouter,
  withConnect,
)(ProfileEdit);
