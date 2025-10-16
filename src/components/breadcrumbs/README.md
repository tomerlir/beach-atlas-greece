# Breadcrumb Components

This directory contains standardized breadcrumb components for the Beach Atlas application.

## Components

### `Breadcrumbs`

A basic breadcrumb component that renders a navigation trail.

**Props:**

- `items: Crumb[]` - Array of breadcrumb items

**Usage:**

```tsx
<Breadcrumbs
  items={[
    { label: "Home", href: "/" },
    { label: "Areas", href: "/areas" },
    { label: "Current Page" }, // no href = current page
  ]}
/>
```

### `BreadcrumbsWithJsonLd`

A breadcrumb component that also generates JSON-LD structured data for SEO.

**Props:**

- `items: Crumb[]` - Array of breadcrumb items

**Usage:**

```tsx
<BreadcrumbsWithJsonLd
  items={[
    { label: "Home", href: "/" },
    { label: "Areas", href: "/areas" },
    { label: "Current Page" },
  ]}
/>
```

## Types

### `Crumb`

```ts
type Crumb = {
  label: string;
  href?: string;
};
```

- `label`: Display text for the breadcrumb
- `href`: Optional URL for the breadcrumb (if not provided, it's treated as the current page)

## Environment Configuration

The `BreadcrumbsWithJsonLd` component uses the `VITE_SITE_URL` environment variable for generating absolute URLs in JSON-LD.

Add to your `.env` file:

```
VITE_SITE_URL=https://beachesofgreece.com
```

## Implementation Rules

1. **Home page (`/`)**: No breadcrumbs should be shown
2. **Areas index (`/areas`)**: `Home › Areas`
3. **Area page (`/{area}`)**: `Home › Areas › {Area}`
4. **Beach detail (`/{area}/{beach}`)**: `Home › Areas › {Area} › {Beach}`
5. **About page (`/about`)**: `Home › About`
6. **Feedback**: `Home › Feedback` (if implemented as a page)

## Styling

The breadcrumbs use Tailwind CSS classes:

- Small, muted text (`text-sm text-gray-500`)
- Hover effects on links
- Current page is highlighted (`text-gray-700 font-medium`)
- Responsive design with flex-wrap for mobile
