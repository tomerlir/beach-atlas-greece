import { Crumb } from './Breadcrumbs';

export function breadcrumbJsonLd(items: Crumb[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((crumb, index) => {
      const listItem: any = {
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.label
      };
      
      if (crumb.href) {
        listItem.item = new URL(crumb.href, baseUrl).toString();
      }
      
      return listItem;
    })
  };
}
