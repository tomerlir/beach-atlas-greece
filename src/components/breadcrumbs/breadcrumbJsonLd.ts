import { Crumb } from "./Breadcrumbs";

function toAbsolute(href: string, baseUrl: string): string {
  // If already absolute, return as-is
  if (/^https?:\/\//i.test(href)) return href;
  // Ensure leading slash for relative paths
  const rel = href.startsWith("/") ? href : `/${href}`;
  return new URL(rel, baseUrl).toString();
}

export function breadcrumbJsonLd(items: Crumb[], baseUrl: string, currentPageUrl?: string) {
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
      // - Else, if last crumb, use currentPageUrl (preferred) or fallback to baseUrl
      // - Else (mid-trail with no href), omit item to avoid emitting a wrong URL
      let itemUrl: string | undefined;
      if (crumb.href) {
        itemUrl = toAbsolute(crumb.href, baseUrl);
      } else if (isLast) {
        itemUrl = normalizedCurrent ?? baseUrl;
      }

      const listItem: any = {
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
      };
      if (itemUrl) listItem.item = itemUrl;
      return listItem;
    }),
  };
}
