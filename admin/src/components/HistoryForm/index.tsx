import React from 'react';
import moment from 'moment';
import { view } from 'react-easy-state';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  DatePicker,
  Row,
  Col,
  Alert,
} from 'antd';
import Exception from 'ant-design-pro/lib/Exception';
import { FormComponentProps } from 'antd/lib/form';
import { HistoryEventArgs } from 'src/types';
import Back from 'components/Back';
import store from 'src/store';
import './index.less';

type Props = FormComponentProps & RouteComponentProps<{ id?: string }>;

class HistoryForm extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    const historyId = this.getIdParam();
    if (historyId && (!store.historyEvent || store.historyEvent.id !== historyId)) {
      store.fetchHistoryEvent(historyId);
    }
  }

  render() {
    const { getFieldDecorator } = this.props.form;

    let defaults: HistoryEventArgs = {
      title: '',
      content: '',
      date: Date.now() / 1000,
      userId: undefined,
      proposalId: undefined,
    };
    const id = this.getIdParam();
    if (id) {
      if (!store.historyEvent || store.historyEvent.id !== id) {
        return <Spin />;
      }

      const event = store.historyEvent;
      if (event) {
        defaults = {
          title: event.titleRaw,
          content: event.contentRaw,
          date: event.date,
          userId: event.user ? event.user.id : undefined,
          proposalId: event.proposal ? event.proposal.id : undefined,
        };
      } else {
        return <Exception type="404" desc="This history event does not exist" />;
      }
    }

    return (
      <Form className="HistoryForm" layout="vertical" onSubmit={this.handleSubmit}>
        <Back to="/history" text="History" />
        <Form.Item label="Title">
          {getFieldDecorator('title', {
            initialValue: defaults.title,
            rules: [
              { required: true, message: 'Title is required' },
              { max: 120, message: 'Max 120 chars' },
            ],
          })(
            <Input
              autoComplete="off"
              name="title"
              placeholder="Max 120 chars"
              size="large"
              autoFocus
            />,
          )}
        </Form.Item>

        <Form.Item className="HistoryForm-content" label="Description">
          {getFieldDecorator('content', {
            initialValue: defaults.content,
            rules: [{ max: 1000, message: 'Max 1000 chars' }],
          })(
            <Input.TextArea
              rows={8}
              name="content"
              placeholder="Max 1000 chars, markdown supported"
              autosize={{ minRows: 3, maxRows: 6 }}
            />,
          )}
        </Form.Item>

        <Alert
          className="HistoryForm-variableHelp"
          type="info"
          message="Special tags in title and description"
          description={<>
            You can embed a linked user's name or a linked proposal's title by using the
            special tags <code>$user</code> and <code>$proposal</code> respectively. You
            must set a user ID or proposal ID for these to be replaced.
          </>}
        />

        <Form.Item
          className="HistoryForm-date"
          label="Date"
          help="When the event happened, events are sorted by date"
        >
          {getFieldDecorator('dateCloses', {
            initialValue: defaults.date
              ? moment(defaults.date * 1000)
              : undefined,
          })(<DatePicker size="large" />)}
        </Form.Item>


        <Row>
          <Col sm={11} xs={24}>
            <Form.Item
              className="HistoryForm-user"
              label="User ID"
              help="User associated with the event (optional)"
            >
              {getFieldDecorator('userId', {
                initialValue: defaults.userId,
              })(
                <Input
                  autoComplete="off"
                  name="userId"
                  size="large"
                />,
              )}
            </Form.Item>
          </Col>
          <Col sm={1} xs={0} />
          <Col sm={12} xs={24}>
            <Form.Item
              className="HistoryForm-proposal"
              label="Proposal ID"
              help="Proposal associated with the event (optional)"
            >
              {getFieldDecorator('proposalId', {
                initialValue: defaults.proposalId,
              })(
                <Input
                  autoComplete="off"
                  name="proposalId"
                  size="large"
                />,
              )}
            </Form.Item>
          </Col>
        </Row>


        <div className="HistoryForm-buttons">
          <Button type="primary" htmlType="submit" size="large">
            Submit
          </Button>
          <Link to="/history">
            <Button type="ghost" size="large">
              Cancel
            </Button>
          </Link>
        </div>
      </Form>
    );
  }

  private getIdParam = () => {
    const id = this.props.match.params.id;
    if (id) {
      return parseInt(id, 10);
    }
  };

  private handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    this.props.form.validateFieldsAndScroll(async (err: any, rawValues: any) => {
      if (err) return;

      const id = this.getIdParam();
      const values = {
        ...rawValues,
        date: rawValues.dateCloses.unix(),
      };
      let msg;
      if (id) {
        await store.editHistoryEvent(id, values);
        msg = 'Successfully updated history event';
      } else {
        await store.createHistoryEvent(values);
        msg = 'Successfully created a new history event';
      }

      if (store.historyEventSaved) {
        message.success(msg, 3);
        this.props.history.replace('/history');
      }
    });
  };
}

export default Form.create()(withRouter(view(HistoryForm)));
