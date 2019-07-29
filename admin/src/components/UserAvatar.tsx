import React from 'react';
import { User } from 'types';
import { Avatar } from 'antd';
import { AvatarProps } from 'antd/lib/avatar';
import { pour, PlainSVGStringRenderer } from 'sigil-js';

interface Props extends AvatarProps {
  user: User | null | undefined;
  className?: string;
}

const makeSigilB64 = (point: string): string => {
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
  return 'data:image/svg+xml;base64,' + Buffer.from(sigil).toString('base64');
};

const UserAvatar: React.SFC<Props> = ({ user, ...rest }) => {
  let src;
  if (user && user.azimuth) {
    src = makeSigilB64(user.azimuth.point);
  } else if (user && user.avatar && user.avatar.imageUrl) {
    src = user.avatar.imageUrl;
  }
  return <Avatar {...rest} src={src} />;
};

export default UserAvatar;
