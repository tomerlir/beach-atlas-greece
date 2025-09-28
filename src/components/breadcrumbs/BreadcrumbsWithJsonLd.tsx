import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Breadcrumbs, Crumb } from './Breadcrumbs';
import { breadcrumbJsonLd } from './breadcrumbJsonLd';

export type BreadcrumbsWithJsonLdProps = {
  items: Crumb[];
  currentPageUrl?: string; // absolute URL preferred
};

export const BreadcrumbsWithJsonLd: React.FC<BreadcrumbsWithJsonLdProps> = ({ items, currentPageUrl }) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://beachesofgreece.com';
  const jsonLd = breadcrumbJsonLd(items, baseUrl, currentPageUrl);

  return (
    <>
      <Breadcrumbs items={items} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
    </>
  );
};

export default BreadcrumbsWithJsonLd;
