import React from 'react';
import MarkdownPage from 'components/MarkdownPage';

const About = () => {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://grant.io/about/';
  }
  return <MarkdownPage markdown="Redirecting to grant.io..." />;
};

export default About;
