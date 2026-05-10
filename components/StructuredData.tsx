import React from 'react';

export function WebSiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sage Movies',
    url: 'https://sagemovies.com',
    description: 'Watch free movies, TV shows and anime online. Stream trending movies, 123movies alternatives, movies for kids and popular TV series without registration.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://sagemovies.com/?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    sameAs: [
      'https://www.facebook.com/sagemovies',
      'https://twitter.com/sagemovies',
      'https://www.instagram.com/sagemovies',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sage Movies',
    url: 'https://sagemovies.com',
    logo: 'https://sagemovies.com/logo.png',
    description: 'Watch free movies, TV shows and anime online. Stream trending movies, 123movies alternatives, movies for kids and popular TV series without registration.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@sagemovies.com',
    },
    sameAs: [
      'https://www.facebook.com/sagemovies',
      'https://twitter.com/sagemovies',
      'https://www.instagram.com/sagemovies',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
