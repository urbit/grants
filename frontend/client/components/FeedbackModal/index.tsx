import React, { ReactNode } from 'react';
import { Modal, Input, Button, Checkbox } from 'antd';
import { ModalFuncProps } from 'antd/lib/modal';
import TextArea, { TextAreaProps } from 'antd/lib/input/TextArea';
import { InputProps } from 'antd/lib/input';
import './index.less';

interface OpenProps extends ModalFuncProps {
  label?: ReactNode;
  inputProps?: InputProps;
  textAreaProps?: TextAreaProps;
  type?: 'textArea' | 'input';
  confirmationText?: React.ReactNode;
  onOk: (feedback: string) => void;
}

const open = (p: OpenProps) => {
  // NOTE: display=none antd buttons and using our own to control things more
  const ref = { text: '' };
  const {
    label,
    content,
    type,
    inputProps,
    textAreaProps,
    okText,
    cancelText,
    confirmationText,
    ...rest
  } = p;
  const modal = Modal.confirm({
    maskClosable: true,
    icon: <></>,
    className: 'FeedbackModal',
    width: 500,
    content: (
      <Feedback
        label={label}
        content={content}
        type={type || 'textArea'}
        inputProps={inputProps}
        textAreaProps={textAreaProps}
        okText={okText}
        cancelText={cancelText}
        confirmationText={confirmationText}
        onCancel={() => {
          modal.destroy();
        }}
        onOk={() => {
          modal.destroy();
          p.onOk(ref.text);
        }}
        onChange={(t: string) => (ref.text = t)}
      />
    ),
    ...rest,
  });
};

// Feedback content
interface OwnProps {
  onChange: (t: string) => void;
  label?: ReactNode;
  type: 'textArea' | 'input';
  inputProps?: InputProps;
  textAreaProps?: TextAreaProps;
  onOk: ModalFuncProps['onOk'];
  onCancel: ModalFuncProps['onCancel'];
  confirmationText?: React.ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  content?: ReactNode;
}

type Props = OwnProps;

const STATE = {
  text: '',
  hasConfirmed: false,
};

type State = typeof STATE;

class Feedback extends React.Component<Props, State> {
  state = STATE;
  input: null | TextArea | Input = null;

  render() {
    const { text, hasConfirmed } = this.state;
    const {
      label,
      type,
      textAreaProps,
      inputProps,
      onOk,
      onCancel,
      content,
      okText,
      cancelText,
      confirmationText,
    } = this.props;

    const disabled = text.length === 0 || (confirmationText && !hasConfirmed);

    return (
      <div>
        {content && <p>{content}</p>}
        {label && <div className="FeedbackModal-label">{label}</div>}
        {type === 'textArea' && (
          <Input.TextArea
            ref={ta => (this.input = ta)}
            rows={4}
            required={true}
            value={text}
            autoFocus
            onChange={e => {
              this.setState({ text: e.target.value });
              this.props.onChange(e.target.value);
            }}
            {...textAreaProps}
          />
        )}
        {type === 'input' && (
          <Input
            ref={ta => (this.input = ta)}
            value={text}
            autoFocus
            onChange={e => {
              this.setState({ text: e.target.value });
              this.props.onChange(e.target.value);
            }}
            {...inputProps}
          />
        )}
        {confirmationText && (
          <Checkbox
            className="FeedbackModal-confirmation"
            checked={hasConfirmed}
            onChange={ev => this.setState({ hasConfirmed: ev.target.checked })}
          >
            {confirmationText}
          </Checkbox>
        )}
        <div className="FeedbackModal-controls">
          <Button onClick={onCancel}>{cancelText || 'Cancel'}</Button>
          <Button onClick={onOk} disabled={!!disabled} type="primary">
            {okText || 'Ok'}
          </Button>
        </div>
      </div>
    );
  }
}

export default { open };
