# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Beaches of Greece** (`beachesofgreece.com`) — a React/TypeScript SPA for discovering Greek beaches. ~200+ beaches across ~10 Greek regions, with advanced NLP search, interactive maps, admin panel, and SEO-optimized pre-rendered pages.

## Commands

```bash
# Development
npm run dev              # Start dev server on port 8080
npm run build            # Production build (runs prebuild checks first)
npm run preview          # Preview production build

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier formatting
npm run format:check     # Check formatting

# Testing
npm run test:run         # Single test run (use this for CI)
npm run test             # Watch mode
npm run test:coverage    # Coverage report

# Utilities
npm run generate-sitemap # Regenerate XML sitemap
npm run build:analyze    # Visual bundle size analysis
```

**Note:** `npm run build` automatically runs `lint + format:check + generate-routes + validate:schemas` via the `prebuild` hook.

## Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite 7
- **Routing:** React Router DOM 6 (lazy-loaded pages)
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix UI primitives)
- **Server State:** TanStack React Query 5 (staleTime: 5min, gcTime: 30min)
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Maps:** Leaflet + React Leaflet (ArcGIS satellite tiles)
- **NLP:** wink-nlp + compromise + custom fuzzy matching

### Key Directory Structure
```
src/
├── components/          # UI components (admin/, auth/, ui/ shadcn, etc.)
├── pages/               # Lazy-loaded route pages (admin/ for protected routes)
├── contexts/            # React Context providers (AuthContext)
├── hooks/               # 25+ custom hooks (useBeachFiltering, useUrlState, etc.)
├── lib/                 # Core logic
│   ├── nlp/            # NLP search pipeline
│   ├── location/       # Geographic filtering
│   ├── explanations/   # Search explanation engine
│   └── analytics.ts    # Dual analytics (Umami + GA4 with Consent Mode v2)
├── integrations/supabase/  # Supabase client and types
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
scripts/                # Build utilities (sitemap, routes, image tools)
```

### Data Flow
- All beach/area data fetched from Supabase via React Query hooks
- URL params used as primary filter state (`useUrlState` hook)
- NLP search parses natural language queries into structured filters
- Pre-rendered pages (SSG) for SEO-critical routes

### Route Structure
- 14 public routes: home, beach detail, area pages, search, favorites, etc.
- 9 protected admin routes: `/admin/*` guarded by `AuthContext` + Supabase role check

### Code Splitting
Vite is configured with 7+ manual chunks: `react-vendor`, `ui-common`, `ui-rare`, `data-vendor`, `map-vendor`, `nlp-vendor`, `admin-vendor`, `utils-vendor`. Don't break this structure inadvertently.

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SITE_URL=https://beachesofgreece.com
VITE_GA_MEASUREMENT_ID=
SUPABASE_SECRET_KEY=    # Only for scripts, not client-side
```

## Key Conventions

- **Path alias:** `@/` maps to `src/`
- **Formatting:** Prettier — 100 char width, double quotes, 2-space indent, LF line endings
- **Linting:** No `console.log` (warn), no `any` (warn), no duplicate imports (error)
- **TypeScript:** Relaxed config — no strict mode, unused variable warnings disabled
- **Images:** Use `OptimizedImage` component for WebP/AVIF responsive images
- **Analytics:** Always use `analytics.ts` helpers, never call GA/Umami directly — respects consent state
