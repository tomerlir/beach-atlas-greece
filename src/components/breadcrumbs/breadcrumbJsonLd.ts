import { Crumb } from "./Breadcrumbs";

interface BreadcrumbListItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

interface BreadcrumbJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbListItem[];
}

function toAbsolute(href: string, baseUrl: string): string {
  // If already absolute, return as-is
  if (/^https?:\/\//i.test(href)) return href;
  // Ensure leading slash for relative paths
  const rel = href.startsWith("/") ? href : `/${href}`;
  return new URL(rel, baseUrl).toString();
}

export function breadcrumbJsonLd(
  items: Crumb[],
  baseUrl: string,
  currentPageUrl?: string
): BreadcrumbJsonLd {
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("breadcrumbJsonLd: baseUrl must be absolute, e.g. https://yourdomain.tld");
  }
  const normalizedCurrent = currentPageUrl
    ? /^https?:\/\//i.test(currentPageUrl)
      ? currentPageUrl
      : new URL(currentPageUrl, baseUrl).toString()
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => {
      const isLast = index === items.length - 1;

      // Determine item URL:
      // - Prefer crumb.href if present (absolute or relative)
      // - Else, if last crumb AND currentPageUrl was provided, use it
      // - Else, omit item. Google explicitly allows omitting `item` on the
      //   final crumb, and falling back to baseUrl pointed every leaf to the
      //   homepage — a worse outcome than no URL at all.
      let itemUrl: string | undefined;
      if (crumb.href) {
        itemUrl = toAbsolute(crumb.href, baseUrl);
      } else if (isLast && normalizedCurrent) {
        itemUrl = normalizedCurrent;
      }

      const listItem: BreadcrumbListItem = {
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
      };
      if (itemUrl) listItem.item = itemUrl;
      return listItem;
    }),
  };
}
