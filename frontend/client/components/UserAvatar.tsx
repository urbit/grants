import React from 'react';
import { User } from 'types';
import AzimuthSigil from 'components/AzimuthSigil';
import defaultUserImg from 'static/images/avatar-default.png';

interface Props {
  user: User;
  className?: string;
}

const UserAvatar: React.SFC<Props> = ({ user, className }) => {
  if (user.azimuth) {
    return <AzimuthSigil point={user.azimuth.point} className={className} />;
  } else if (user.avatar && user.avatar.imageUrl) {
    return <img className={className} src={user.avatar.imageUrl} />;
  } else {
    return <img className={className} src={defaultUserImg} />;
  }
};

export default UserAvatar;
