import React from 'react';
import { Form, Input, DatePicker, Row, Col, Icon, Alert, Button } from 'antd';
import moment from 'moment';
import { ProposalDraft, CreateMilestone } from 'types';
import { getCreateErrors } from 'modules/create/utils';
import './Milestones.less';

interface State {
  milestones: ProposalDraft['milestones'];
}

interface Props {
  initialState: Partial<State>;
  updateForm(form: Partial<ProposalDraft>): void;
}

const DEFAULT_STATE: State = {
  milestones: [
    {
      title: '',
      content: '',
      dateEstimated: moment().unix(),
      payoutAmount: '',
      immediatePayout: false,
    },
  ],
};

export default class CreateFlowMilestones extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      ...DEFAULT_STATE,
      ...(props.initialState || {}),
    };

    // Don't allow for empty milestones array
    if (!this.state.milestones.length) {
      this.state = {
        ...this.state,
        milestones: [...DEFAULT_STATE.milestones],
      };
    }
  }

  handleMilestoneChange = (index: number, milestone: CreateMilestone) => {
    const milestones = [...this.state.milestones];
    milestones[index] = milestone;
    this.setState({ milestones }, () => {
      this.props.updateForm(this.state);
    });
  };

  addMilestone = () => {
    const { milestones: oldMilestones } = this.state;
    const milestones = [...oldMilestones, { ...DEFAULT_STATE.milestones[0] }];
    this.setState({ milestones });
  };

  removeMilestone = (index: number) => {
    let milestones = this.state.milestones.filter((_, i) => i !== index);
    if (milestones.length === 0) {
      milestones = [...DEFAULT_STATE.milestones];
    }
    this.setState({ milestones }, () => {
      this.props.updateForm(this.state);
    });
  };

  render() {
    const { milestones } = this.state;
    const errors = getCreateErrors(this.state, true);

    return (
      <Form className="CreateMilestones" layout="vertical">
        {milestones.map((milestone, idx) => (
          <div className="CreateMilestones-milestone" key={idx}>
            <div className="CreateMilestones-milestone-title">
              <span>Milestone {idx + 1}</span>
              <Button type="primary" onClick={() => this.removeMilestone(idx)}>
                Remove
              </Button>
            </div>
            <MilestoneFields
              key={idx}
              milestone={milestone}
              index={idx}
              error={errors.milestones && errors.milestones[idx]}
              previousMilestoneDateEstimate={
                milestones[idx - 1] && milestones[idx - 1].dateEstimated
                  ? moment(milestones[idx - 1].dateEstimated * 1000)
                  : undefined
              }
              onChange={this.handleMilestoneChange}
              onRemove={this.removeMilestone}
            />
          </div>
        ))}

        {milestones.length < 10 && (
          <Button type="primary" onClick={this.addMilestone}>
            <Icon type="plus" /> Add milestone
          </Button>
        )}
      </Form>
    );
  }
}

interface MilestoneFieldsProps {
  index: number;
  milestone: CreateMilestone;
  previousMilestoneDateEstimate: moment.Moment | undefined;
  error: Falsy | string;
  onChange(index: number, milestone: CreateMilestone): void;
  onRemove(index: number): void;
}

const MilestoneFields = ({
  index,
  milestone,
  error,
  onChange,
  previousMilestoneDateEstimate,
}: MilestoneFieldsProps) => (
  <div className="MilestoneFields">
    <Form.Item label="Title">
      <Input
        size="large"
        placeholder="Milestone title"
        type="text"
        name="title"
        value={milestone.title}
        onChange={ev => onChange(index, { ...milestone, title: ev.currentTarget.value })}
        maxLength={80}
      />
    </Form.Item>

    <Form.Item label="Description">
      <Input.TextArea
        rows={3}
        name="content"
        placeholder="Description of what will be delivered"
        value={milestone.content}
        onChange={ev =>
          onChange(index, { ...milestone, content: ev.currentTarget.value })
        }
        maxLength={250}
      />
    </Form.Item>

    <Row gutter={20}>
      <Col xs={24} sm={12} md={16}>
        <Form.Item label="Time estimate">
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Expected completion date"
            value={
              milestone.dateEstimated ? moment(milestone.dateEstimated * 1000) : undefined
            }
            format='mm/dd/yyyy'
            allowClear={false}
            onChange={time =>
              onChange(index, {
                ...milestone,
                dateEstimated: time.endOf('day').unix(),
              })
            }
            disabled={milestone.immediatePayout}
            disabledDate={current => {
              if (!previousMilestoneDateEstimate) {
                return current
                  ? current <
                      moment()
                        .subtract(1, 'day')
                        .endOf('day')
                  : false;
              } else {
                return current
                  ? current <
                      moment()
                        .subtract(1, 'day')
                        .endOf('day') || current < previousMilestoneDateEstimate
                  : false;
              }
            }}
          />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item label="Payout amount">
          <Input
            value={milestone.payoutAmount}
            placeholder="1"
            onChange={ev =>
              onChange(index, {
                ...milestone,
                payoutAmount: ev.currentTarget.value,
              })
            }
            addonAfter="STARS"
            maxLength={6}
          />
        </Form.Item>
      </Col>
    </Row>

    {error && (
      <Alert style={{ marginBottom: '1rem' }} type="error" message={error} showIcon />
    )}
  </div>
);
