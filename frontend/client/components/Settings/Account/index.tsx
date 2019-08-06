import React from 'react';
import ChangeEmail from './ChangeEmail';

export default class AccountSettings extends React.Component<{}> {
  render() {
    return (
      <div className="AccountSettings">
        <ChangeEmail />
      </div>
    );
  }
}
