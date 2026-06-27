import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import StructuredData from './StructuredData';

const SEO = ({
  title = 'Xilolo',
  description = 'Discover and create amazing events with Xilolo - your destination for live experiences, creators, and social commerce.',
  keywords = 'Xilolo, events, event management, tickets, organizers, concerts, parties, entertainment, social events',
  image = '/images/event-dummy.jpg',
  url = typeof window !== 'undefined' ? window.location.href : 'https://xilolo.com',
  type = 'website',
  author = 'Xilolo',
  twitterCard = 'summary_large_image',
  locale = 'en_US',
  twitterSite = '@zagasmstudios',
  publishedTime,
  modifiedTime,
  noIndex = false,
  structuredData = [],
}) => {
  const siteName = 'Xilolo';
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`;
  const updatedAt = modifiedTime || new Date().toISOString();
  const siteUrl = 'https://xilolo.com';
  const canonicalUrl = url || siteUrl;
  const absoluteImage = image?.startsWith('http')
    ? image
    : `${siteUrl}${image?.startsWith('/') ? image : `/${image}`}`;
  const robotsContent = noIndex
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const customStructuredData = useMemo(
    () =>
      Array.isArray(structuredData) && structuredData.length
        ? structuredData
        : [],
    [structuredData]
  );

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="title" content={fullTitle} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:locale" content={locale} />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={absoluteImage} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:updated_time" content={updatedAt} />

        {/* Article meta (if applicable) */}
        {publishedTime && <meta property="article:published_time" content={publishedTime} />}
        {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

        {/* Twitter */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:site" content={twitterSite} />
        <meta name="twitter:creator" content={twitterSite} />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={absoluteImage} />

        {/* Additional SEO */}
        <meta name="robots" content={robotsContent} />
        <meta name="googlebot" content={robotsContent} />
        <meta name="language" content="English" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#050505" />
        <link rel="apple-touch-icon" href="/img/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Helmet>

      {/* Structured Data */}
      <StructuredData.OrganizationStructuredData />
      <StructuredData.WebsiteSearchBoxStructuredData />
      {customStructuredData.map((obj, idx) => (
        <Helmet key={`custom-schema-${idx}`}>
          <script type="application/ld+json">{JSON.stringify(obj)}</script>
        </Helmet>
      ))}
    </>
  );
};

export default SEO;
