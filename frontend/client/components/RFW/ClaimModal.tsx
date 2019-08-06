import React from 'react';
import { Modal, Input } from 'antd';
import { ModalProps } from 'antd/lib/modal';
import TextArea from 'antd/lib/input/TextArea';

interface OwnProps {
  onClaim: (text: string, url: string) => void;
}

type Props = OwnProps & ModalProps;

const STATE = {
  text: '',
  url: '',
};

type State = typeof STATE;

export default class ClaimModal extends React.Component<Props, State> {
  state: State = { ...STATE };

  render() {
    const { text, url } = this.state;
    const { onClaim, ...rest } = this.props;
    return (
      <Modal
        {...rest}
        title="Claim work"
        okButtonProps={{ disabled: !text.length }}
        onOk={() => onClaim(text, url)}
      >
        <p>
          Show us what you've done to reach this milestone. Someone will
          review your work shortly, and let you know if it accomplishes the goal.
        </p>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <div>Message supporting your claim (required)</div>
          <TextArea
            value={text}
            rows={4}
            onChange={e => this.setState({ text: e.target.value })}
          />
        </label>
        <label>
          <div>URL supporting your claim (optional)</div>
          <Input
            placeholder={'https://github.com/some/pr'}
            value={url}
            onChange={e => this.setState({ url: e.target.value })}
          />
        </label>
      </Modal>
    );
  }
}
