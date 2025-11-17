import React from "react";
import { Breadcrumbs, Crumb } from "./Breadcrumbs";
import { breadcrumbJsonLd } from "./breadcrumbJsonLd";
import JsonLdScript from "../seo/JsonLdScript";

export type BreadcrumbsWithJsonLdProps = {
  items: Crumb[];
  currentPageUrl?: string; // absolute URL preferred
};

export const BreadcrumbsWithJsonLd: React.FC<BreadcrumbsWithJsonLdProps> = ({
  items,
  currentPageUrl,
}) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com";
  const jsonLd = breadcrumbJsonLd(items, baseUrl, currentPageUrl);

  return (
    <>
      <Breadcrumbs items={items} />
      <JsonLdScript schema={jsonLd} />
    </>
  );
};

export default BreadcrumbsWithJsonLd;
