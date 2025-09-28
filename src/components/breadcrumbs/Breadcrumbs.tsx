import React from 'react';

export type Crumb = { 
  label: string; 
  href?: string; 
};

export type BreadcrumbsProps = { 
  items: Crumb[]; 
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-2">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((crumb, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">›</span>}
            {crumb.href ? (
              <a 
                href={crumb.href} 
                className="hover:underline hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </a>
            ) : (
              <span 
                aria-current="page" 
                className="text-gray-700 font-medium"
              >
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
