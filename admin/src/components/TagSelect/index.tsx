import React from 'react';
import {
  Modal,
  Input,
  Button,
  Tag,
  Icon,
  Spin,
  Menu,
  Dropdown,
  message,
  Tooltip,
  Popconfirm,
} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { view } from 'react-easy-state';
import { Tag as TagT } from 'src/types';
import store from 'src/store';
import './index.less';

// Feedback content
interface OwnProps {
  onAdd: (tag: TagT) => void;
  onManageDelete?: (tag: TagT) => void;
  selectedIds?: number[];
}

type Props = OwnProps;

const STATE = {
  isCreating: false,
  isManaging: false,
  text: '',
  description: '',
  color: '#108ee9',
};

type State = typeof STATE;

class TagSelect extends React.Component<Props, State> {
  state = { ...STATE };
  input: null | TextArea | Input = null;
  componentDidMount() {
    store.getTags();
  }
  render() {
    const { tagsFetched, tagsFetching, tags } = store;
    const selectedIds = this.props.selectedIds || [];
    return (
      <div className="TagSelect">
        <Dropdown
          trigger={['click']}
          placement="bottomLeft"
          overlay={
            <Menu className="TagSelect-menu">
              {!tagsFetched && tagsFetching && <Spin />}
              {tags.map(t => (
                <Menu.Item key={t.id} onClick={() => this.props.onAdd(t)}>
                  {' '}
                  <Tag color={t.color}>
                    {selectedIds.includes(t.id) && <Icon type="check-circle" />} {t.text}
                  </Tag>{' '}
                  <small>{t.description}</small>
                </Menu.Item>
              ))}
              <Menu.Item onClick={this.handleCreateStart}>
                <Icon type="plus" /> Create Tag
              </Menu.Item>
            </Menu>
          }
        >
          <Button icon="plus">Add tag</Button>
        </Dropdown>
        <div>
          <a
            className="TagSelect-manageBtn"
            onClick={() => this.setState({ isManaging: true })}
          >
            manage tags
          </a>
        </div>

        <Modal
          title="Create a new tag"
          onOk={this.handleCreate}
          onCancel={() => this.setState({ ...STATE })}
          okText="Create tag"
          okButtonProps={{ disabled: !this.state.text }}
          visible={this.state.isCreating}
        >
          <div className="TagSelect-create">
            <div className="TagSelect-create-preview">
              <Tooltip
                placement="top"
                title={this.state.description || 'Description preview'}
                visible={this.state.isCreating}
              >
                <Tag color={this.state.color}>{this.state.text || 'Preview'}</Tag>
              </Tooltip>
            </div>
            <div className="TagSelect-create-inputs">
              <Input
                autoFocus
                className="TagSelect-create-inputs-text"
                placeholder="tag label"
                onChange={e => this.setState({ text: e.target.value })}
                max={25}
              />
              <Input
                placeholder="tag description"
                onChange={e => this.setState({ description: e.target.value })}
                max={100}
              />
            </div>
          </div>
        </Modal>

        <Modal
          title="Manage tags"
          onCancel={() => this.setState({ isManaging: false })}
          footer={[
            <Button onClick={() => this.setState({ isManaging: false })} key="close">
              Done
            </Button>,
          ]}
          visible={this.state.isManaging}
        >
          <div className="TagSelect-manage">
            <p>Delete tags from the system.</p>
            {store.tags.map(t => (
              <Tooltip key={t.id} placement="top" title={t.description}>
                <Tag color={t.color}>
                  {t.text}{' '}
                  <Popconfirm
                    title={'Delete from the system completely?'}
                    onConfirm={() => this.handleManageDelete(t)}
                    okText="Yes"
                    cancelText="No"
                    placement="bottom"
                  >
                    <Icon type="delete" />
                  </Popconfirm>
                </Tag>
              </Tooltip>
            ))}
            {!store.tags.length && <i>no tags created yet</i>}
          </div>
        </Modal>
      </div>
    );
  }

  private handleCreateStart = () => {
    this.setState({ isCreating: true });
  };

  private handleCreate = async () => {
    const { isCreating, isManaging, ...rest } = this.state;
    const tag = await store.updateTag(rest);
    this.props.onAdd(tag);
    if (store.tagsUpdated) {
      message.info('New tag was created');
    }
    this.setState({ ...STATE });
  };

  private handleManageDelete = async (tag: TagT) => {
    const { onManageDelete } = this.props;
    await store.deleteTag(tag.id);
    if (store.tagDeleted) {
      message.info(`Tag [${tag.text}] deleted from the system`);
      if (onManageDelete) {
        onManageDelete(tag);
      }
    }
  };
}

export default view(TagSelect);
