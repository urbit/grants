import React from 'react';
import { connect } from 'react-redux';
import { Input, Form, Select, Alert, Popconfirm, message } from 'antd';
import { SelectValue } from 'antd/lib/select';
import { PROPOSAL_CATEGORY, CATEGORY_UI } from 'api/constants';
import { ProposalDraft, RFP } from 'types';
import { getCreateErrors } from 'modules/create/utils';
import { typedKeys } from 'utils/ts';
import { Link } from 'react-router-dom';
import { unlinkProposalRFP } from 'modules/create/actions';
import { AppState } from 'store/reducers';

interface OwnProps {
  proposalId: number;
  initialState?: Partial<State>;
  updateForm(form: Partial<ProposalDraft>): void;
}

interface StateProps {
  isUnlinkingProposalRFP: AppState['create']['isUnlinkingProposalRFP'];
  unlinkProposalRFPError: AppState['create']['unlinkProposalRFPError'];
}

interface DispatchProps {
  unlinkProposalRFP: typeof unlinkProposalRFP;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State extends Partial<ProposalDraft> {
  title: string;
  brief: string;
  category?: PROPOSAL_CATEGORY;
  target: string;
  rfp?: RFP;
}

class CreateFlowBasics extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      title: '',
      brief: '',
      category: undefined,
      target: '',
      ...(props.initialState || {}),
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { unlinkProposalRFPError, isUnlinkingProposalRFP } = this.props;
    if (
      unlinkProposalRFPError &&
      unlinkProposalRFPError !== prevProps.unlinkProposalRFPError
    ) {
      console.error('Failed to unlink request:', unlinkProposalRFPError);
      message.error('Failed to unlink request');
    } else if (!isUnlinkingProposalRFP && prevProps.isUnlinkingProposalRFP) {
      this.setState({ rfp: undefined });
      message.success('Unlinked proposal from request');
    }
  }

  render() {
    const { isUnlinkingProposalRFP } = this.props;
    const { title, brief, category, target, rfp } = this.state;
    const errors = getCreateErrors(this.state, true);

    // Don't show target error at zero since it defaults to that
    // Error just shows up at the end to prevent submission
    if (target === '0') {
      errors.target = undefined;
    }

    return (
      <Form layout="vertical" style={{ maxWidth: 620, margin: '0 auto' }}>
        {rfp && (
          <Alert
            className="CreateFlow-rfpAlert"
            type="info"
            message="This proposal is linked to a request"
            description={
              <>
                This proposal is for the open request{' '}
                <Link to={`/requests/${rfp.id}`} target="_blank">
                  {rfp.title}
                </Link>
                . If you didn’t mean to do this, or want to unlink it,{' '}
                <Popconfirm
                  title="Are you sure? This cannot be undone."
                  onConfirm={this.unlinkRfp}
                  okButtonProps={{ loading: isUnlinkingProposalRFP }}
                >
                  <a>click here</a>
                </Popconfirm>{' '}
                to do so.
              </>
            }
            showIcon
          />
        )}

        <Form.Item
          label="Title"
          validateStatus={errors.title ? 'error' : undefined}
          help={errors.title}
        >
          <Input
            size="large"
            name="title"
            placeholder="Short and sweet"
            type="text"
            value={title}
            onChange={this.handleInputChange}
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label="Brief"
          validateStatus={errors.brief ? 'error' : undefined}
          help={errors.brief}
        >
          <Input.TextArea
            name="brief"
            placeholder="An elevator-pitch version of your proposal, max 140 chars"
            value={brief}
            onChange={this.handleInputChange}
            rows={3}
            maxLength={200}
          />
        </Form.Item>

        <Form.Item label="Category">
          <Select
            size="large"
            placeholder="Select a category"
            value={category || undefined}
            onChange={this.handleCategoryChange}
          >
            {typedKeys(PROPOSAL_CATEGORY).map(c => (
              <Select.Option value={c} key={c}>
                {CATEGORY_UI[c].label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Target amount"
          validateStatus={errors.target ? 'error' : undefined}
          help={errors.target}
        >
          <Input
            size="large"
            name="target"
            placeholder="2"
            type="number"
            value={target}
            onChange={this.handleInputChange}
            addonAfter="STARS"
            maxLength={16}
          />
        </Form.Item>
      </Form>
    );
  }

  private handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value, name } = event.currentTarget;
    this.setState({ [name]: value } as any, () => {
      this.props.updateForm(this.state);
    });
  };

  private handleCategoryChange = (value: SelectValue) => {
    this.setState({ category: value as PROPOSAL_CATEGORY }, () => {
      this.props.updateForm(this.state);
    });
  };

  private unlinkRfp = () => {
    this.props.unlinkProposalRFP(this.props.proposalId);
  };
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(
  state => ({
    isUnlinkingProposalRFP: state.create.isUnlinkingProposalRFP,
    unlinkProposalRFPError: state.create.unlinkProposalRFPError,
  }),
  { unlinkProposalRFP },
)(CreateFlowBasics);
