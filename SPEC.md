# SPEC.md — Beaches of Greece

> Comprehensive specification of the application at [beachesofgreece.com](https://beachesofgreece.com).
> Generated from source code analysis. Nothing in this document changes the codebase.

---

## 1. Overview

**Beaches of Greece** is a beach directory and discovery platform for Greek beaches. Users can search, filter, browse by area, and explore beaches on an interactive map. The app emphasizes verified data, NLP-powered natural language search, and detailed attribute-based filtering (type, wave conditions, amenities, parking, etc.).

- **Domain**: `beachesofgreece.com`
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL)
- **Deployment**: Pre-rendered static site (SSG) with client-side hydration
- **Database**: ~8,000+ beaches across ~19 areas (Greek islands and regions)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3, TypeScript 5.8 |
| Build | Vite 7.1 with custom plugins, SSG via `vite-plugin-prerender` |
| Routing | React Router DOM 6.30 (client-side) |
| Styling | Tailwind CSS 3.4, shadcn/ui (Radix primitives) |
| State | TanStack React Query 5 (server state), URL search params (filter state) |
| Forms | React Hook Form 7 + Zod 3 |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth (email/password, role-based) |
| Maps | Leaflet 1.9 + React Leaflet 4.2, ArcGIS satellite tiles |
| NLP | wink-nlp, compromise, custom entity recognizers + fuzzy matchers |
| Analytics | Umami (privacy-first) + Google Analytics 4 (Consent Mode v2) |
| Testing | Vitest 3.2 + happy-dom |
| SEO | react-helmet-async, JSON-LD structured data, XML sitemap |
| Offline | Service Worker with tiered caching strategies |
| Icons | Lucide React |

---

## 3. Routes

### 3.1 Public Routes

| Path | Page Component | Description |
|---|---|---|
| `/` | `Index` | Home page — hero, search bar, filter bar, paginated beach grid |
| `/areas` | `Areas` | Grid of all area cards with beach counts and hero images |
| `/:areaSlug` | `Area` | Area-specific beach listing with area hero, search, filters, nearby areas |
| `/:area/:beach-name` | `BeachDetail` | Individual beach detail page with photo, summary, amenities, description, siblings |
| `/map` | `Map` | Interactive Leaflet map with satellite imagery, markers, popup cards |
| `/about` | `About` | About the project |
| `/faq` | `FAQ` | Frequently asked questions |
| `/guide` | `Guide` | User guide / how-to |
| `/privacy` | `Privacy` | Privacy policy |
| `/ontology` | `Ontology` | Data schema documentation |
| `*` | `NotFound` | 404 catch-all |

### 3.2 Admin Routes (Protected — requires `admin` role)

| Path | Page Component | Description |
|---|---|---|
| `/admin/login` | `AdminLogin` | Admin email/password login |
| `/admin/accept-invite` | `AcceptInvite` | Token-based admin invite acceptance |
| `/admin` | `AdminDashboard` | Stats overview (total beaches, organized, blue flag, locations), recent activity, user management |
| `/admin/beaches` | `AdminBeachesList` | Paginated beach table with search |
| `/admin/beaches/new` | `AdminBeachCreate` | Create new beach form |
| `/admin/beaches/:id` | `AdminBeachEdit` | Edit existing beach |
| `/admin/areas` | `AdminAreasList` | Area list management |
| `/admin/areas/new` | `AdminAreaCreate` | Create new area |
| `/admin/areas/:id` | `AdminAreaEdit` | Edit existing area |
| `/admin/import-export` | `ImportExport` | CSV import/export for bulk operations |
| `/admin/settings` | `AdminSettings` | Admin account settings, password change |

All admin routes are wrapped in `AuthProvider` + `ProtectedRoute` with `requiredRole="admin"`.

---

## 4. Database Schema

### 4.1 Tables

**`beaches`** — Primary data table

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `name` | text | Beach name |
| `slug` | text | URL-safe identifier |
| `area` | text | Area name (denormalized) |
| `area_id` | uuid (FK → areas) | Foreign key to areas table |
| `latitude` | float | GPS latitude |
| `longitude` | float | GPS longitude |
| `type` | text | `SANDY`, `PEBBLY`, `MIXED`, `OTHER` |
| `wave_conditions` | text | `CALM`, `MODERATE`, `WAVY`, `SURFABLE` |
| `parking` | text | `NONE`, `ROADSIDE`, `SMALL_LOT`, `LARGE_LOT` |
| `organized` | boolean | Has organized amenities (sunbeds, umbrellas, etc.) |
| `blue_flag` | boolean | Blue Flag certification |
| `amenities` | text[] | Array of amenity keys (see Section 6) |
| `photo_url` | text | Photo URL |
| `photo_source` | text | Photo attribution/source |
| `description` | text | Beach description |
| `source` | text | Data source reference |
| `status` | text | `ACTIVE` or inactive (only ACTIVE shown publicly) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last modification |
| `verified_at` | timestamp | Last verified date |

**`areas`** — Geographic regions

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `name` | text | Area name (e.g., "Mykonos", "Crete") |
| `slug` | text | URL-safe identifier |
| `description` | text | Area description |
| `hero_photo_url` | text | Hero image URL |
| `hero_photo_source` | text | Photo attribution |
| `status` | text | `ACTIVE` or inactive |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`profiles`** — User profiles

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | Supabase auth user ID |
| `email` | text | |
| `role` | text | `admin` or `user` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`user_roles`** — Role-based access

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | |
| `role` | enum(`admin`, `user`) | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`admin_invites`** — Admin invitation tokens

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | |
| `email` | text | Invitee email |
| `email_lower` | text | Lowercase for matching |
| `token` | text | Unique invite token |
| `invited_by` | uuid | Inviting admin user ID |
| `expires_at` | timestamp | Expiration time |
| `accepted` | boolean | Whether invite was accepted |
| `accepted_at` | timestamp | When accepted |
| `created_at` | timestamp | |

**`admin_audit_log`** — Admin action audit trail

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | |
| `admin_user_id` | uuid | Admin who performed action |
| `action` | text | Action type |
| `target_user_id` | uuid | Target user (if applicable) |
| `details` | jsonb | Action details |
| `created_at` | timestamp | |

### 4.2 Views

**`beaches_with_areas`** — Joins beaches with their area data (area name, slug, description, hero photo).

### 4.3 Database Functions (RPC)

| Function | Purpose |
|---|---|
| `is_admin()` | Check if current user is admin |
| `has_role(user_id, role)` | Check if user has specific role |
| `can_access_admin_functions()` | Authorization check |
| `get_all_users()` | List all users (admin only) |
| `get_users_for_admin()` | User list with metadata |
| `get_user_management_data()` | Extended user data for management |
| `get_current_user_email()` | Current user's email |
| `promote_to_admin(user_id)` | Grant admin role |
| `demote_from_admin(user_id)` | Revoke admin role |
| `create_admin_invite(email)` | Generate invite token |
| `accept_admin_invite(token)` | Accept an invite |
| `list_admin_invites()` | List all invites |
| `log_admin_action(type, details)` | Audit log entry |
| `bootstrap_first_admin(email)` | Bootstrap first admin user |

---

## 5. Features

### 5.1 Beach Discovery (Home Page)

- **Hero section** with responsive background image (AVIF/WebP, 640w–2560w) and headline "Find Your Perfect Greek Beach"
- **NLP search bar** in hero — accepts natural language queries like "calm sandy beach in Crete with parking"
- **Filter bar** below hero with dropdowns for: Beach Type, Wave Conditions, Organized, Parking, Amenities, Blue Flag, Near Me
- **"All Filters" drawer** (mobile) for advanced filtering
- **Results summary** showing count and active filters
- **Beach card grid** (3 columns desktop, 1 mobile) showing: photo, name, area, amenity badges, distance (if Near Me enabled)
- **Pagination** (9 beaches per page)
- **Empty state** with per-filter removal chips and action buttons (clear all, turn off Near Me, reset parking, etc.)
- **URL-driven filter state** — all filters are serialized to URL search params, enabling shareable/bookmarkable filtered views

### 5.2 Area Pages

- **Hero section** with area-specific hero photo and "Find Your Perfect Beach in {Area}" headline
- **Breadcrumb navigation** (Home > Areas > {Area})
- **Same filter/search system** as home page, scoped to the area
- **Place mismatch notification** — if NLP detects a location that doesn't match the current area
- **Nearby areas chips** at bottom — links to geographically adjacent areas (calculated by centroid distance)
- **Photo attribution** for hero images

### 5.3 Beach Detail Page

- **Breadcrumbs** (Home > Areas > {Area} > {Beach})
- **Back to results** button with smart navigation (returns to previous page or area fallback)
- **Hero photo** with lazy loading, blur-up placeholder, and photo attribution
- **Title row** with action buttons:
  - **Directions** — opens Apple Maps (iOS) or Google Maps (Android/desktop) with beach coordinates
  - **Share** — native share API with clipboard fallback and share dialog fallback
  - **Feedback** — mailto: link with pre-filled subject/body
- **Area link badge** — navigates to area page
- **Verification timestamp** — shows "Verified {relative time}" from `updated_at`
- **Summary section** — Beach Type, Wave Conditions, Organization, Parking, Blue Flag (if certified)
- **Description section** — with "Read more" / "Read less" truncation at 200 characters
- **Amenities section** — grouped by category (Facilities, Safety, Services, Activities) with icons
- **More in Area** section — shows 2 sibling beaches from same area
- **Share dialog** — fallback for browsers without native share API

### 5.4 Areas Overview Page

- **Hero section** with "Explore Greek Beach Areas" headline
- **Grid of area cards** — each shows: hero photo, area name, beach count badge, description
- **Skeleton loading** states
- **Photo attribution** per card

### 5.5 Interactive Map

- **Hero section** with search bar and "Explore Beaches on the Map"
- **Filter bar** — same filters as home page
- **Results summary** above map
- **Leaflet map** with:
  - ArcGIS World Imagery (satellite) as base layer
  - World Boundaries and Places label overlay
  - Default bounds covering Greece (34.6°–41.8°N, 19.0°–29.6°E)
  - Auto-fit bounds to filtered beach markers
  - Markers for each beach with popup containing a `BeachCard` component
- **Map engagement tracking** — tracks pan/zoom interactions, popup views, session duration
- **Map session analytics** — periodic emission every 30s, exploration intensity calculation (low/medium/high)

### 5.6 Natural Language Search (NLP)

The search bar supports natural language queries that are parsed into structured filters:

- **Entity recognition** — extracts locations, beach types, wave conditions, amenities from free text
- **Location extraction** — matches against known Greek place names with fuzzy matching
- **Sentiment analysis** — detects user intent (discovery, relaxation, adventure, etc.)
- **Filter extraction** — "sandy beach with calm water near Corfu" → `{ type: ["SANDY"], waveConditions: ["CALM"], location: "corfu" }`
- **Fuzzy matching** — handles typos and partial matches (e.g., "Mikonos" → "Mykonos")
- **Multi-location support** — queries mentioning multiple areas
- **Remaining search term** — after extracting filters, leftover text becomes free-text name search
- **Lazy-loaded NLP model** — wink-nlp model loaded on demand to keep initial bundle small

### 5.7 Geolocation ("Near Me")

- **Browser Geolocation API** with permission prompts
- **Distance calculation** using Haversine formula (km)
- **Auto-sort by distance** when "Near Me" is enabled and location is available
- **Geolocation error banner** with retry and dismiss options
- **Debounced requests** (300ms) with cancellation support
- **5-minute location cache** (`maximumAge: 300000`)

### 5.8 Admin Dashboard

- **Stats cards** — total beaches, organized count, Blue Flag count, unique locations
- **Recent activity** — last 5 updated beaches with relative timestamps
- **User management tab** — list users, promote/demote admin, invite new admins
- **Beach CRUD** — create, edit, delete beaches with form validation (React Hook Form + Zod)
- **Area CRUD** — create, edit areas
- **CSV Import/Export** — bulk import beaches via CSV with schema validation, export to CSV
- **Invite system** — generate token-based invites, track acceptance
- **Audit logging** — all admin actions logged with timestamps and details
- **Two Supabase clients** — `supabase` (public, anon key) and `authSupabase` (admin, with auth headers)

### 5.9 Offline Support (Service Worker)

Four tiered caches with different strategies:

| Cache | Strategy | TTL | Content |
|---|---|---|---|
| `beach-static-v2` | Cache-first, stale-while-revalidate for HTML | 1 day | HTML, JS, CSS |
| `beach-images-v2` | Cache-first with TTL check | 3 days | Beach photos |
| `beach-atlas-v2` | Network-first with cache fallback | 5 min | Supabase API responses |
| `beach-precache-v2` | Pre-cached on install | 7 days | Core routes (`/`, `/areas`, `/map`, `/about`, `/guide`) |

- **Offline fallback** — SVG placeholder for images, basic HTML for documents
- **Background sync** support (registered but minimal implementation)
- **Auto-cleanup** of old cache versions on activation

---

## 6. Data Enumerations

### 6.1 Beach Types

| Value | Display Label |
|---|---|
| `SANDY` | Sandy |
| `PEBBLY` | Pebbles |
| `MIXED` | Mixed |
| `OTHER` | Other |

### 6.2 Wave Conditions

| Value | Display Label |
|---|---|
| `CALM` | Calm Waters |
| `MODERATE` | Moderate Waves |
| `WAVY` | Wavy |
| `SURFABLE` | Surfable |

### 6.3 Parking Types

| Value | Display Label |
|---|---|
| `NONE` | No Parking |
| `ROADSIDE` | Roadside Parking |
| `SMALL_LOT` | Small Parking Lot |
| `LARGE_LOT` | Large Parking Lot |

### 6.4 Amenities

| Key | Label | Category |
|---|---|---|
| `sunbeds` | Sunbeds | Facilities |
| `umbrellas` | Umbrellas | Facilities |
| `showers` | Showers | Facilities |
| `toilets` | Toilets | Facilities |
| `lifeguard` | Lifeguard | Safety |
| `beach_bar` | Beach Bar | Services |
| `taverna` | Taverna | Services |
| `food` | Food | Services |
| `music` | Music | Services |
| `snorkeling` | Snorkeling | Activities |
| `water_sports` | Water Sports | Activities |
| `family_friendly` | Family Friendly | Activities |
| `boat_trips` | Boat Trips | Activities |
| `fishing` | Fishing | Activities |
| `photography` | Photography | Activities |
| `hiking` | Hiking | Activities |
| `birdwatching` | Birdwatching | Activities |
| `cliff_jumping` | Cliff Jumping | Activities |

### 6.5 User Roles

| Value | Access |
|---|---|
| `admin` | Full admin dashboard, CRUD, user management |
| `user` | Public site only |

---

## 7. Filter System

All filter state is stored in URL search parameters and parsed by `useUrlState`.

### 7.1 URL Parameters

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Search query text |
| `oq` | string | Original NLP query (before parsing) |
| `loc` | string | Single extracted location |
| `locs` | string (comma-separated) | Multiple extracted locations |
| `org` | string (comma-separated) | Organized filter values |
| `bf` | `1` or absent | Blue Flag filter |
| `p` | string (comma-separated) | Parking filter values |
| `am` | string (comma-separated) | Amenity filter values |
| `wc` | string (comma-separated) | Wave condition values |
| `t` | string (comma-separated) | Beach type values |
| `sort` | `{key}.{dir}` | Sort (e.g., `name.asc`, `distance.asc`) |
| `nm` | `1` or absent | Near Me enabled |
| `page` | integer | Current page number |

### 7.2 Filter Logic

Filters are applied in `useBeachFiltering` with AND semantics:

1. **Area filter** — on area pages, locked to area name (case-insensitive match)
2. **Location filter** — on global page, matches beach `area` field (supports single or multi-location from NLP)
3. **Search filter** — name/area substring match with NLP stop-word removal on area pages
4. **Organized filter** — matches `organized` boolean
5. **Blue Flag filter** — must be `true` if enabled
6. **Parking filter** — case-insensitive match against parking enum
7. **Amenities filter** — ALL selected amenities must be present (AND logic)
8. **Wave conditions filter** — matches wave_conditions enum
9. **Beach type filter** — matches type enum

### 7.3 Sorting

| Sort Value | Behavior |
|---|---|
| `name.asc` | Alphabetical A→Z (default) |
| `name.desc` | Alphabetical Z→A |
| `distance.asc` | Nearest first (requires geolocation + Near Me) |
| `distance.desc` | Farthest first |

### 7.4 NoIndex Policy

Any URL with query parameters gets `<meta name="robots" content="noindex, follow" />` to prevent search engine indexing of filtered/paginated views. The canonical URL always points to the clean path.

---

## 8. SEO & Structured Data

### 8.1 Meta Tags

Every page generates dynamic meta tags via `react-helmet-async`:

- `<title>` — benefit-focused, 50–60 chars
- `<meta description>` — conversion-optimized, 150–160 chars
- `<link canonical>` — clean URL without query params
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### 8.2 JSON-LD Schemas

| Page | Schema Type | Main Entity |
|---|---|---|
| Home | `WebPage` | `ItemList` of top 20 beaches (each `Beach` + `TouristAttraction`) |
| Area | `WebPage` | `ItemList` of area's beaches (up to 20) |
| Beach Detail | `WebPage` | `Beach` + `TouristAttraction` with `GeoCoordinates`, `LocationFeatureSpecification`, `PropertyValue` |
| Map | `WebPage` | `ItemList` of mapped beaches |
| Areas | `WebPage` | `ItemList` of `Place` entries |

Beach schemas include:
- `GeoCoordinates` (lat/lng)
- `PostalAddress` (area, country: GR)
- `ImageObject` with caption
- `LocationFeatureSpecification` for each amenity
- `PropertyValue` for beach type, wave conditions, parking, Blue Flag, organization
- `OpeningHoursSpecification` for organized beaches
- `BreadcrumbList`

### 8.3 Organization Schema

Injected on key pages for AI engine discovery.

### 8.4 Breadcrumbs

Visual + JSON-LD breadcrumbs on all content pages:
- Home > Areas > {Area} > {Beach}
- Home > Areas > {Area}
- Home > Areas

### 8.5 Sitemap & Robots

- `robots.txt` — standard SEO directives
- `sitemap.xml` — auto-generated from database, covering all beach and area routes
- Prerender routes generated by `scripts/generate-routes.ts` from Supabase data

---

## 9. Analytics System

### 9.1 Providers

| Provider | Purpose | Loading |
|---|---|---|
| **Umami** | Privacy-first analytics (no cookies) | Loaded after consent, `data-auto-track: false` |
| **Google Analytics 4** | Industry-standard analytics | Loaded after consent, Consent Mode v2 |

### 9.2 Consent Flow (GDPR)

1. **Default consent** — set in `index.html` `<head>` BEFORE any scripts: all consent types `denied` with `wait_for_update: 500ms`
2. **Consent banner** — appears when consent is `unknown`; options: Allow, Decline, Manage Choices
3. **Preferences dialog** — toggle analytics on/off, accessible from footer at any time
4. **On accept** — `gtag('consent', 'update', {...granted})`, load scripts, track initial pageview, flush queued events
5. **On reject** — `gtag('consent', 'update', {...denied})`, disable tracking, remove scripts
6. **Persistence** — stored in `localStorage('analytics_consent')`

### 9.3 Events Tracked

| Event | Trigger | Key Properties |
|---|---|---|
| `page_view` | Route change (SPA) | `page_path`, `referrer`, `previous_path` |
| `beach_engagement` | Beach detail page visit (deduplicated per session) | `beach_id`, `source` (search/map/browsing/area_explore), `query_hash` |
| `beach_conversion` | Directions or Share clicked | `beach_id`, `action`, `source` |
| `search_quality` | After search — success/empty/relaxed/abandoned | `query_hash`, `outcome`, `time_to_engagement_ms` |
| `map_open` | Map page loaded | `source` |
| `map_engagement` | Every 30s during map session + on exit | `duration_ms`, `total_interactions`, `unique_beaches_viewed`, `exploration_intensity` |
| `session_summary` | On page hide / 30-min inactivity | `searches_count`, `beaches_engaged`, `conversions_count`, `session_duration_ms`, `outcome` |

### 9.4 Session Quality

Calculated from session state:
- **High** — at least 1 conversion (directions/share)
- **Medium** — 3+ unique beach engagements
- **Low** — fewer than 3 engagements, no conversions

### 9.5 UTM Tracking

Captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `partner` from URL params, persisted in `sessionStorage`.

---

## 10. Performance Optimizations

### 10.1 Code Splitting

All pages and the admin section are lazy-loaded via `React.lazy()`. Vite config splits into named chunks:

| Chunk | Contents |
|---|---|
| `react-vendor` | React, React DOM, React Router |
| `ui-common` | Frequently used UI components |
| `ui-rare` | Infrequently used UI components |
| `data-vendor` | React Query, Supabase, React Hook Form, Zod |
| `map-vendor` | Leaflet, React Leaflet |
| `nlp-vendor` | wink-nlp, compromise |
| `admin-vendor` | Admin-specific libraries |
| `utils-vendor` | Utility libraries |

### 10.2 Image Optimization

- **Responsive images** — `<picture>` element with AVIF and WebP sources at multiple widths (640, 828, 1024, 1280, 1920, 2560)
- **Lazy loading** — `loading="lazy"` on non-critical images
- **Blur-up placeholders** — progressive loading with blur placeholders
- **Image preloading** — `useImagePreloader` hook preloads images for visible beach cards
- **Priority loading** — first 3 cards on grid get priority loading
- **Optimized logo** — multiple formats (PNG, WebP, AVIF) at multiple sizes

### 10.3 Caching

- **React Query** — `staleTime: 5min`, `gcTime: 30min`, `offlineFirst` network mode
- **Service Worker** — tiered cache with different TTLs (see Section 5.9)
- **Browser caching** — optimized headers for CDN

### 10.4 Build Optimizations

- **CSS async loading** — custom Vite plugin (`vite-plugin-async-css.ts`)
- **Asset inlining** — files < 4KB inlined
- **Target ES2020** — modern JS output
- **cssnano** — CSS minification
- **Tree shaking** — dead code elimination

### 10.5 Prerendering (SSG)

- All public routes (~8,000+) pre-rendered at build time
- Route list generated from Supabase data via `scripts/generate-routes.ts`
- Metadata for each route stored in `prerender-data.json`
- Client-side hydration after initial static HTML load

---

## 11. Accessibility

- **Screen reader announcements** — `aria-live="polite"` regions for result counts
- **ARIA labels** — on all interactive elements (buttons, links, filters)
- **Focus management** — visible focus rings, focus-within styling
- **Keyboard navigation** — tab-navigable filter chips, cards, and dropdowns
- **Alt text generation** — `generateBeachImageAltText()` for beach photos
- **Skip content** — scroll-to-top on route changes
- **Reduced motion** — `motion-reduce:animate-none` on consent banner

---

## 12. External Services

| Service | Purpose | Integration |
|---|---|---|
| **Supabase** | Database, Auth, RLS | `@supabase/supabase-js` client at `xnkyfxvncpawqpqccdby.supabase.co` |
| **Google Analytics 4** | Analytics | `gtag.js`, Measurement ID: `G-ZF2R3QMRQ2` |
| **Umami** | Privacy analytics | `cloud.umami.is/script.js`, Website ID: `b3e6e36a-...` |
| **ArcGIS** | Satellite map tiles | `server.arcgisonline.com` (World Imagery + Boundaries) |
| **Google Fonts** | Typography | Inter (body), Raleway (headings) |

---

## 13. Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SITE_URL` | Canonical site URL (`https://beachesofgreece.com`) |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |

---

## 14. Build & Development

### 14.1 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Full production build: lint → format check → generate routes → validate schemas → vite build |
| `npm run build:dev` | Dev build with source maps |
| `npm run build:analyze` | Bundle analysis |
| `npm run preview` | Preview production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Single test run |
| `npm run test:coverage` | Coverage report (80% lines/functions/statements, 75% branches) |
| `npm run generate-routes` | Generate prerender routes from Supabase |
| `npm run generate-sitemap` | Generate XML sitemap |
| `npm run validate:schemas` | Validate Zod schemas |

### 14.2 Database Migrations

24+ migrations in `supabase/migrations/` covering:
- Beach parking value normalization
- Source and photo_source columns
- Profile RLS policies
- Admin management functions
- Areas table creation and population
- `beaches_with_areas` secure view
- Admin invite system
- Admin roles and audit logging

---

## 15. Data Flow Diagrams

### 15.1 Beach Discovery Flow

```
User visits / or /:areaSlug
  → useUrlState() parses URL search params into FilterState
  → useQuery("beaches") fetches all active beaches from Supabase
  → useDistanceCalculation() adds distance if geolocation enabled
  → useBeachFiltering() applies all filters + sorting
  → Paginate (9 per page)
  → Render BeachCard grid
  → useImagePreloader() preloads visible card images
```

### 15.2 NLP Search Flow

```
User types in EnhancedSearchBar
  → useDebouncedSearch() debounces input
  → EnhancedNaturalLanguageSearch.extract(query)
    → SmartEntityRecognizer: extract beach types, wave conditions, amenities
    → LocationMatcher: match against known Greek places (fuzzy)
    → SentimentAnalyzer: detect intent
    → Return { filters, place, cleanedSearchTerm, confidence }
  → updateFilters() writes extracted filters to URL params
  → useBeachFiltering() applies filters
  → analytics.trackSearch(queryHash)
```

### 15.3 Admin CRUD Flow

```
Admin navigates to /admin/beaches/new
  → ProtectedRoute checks auth + admin role
  → BeachForm with React Hook Form + Zod validation
  → On submit: authSupabase.from("beaches").insert(data)
  → Redirect to beach list
  → React Query cache invalidated
```

### 15.4 Analytics Consent Flow

```
First visit → consent = "unknown"
  → ConsentBanner shown
  → Events queued (not sent)

User clicks "Allow"
  → analytics.setConsent("accepted")
  → gtag("consent", "update", {granted})
  → Load GA4 + Umami scripts
  → Track initial pageview
  → Flush all queued events
  → Banner dismissed, choice persisted to localStorage

Subsequent visits
  → Consent loaded from localStorage
  → Scripts loaded immediately if accepted
```
