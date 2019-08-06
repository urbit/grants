import React from 'react';
import { Link } from 'react-router-dom';
import { withNamespaces, WithNamespaces } from 'react-i18next';
import HeaderDetails from 'components/HeaderDetails';
import Markdown from 'components/Markdown';
import './style.less';

class Home extends React.Component<WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <div className="Home">
        <HeaderDetails title={t('home.title')} description={t('home.description')} />
        <div className="Home-hero">
          <div className="Home-hero-inner">
            <p className="Home-hero-text">
              {t('home.explanation')}
            </p>
            <div className="Home-hero-sections">
              <div className="Home-hero-sections-section">
                <h3>{t('home.explanationTitle1')}</h3>
                <Markdown source={t('home.explanationText1')} />
              </div>
              <div className="Home-hero-sections-section">
                <h3>{t('home.explanationTitle2')}</h3>
                <Markdown source={t('home.explanationText2')} />
              </div>
              <div className="Home-hero-sections-section">
                <h3>{t('home.explanationTitle3')}</h3>
                <Markdown source={t('home.explanationText3')} />
              </div>
            </div>

            <div className="Home-hero-buttons">
              <Link className="Home-hero-buttons-button is-primary" to="/create">
                {t('home.createButton')}
              </Link>
              <Link className="Home-hero-buttons-button" to="/rfws">
                {t('home.exploreButton')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withNamespaces()(Home);
