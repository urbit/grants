import React from 'react';
import { withNamespaces, WithNamespaces } from 'react-i18next';
import './style.less';

const Footer: React.SFC<WithNamespaces> = () => (
  <footer className="Footer">
    <div className="Footer-inner">
      <div className="Footer-section">
        <div className="Footer-section-title">Follow</div>
        <div className="Footer-section-links">
          <a href="https://twitter.com/urbit">twitter.com/urbit</a>
          <a href="https://github.com/urbit">github.com/urbit</a>
        </div>
      </div>
      <div className="Footer-section">
        <div className="Footer-section-title">Company</div>
        <div className="Footer-section-links">
          <a href="https://urbit.org/faq/">FAQ</a>
          <a href="https://urbit.org/privacy/">Privacy Policy</a>
          <a href="https://urbit.org/tos/">Terms of Service</a>
          <a href="https://urbit.org/bounty/">Bug Bounty + Security</a>
        </div>
      </div>
      <div className="Footer-section">
        <div className="Footer-section-title">Contact</div>
        <div className="Footer-section-links">
          <a href="mailto:support@urbit.org">support@urbit.org</a>
        </div>
      </div>
    </div>
  </footer>
);

export default withNamespaces()(Footer);
