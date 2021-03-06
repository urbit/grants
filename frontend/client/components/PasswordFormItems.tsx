import React from 'react';
import classnames from 'classnames';
import { Form, Input, Row, Col } from 'antd';
import { FormItemProps } from 'antd/lib/form';
import { WrappedFormUtils } from 'antd/lib/form/Form';

export interface Props {
  form: WrappedFormUtils;
  className?: string;
  formItemProps?: FormItemProps;
}

const STATE = {
  passwordConfirmDirty: true,
};

type State = typeof STATE;

export default class PasswordFormItems extends React.Component<Props, State> {
  state: State = { ...STATE };
  render() {
    const { passwordConfirmDirty } = this.state;
    const { className } = this.props;
    const { getFieldDecorator, validateFields, getFieldValue } = this.props.form;
    const passedFormItemProps = this.props.formItemProps || {};

    const formItemProps = {
      className: classnames(className, passedFormItemProps.className),
    };

    return (
      <Row className="PasswordFormItems" gutter={8}>
        <Col sm={12} xs={24}>
          <Form.Item {...formItemProps} label="New password">
            {getFieldDecorator('password', {
              rules: [
                { required: true, message: 'Please enter a password' },
                { min: 8, message: 'Please use at least 8 characters' },
                {
                  validator: (_, val, cb) => {
                    if (val && passwordConfirmDirty) {
                      validateFields(['passwordConfirm'], { force: true });
                    }
                    cb();
                  },
                },
              ],
            })(
              <Input
                name="password"
                type="password"
                placeholder="Minimum 8 chars"
                autoComplete="new-password"
              />,
            )}
          </Form.Item>
        </Col>
        <Col sm={12} xs={24} className="PasswordFormItems-confirm">
          <Form.Item {...formItemProps} label="Confirm password">
            {getFieldDecorator('passwordConfirm', {
              rules: [
                { required: true, message: 'Please confirm password' },
                {
                  validator: (_, val, cb) => {
                    if (val && val !== getFieldValue('password')) {
                      cb('Passwords do not match');
                    } else {
                      cb();
                    }
                  },
                },
              ],
            })(
              <Input
                name="passwordConfirm"
                type="password"
                onBlur={e =>
                  this.setState({
                    passwordConfirmDirty: passwordConfirmDirty || !!e.target.value,
                  })
                }
                placeholder=""
                autoComplete="off"
              />,
            )}
          </Form.Item>
        </Col>
      </Row>
    );
  }
}
