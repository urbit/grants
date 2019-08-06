import React from 'react';
import { cloneDeep } from 'lodash';
import { view } from 'react-easy-state';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Form, Input, Select, Button, message, Spin, Row, Col, Tag } from 'antd';
import Exception from 'ant-design-pro/lib/Exception';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { FormComponentProps } from 'antd/lib/form';
import { PROPOSAL_CATEGORY, RFW_STATUS, RFW, RFWMilestone, Tag as TagT } from 'src/types';
import { CATEGORY_UI } from 'util/ui';
import { typedKeys } from 'util/ts';
import { RFW_STATUSES, getStatusById } from 'util/statuses';
import Markdown from 'components/Markdown';
import Back from 'components/Back';
import store from 'src/store';
import TimeEstimateControl from 'components/TimeEstimateControl';
import TagSelect from 'components/TagSelect';
import './index.less';

type Props = FormComponentProps & RouteComponentProps<{ id?: string }>;

type RFWFormMilestoneT = Partial<RFWMilestone> & { isNew?: boolean; isDelete?: boolean };

interface State {
  milestones: RFWFormMilestoneT[];
  deleteMilestones: number[];
  isShowingPreview: boolean;
  tags: TagT[];
}

let ephemeralMsId = 0;
const nextEphemeralMsId = () => --ephemeralMsId;

const NEW_MILESTONE = {
  id: nextEphemeralMsId(),
  index: 0,
  title: '',
  content: '',
  // bounty: 0,
  effortFrom: 0,
  effortTo: 0,
  isNew: true,
};

class RFWForm extends React.Component<Props, State> {
  state: State = {
    milestones: [{ ...NEW_MILESTONE }],
    tags: [],
    deleteMilestones: [],
    isShowingPreview: false,
  };

  constructor(props: Props) {
    super(props);
    this.fetchExisting();
  }

  render() {
    const { isShowingPreview } = this.state;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const rfwId = this.getIdFromQuery();
    const rfw = store.rfwDetail;

    let defaults: Partial<RFW> = {
      title: '',
      brief: '',
      content: '',
      category: '',
      status: '',
      bounty: 0,
    };

    // loading detail
    if ((rfwId && !rfw) || store.rfwDetailFetching) {
      return <Spin />;
    }

    // not fetching and has id and doens't have result
    if (rfwId && !store.rfwDetailFetching && !rfw) {
      return <Exception type="404" desc="This RFP does not exist" />;
    }

    if (rfw) {
      defaults = cloneDeep(rfw);
    }

    return (
      <Form className="RFWForm" layout="vertical" onSubmit={this.handleSubmit}>
        <Back to="/bounties" text="Bounties" />
        <Form.Item label="Title">
          {getFieldDecorator('title', {
            initialValue: defaults.title,
            rules: [
              { required: true, message: 'Title is required' },
              { max: 60, message: 'Max 60 chars' },
            ],
          })(
            <Input
              autoComplete="off"
              name="title"
              placeholder="Max 60 chars"
              size="large"
              autoFocus
            />,
          )}
        </Form.Item>
        <Form.Item label="Tags">
          {!!this.state.tags.length && (
            <div className="RFWForm-tags">
              {this.state.tags.map(t => (
                <Tag
                  key={t.id}
                  color={t.color}
                  closable
                  onClose={() => this.handleRemoveTag(t.id)}
                >
                  {t.text}
                </Tag>
              ))}
            </div>
          )}
          <TagSelect
            onAdd={this.handleAddTag}
            onManageDelete={t => this.handleRemoveTag(t.id)}
            selectedIds={this.state.tags.map(x => x.id)}
          />
        </Form.Item>
        <Form.Item label="Status">
          {getFieldDecorator('status', {
            initialValue: defaults.status || undefined,
            rules: [{ required: true, message: 'Status is required' }],
          })(
            <Select size="large" placeholder="Select a status">
              {typedKeys(RFW_STATUS).map(c => (
                <Select.Option value={c} key={c}>
                  {getStatusById(RFW_STATUSES, c).tagDisplay}
                </Select.Option>
              ))}
            </Select>,
          )}
        </Form.Item>

        <Form.Item label="Category">
          {getFieldDecorator('category', {
            initialValue: defaults.category || undefined,
            rules: [{ required: true, message: 'Category is required' }],
          })(
            <Select size="large" placeholder="Select a category">
              {typedKeys(PROPOSAL_CATEGORY).map(c => (
                <Select.Option value={c} key={c}>
                  {CATEGORY_UI[c].label}
                </Select.Option>
              ))}
            </Select>,
          )}
        </Form.Item>

        <Form.Item label="Brief description">
          {getFieldDecorator('brief', {
            initialValue: defaults.brief,
            rules: [
              { required: true, message: 'Brief is required' },
              { max: 200, message: 'Max 200 chars' },
            ],
          })(<Input.TextArea rows={3} name="brief" placeholder="Max 200 chars" />)}
        </Form.Item>

        <Form.Item className="RFWForm-content" label="Content" required>
          {/* Keep rendering even while hiding to not reset value */}
          <div style={{ display: isShowingPreview ? 'none' : 'block' }}>
            {getFieldDecorator('content', {
              initialValue: defaults.content,
              rules: [{ required: true, message: 'Content is required' }],
            })(
              <Input.TextArea
                rows={8}
                name="content"
                placeholder="Click 'Preview content' to see rendered markdown"
                autosize={{ minRows: 6, maxRows: 15 }}
              />,
            )}
          </div>
          {isShowingPreview ? (
            <>
              <div className="RFWForm-content-preview">
                <Markdown source={getFieldValue('content') || '_No content_'} />
              </div>
              <a className="RFWForm-content-previewToggle" onClick={this.togglePreview}>
                Edit content
              </a>
            </>
          ) : (
            <a className="RFWForm-content-previewToggle" onClick={this.togglePreview}>
              Preview content
            </a>
          )}
        </Form.Item>

        <h1>Milestones</h1>
        {this.state.milestones.map(ms => (
          <RFWFormMilestone
            key={ms.id}
            milestone={ms}
            onChange={this.handleMilestoneChange}
            onDelete={this.handleMilestoneDelete}
            getFieldDecorator={getFieldDecorator}
          />
        ))}
        <div className="RFWForm-milestoneBottom">
          <Button icon="plus" onClick={this.handleAddMilestone}>
            Add Milestone
          </Button>
        </div>

        <div className="RFWForm-buttons">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={store.rfwDetailBusy}
          >
            Submit
          </Button>
          <Link to="/bounties">
            <Button type="ghost" size="large" disabled={store.rfwDetailBusy}>
              Cancel
            </Button>
          </Link>
        </div>
      </Form>
    );
  }

  private getIdFromQuery = () => {
    const rfpId = this.props.match.params.id;
    if (rfpId) {
      return parseInt(rfpId, 10);
    }
  };

  private fetchExisting = async () => {
    const id = this.getIdFromQuery();
    if (id) {
      await store.fetchRFWDetail(id);
      if (store.rfwDetail) {
        // cloneDeep to avoid mutating what is in the store
        const milestones = cloneDeep(store.rfwDetail.milestones);
        milestones.forEach(ms => delete ms.dateCreated);
        const tags = [...store.rfwDetail.tags];
        this.setState({ milestones, tags });
      }
    } else {
      store.clearRFWDetail();
    }
  };

  private togglePreview = () => {
    this.setState({ isShowingPreview: !this.state.isShowingPreview });
  };

  private handleMilestoneChange = (ms: Partial<RFWMilestone>) => {
    if (!ms.id) {
      console.error('handleMilestoneChange expected a milestone id');
      return;
    }
    const existing = this.state.milestones.find(x => x.id === ms.id);
    const existingInd = this.state.milestones.findIndex(x => x.id === ms.id);
    const milestones = cloneDeep(this.state.milestones);
    milestones[existingInd] = { ...existing, ...ms };
    this.setState({ milestones });
  };

  private handleMilestoneDelete = (id: number) => {
    const existing = this.state.milestones.find(x => x.id === id);
    if (!existing) {
      return;
    }
    let milestones = this.state.milestones.filter(x => x.id !== id);
    milestones = milestones.map((ms, index) => ({ ...ms, index }));
    let deleteMilestones = this.state.deleteMilestones;
    if (!existing.isNew) {
      deleteMilestones = [...deleteMilestones, id];
    }
    this.setState({ milestones, deleteMilestones });
  };

  private handleAddMilestone = () => {
    const index = this.state.milestones.length;
    this.setState({
      milestones: [
        ...this.state.milestones,
        {
          ...NEW_MILESTONE,
          id: nextEphemeralMsId(), // will not interfere with existing
          index,
        },
      ],
    });
  };

  private handleAddTag = (tag: TagT) => {
    if (this.state.tags.find(x => x.id === tag.id)) {
      return;
    }
    this.setState({
      tags: [...this.state.tags, tag],
    });
  };

  private handleRemoveTag = (id: number) => {
    this.setState({
      tags: [...this.state.tags.filter(x => x.id !== id)],
    });
  };

  private handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    this.props.form.validateFieldsAndScroll(async (err: any, rawValues: any) => {
      if (err) return;
      const rfwId = this.getIdFromQuery();
      const values = {
        ...rawValues,
        milestones: this.state.milestones.map(ms => {
          const copy = { ...ms };
          if (ms.isNew) {
            // clear ephemeralMsIds before sending
            delete copy.id;
          }
          delete copy.authedClaim;
          delete copy.claims;
          delete copy.isAuthedActive;
          return copy;
        }),
        deleteMilestones: this.state.deleteMilestones,
        tags: this.state.tags.map(x => x.id),
      };
      let msg;
      if (rfwId) {
        await store.updateRFWDetail(rfwId, values);
        msg = 'Successfully updated bounty';
      } else {
        await store.createRFWDetail(values);
        msg = 'Successfully created bounty.';
      }

      if (store.rfwDetailSaved) {
        message.success(msg, 3);
        this.props.history.replace('/bounties');
      }
    });
  };
}

interface RFWFormMilestoneProps {
  milestone: RFWFormMilestoneT;
  onChange: (ms: Partial<RFWMilestone>) => void;
  onDelete: (id: number) => void;
  getFieldDecorator: WrappedFormUtils['getFieldDecorator'];
}
interface RFWFormMilestoneState {
  isDeleting: boolean;
}
// tslint:disable-next-line:max-classes-per-file
class RFWFormMilestone extends React.Component<
  RFWFormMilestoneProps,
  RFWFormMilestoneState
> {
  state: RFWFormMilestoneState = {
    isDeleting: false,
  };
  ref = React.createRef<HTMLDivElement>();

  render() {
    const { milestone, onChange, getFieldDecorator } = this.props;
    const { isDeleting } = this.state;
    const num = (milestone.index || 0) + 1;
    return (
      <div
        className={`RFWForm-milestone ${isDeleting ? 'is-deleting' : ''}`}
        ref={this.ref}
      >
        <div className="RFWForm-milestone-number">{num}</div>
        <Button
          className="RFWForm-milestone-delete"
          icon="delete"
          shape="circle"
          disabled={milestone.index === 0}
          onClick={() => {
            const h = this.ref.current!.clientHeight;
            this.ref.current!.style.height = h + 'px';
            this.setState({ isDeleting: true }, () => {
              this.ref.current!.style.height = '0px';
              setTimeout(() => this.props.onDelete(milestone.id || 0), 450);
            });
          }}
        />
        <Row>
          <Col>
            <Form.Item>
              {getFieldDecorator(`milestones[${milestone.index}].title`, {
                initialValue: milestone.title,
                rules: [
                  { required: true, message: 'Title is required' },
                  { max: 60, message: 'Max 60 chars' },
                ],
              })(
                <Input
                  autoComplete="off"
                  placeholder="Milestone title"
                  size="large"
                  onChange={e => onChange({ id: milestone.id, title: e.target.value })}
                />,
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item>
              {getFieldDecorator(`milestones[${milestone.index}].content`, {
                initialValue: milestone.content,
                rules: [
                  { required: true, message: 'Content is required' },
                  { max: 1000, message: 'Max 1000 chars' },
                ],
              })(
                <Input.TextArea
                  rows={8}
                  autosize={{ minRows: 4, maxRows: 13 }}
                  placeholder="Description of deliverables"
                  onChange={e => onChange({ id: milestone.id, content: e.target.value })}
                />,
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col sm={16} xs={16}>
            <Form.Item help="Estimated time this work will take">
              <TimeEstimateControl
                from={{
                  name: 'effortFrom',
                  placeholder: '6',
                  initialValue: milestone.effortFrom || 0,
                }}
                to={{
                  name: 'effortTo',
                  placeholder: '24',
                  initialValue: milestone.effortTo || 0,
                }}
                onChange={e => {
                  onChange({ id: milestone.id, effortFrom: e.from, effortTo: e.to });
                }}
              />
            </Form.Item>
          </Col>
          <Col sm={8} xs={8}>
            <Form.Item className="RFWForm-bounty" extra="Number of stars to award">
              {getFieldDecorator(`milestones[${milestone.index}].bounty`, {
                initialValue: milestone.bounty,
                rules: [
                  { required: true, message: 'Bounty is required' },
                  {
                    pattern: /^[0-9]+$/,
                    message: 'A positive whole number, please',
                  },
                ],
              })(
                <Input
                  autoComplete="off"
                  addonAfter="STARS"
                  size="large"
                  placeholder="Bounty"
                  type="number"
                  onChange={e =>
                    onChange({ id: milestone.id, bounty: Number(e.target.value || 0) })
                  }
                />,
              )}
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Form.create()(withRouter(view(RFWForm)));
