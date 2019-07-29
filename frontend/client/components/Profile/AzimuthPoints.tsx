import React from 'react';
import classnames from 'classnames';
import Web3 from 'web3';
import { azimuth } from 'azimuth-js';
import { patp } from 'urbit-ob';
import { message, Modal, Spin, Alert } from 'antd';
import {
  EIP712Data,
  getAndEnableWeb3,
  getAzimuthContracts,
} from 'utils/web3';
import Sigil from 'components/AzimuthSigil';
import './AzimuthPoints.less';

interface Props {
  onSelectPoint(data: EIP712Data, signature: string): void;
  onCancel(): void;
}

interface State {
  web3: Web3 | null;
  points: string[];
  selectedPoint: string;
  isSigning: boolean;
}

export default class AzimuthPoints extends React.Component<Props, State> {
  state: State = {
    web3: null,
    points: [],
    selectedPoint: '',
    isSigning: false,
  };

  async componentDidMount() {
    try {
      const web3 = await getAndEnableWeb3();
      const contracts = getAzimuthContracts(web3);
      const [address] = await web3.eth.getAccounts();
      if (!address) {
        throw new Error('No web3 address could be found');
      }

      const points = await azimuth.getOwnedPoints(contracts, address);
      if (!points || !points.length) {
        throw new Error('Your ETH address has no Azimuth points');
      }

      this.setState({
        web3,
        points: points.map(patp),
      });
    } catch (err) {
      message.error(err.message);
      this.props.onCancel();
    }
  }

  render() {
    const { points, selectedPoint, isSigning } = this.state;
    if (!points.length) {
      return null;
    }

    return (
      <Modal
        className="AzimuthPoints"
        visible
        title="Select an Azimuth Point"
        width={560}
        onCancel={this.props.onCancel}
        onOk={this.signProof}
        okButtonProps={{ disabled: !selectedPoint }}
      >
        <Spin spinning={isSigning}>
          <Alert
            type="info"
            message="Be aware of your privacy"
            description={`
              Please note that your azimuth point will be publicly linked to
              your profile information if you choose to connect it
            `}
          />
          {points.map(p => (
            <button
              key={p}
              className={classnames(
                'AzimuthPoints-point',
                selectedPoint === p && 'is-active',
              )}
              onClick={() => this.setState({ selectedPoint: p })}
            >
              <Sigil className="AzimuthPoints-point-sigil" point={p} />
              <code className="AzimuthPoints-point-name">{p}</code>
            </button>
          ))}
        </Spin>
      </Modal>
    );
  }

  private signProof = async () => {
    const { selectedPoint: point, web3 } = this.state;
    if (!point || !web3) return;

    this.setState({ isSigning: true });

    try {
      const userid = 123;
      const chainId = await web3.eth.net.getId();
      const [address] = await web3.eth.getAccounts();
      // Keep in sync with backend's azimuth.py make_data
      const rawTypedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          authorization: [
            { name: 'userid', type: 'uint256' },
            { name: 'point', type: 'string' },
          ],
        },
        domain: {
          name: 'test.test',
          version: '1',
          chainId,
        },
        primaryType: 'authorization',
        message: {
          userid,
          point,
        },
      } as EIP712Data;

      const signature = await web3.currentProvider.send('eth_signTypedData_v3', [
        address,
        JSON.stringify(rawTypedData),
      ]);
      this.props.onSelectPoint(rawTypedData, signature);
    } catch (err) {
      // Metamask errors are unwieldly messes
      console.error(err);
      message.error('Failed to sign proof of ownership');
      this.setState({ isSigning: false });
    }
  };
}
