import React from 'react';
import classnames from 'classnames';
import { pour, PlainSVGStringRenderer } from 'sigil-js';

interface Props {
  className?: string;
  point: string;
}

export default class AzimuthSigil extends React.Component<Props> {
  render() {
    const { point, className } = this.props;
    const size = 200;
    let sigil = pour({
      patp: point,
      renderer: PlainSVGStringRenderer,
      size,
    });

    // The sigil uses fixed sizes instead of viewbox, so we'll just replace that
    sigil = sigil.replace(
      `width='${size}' height='${size}'`,
      `viewBox="0 0 ${size} ${size}"`,
    );

    // Base64 so it can be an img like all other profiles
    const b64 = 'data:image/svg+xml;base64,' + Buffer.from(sigil).toString('base64');

    return <img src={b64} className={classnames('Sigil', className)} />;
  }
}
