# Analytics System

This directory contains the analytics implementation for Beach Atlas Greece, built on top of Umami with privacy-first principles.

## Files

- `analytics.ts` - Main analytics SDK with consent gating, event queuing, and CBM deduplication
- `analyticsEvents.ts` - TypeScript types and helper functions for all analytics events
- `AnalyticsInspector.tsx` - Development-only component for inspecting analytics events in real-time

## Key Features

### Privacy & Consent
- Explicit consent gating (no tracking until user accepts)
- No PII collection
- Cookie-less tracking via Umami
- Persistent consent choice in localStorage

### Event Tracking
- **CBM (Completed Beach Matches)**: Primary NSM - tracks when users click "Get Directions" or "Share"
- **Search Events**: Full query text + extracted NLP filters
- **Map Interactions**: Pan, zoom, pin opens
- **Filter Usage**: Apply/clear events with result counts
- **Page Views**: SPA route tracking

### Developer Experience
- Type-safe event schemas
- Real-time event inspector (dev mode only)
- Console debugging with grouped logs
- Single import surface (`analytics`)

## Event Taxonomy

| Event | Description | Key Props |
|-------|-------------|-----------|
| `page_view` | SPA route changes | `path`, `referrer` |
| `search_submit` | Search queries | `q`, `extracted`, `context` |
| `results_view` | Search results displayed | `count`, `relaxed` |
| `filter_apply` | Filter applied | `name`, `value`, `results` |
| `filter_clear` | Filter cleared | `name` |
| `map_open` | Map page entered | `entry` |
| `map_interact` | Map pan/zoom | `action` |
| `map_pin_open` | Beach pin clicked | `beach_id` |
| `beach_view` | Beach detail viewed | `beach_id` |
| `start_directions` | Directions button clicked | `beach_id`, `from` |
| `share_beach` | Share button clicked | `beach_id`, `method` |
| `cbm` | **NSM** - Beach match completed | `beach_id`, `method` |
| `404` | Page not found | `path` |

## CBM Deduplication

CBM events are deduplicated per user×beach×method for 12 hours to prevent spam clicks while allowing users to both share and get directions to the same beach.

## Usage

```typescript
import { analytics } from '@/lib/analytics';

// Track custom events
analytics.event('custom_event', { prop1: 'value1' });

// Track CBM (automatically deduplicated)
analytics.cbm('beach-123', 'directions');

// Set context
analytics.setContext({ area: 'crete' });
```

## Development

In development mode, the Analytics Inspector appears as a floating panel showing recent events. Enable debug mode to see console logs with grouped event data.
