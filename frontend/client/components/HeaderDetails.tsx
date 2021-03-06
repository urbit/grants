import React from 'react';
import { Helmet } from 'react-helmet';
import { urlToPublic } from 'utils/helpers';

interface Props {
  title: string;
  image?: string;
  url?: string;
  type?: string;
  description?: string;
}

export default class HeaderDetails extends React.Component<Props> {
  render() {
    const { title, image, url, type, description } = this.props;
    return (
      <Helmet>
        <title>{`Urbit Grants - ${title}`}</title>
        {/* open graph protocol */}
        {type && <meta property="og:type" content="website" />}
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        {url && <meta property="og:url" content={urlToPublic(url)} />}
        {image && <meta property="og:image" content={urlToPublic(image)} />}
        {/* twitter card */}
        <meta property="twitter:title" content={title} />
        {description && <meta property="twitter:description" content={description} />}
        {url && <meta property="twitter:url" content={urlToPublic(url)} />}
        {image && <meta property="twitter:image" content={urlToPublic(image)} />}
      </Helmet>
    );
  }
}
