import { Crumb } from './Breadcrumbs';

export function breadcrumbJsonLd(items: Crumb[], baseUrl: string, currentPageUrl?: string) {
  // Ensure baseUrl is absolute
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((crumb, index) => {
      const listItem: any = {
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.label
      };
      
      // Always include item URL - normalize href to start with /
      let itemUrl: string;
      if (crumb.href) {
        // Normalize href to start with /
        const normalizedHref = crumb.href.startsWith('/') ? crumb.href : `/${crumb.href}`;
        itemUrl = `${normalizedBaseUrl}${normalizedHref}`;
      } else {
        // For current page (last crumb), use the provided current page URL or fallback to baseUrl
        itemUrl = currentPageUrl || normalizedBaseUrl;
      }
      
      listItem.item = itemUrl;
      return listItem;
    })
  };
}
