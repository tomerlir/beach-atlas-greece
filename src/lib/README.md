# Analytics System

This directory contains the **lean, high-value** analytics implementation for Beach Atlas Greece, built on top of Umami and consent-gated Google Analytics 4 with privacy-first principles.

## Files

- `analytics.ts` - Main analytics SDK with consent gating, event queuing, and session tracking
- `analyticsEvents.ts` - TypeScript types and helper functions for all analytics events
- `AnalyticsInspector.tsx` - Development-only component for inspecting analytics events in real-time

## Philosophy: Lean & High-Value

We track **fewer events, but make each one count**. Every event answers a clear business question about user behavior and product performance.

### Key Features

#### Privacy & Consent

- Explicit consent gating (no tracking until user accepts)
- No PII collection
- Consent-gated tracking via Umami (cookieless) and Google Analytics 4 (cookies only after opt-in, ad_storage denied)
- Persistent consent choice in localStorage
- Admin routes automatically excluded from tracking

#### Session Intelligence

- Automatic session quality calculation (high/medium/low)
- Beach engagement deduplication (one event per beach per session)
- Search quality tracking with abandonment detection
- Conversion tracking for valuable user actions
- 30-minute inactivity session summaries

#### Developer Experience

- Type-safe event schemas
- Real-time event inspector (dev mode only)
- Console debugging with grouped logs
- Single import surface (`analytics`)
- No complex deduplication logic

## Core Event Taxonomy

### 7 Core Events

| Event              | Description                  | Key Props                                                           | Business Question                                  |
| ------------------ | ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `page_view`        | SPA route changes            | `page_path`, `referrer`, `previous_path`                            | Where do users go?                                 |
| `search_submit`    | Search queries               | `q`, `extracted`, `context`                                         | What are users looking for?                        |
| `results_view`     | Search results displayed     | `count`, `relaxed`, `query_hash`                                    | How many results do searches return?               |
| `search_quality`   | Search outcome               | `query_hash`, `outcome`, `time_to_engagement_ms`                    | Do searches work for users?                        |
| `beach_engagement` | First interaction with beach | `beach_id`, `source`, `query_hash`                                  | Which beaches interest users and from what source? |
| `beach_conversion` | Valuable user action         | `beach_id`, `action`, `source`                                      | Do users take action?                              |
| `session_summary`  | Session-level metrics        | `searches_count`, `beaches_engaged`, `conversions_count`, `outcome` | What's the overall user experience quality?        |

### Supporting Events

| Event            | Description                                       | Key Props                                                                             |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `filter_apply`   | Filter applied                                    | `name`, `value`, `results`                                                            |
| `filter_clear`   | Filter cleared                                    | `name`                                                                                |
| `map_open`       | Map page entered                                  | `entry`                                                                               |
| `map_engagement` | Map usage session (emitted every 30s or on close) | `duration_ms`, `total_interactions`, `unique_beaches_viewed`, `exploration_intensity` |
| `404`            | Page not found                                    | `path`                                                                                |

## Session Management

### Session Quality

Session quality is calculated and included in the `session_summary` event only (not in individual beach_engagement events):

- **High**: User completed at least one conversion (directions/share)
- **Medium**: User engaged with 3+ beaches but no conversions
- **Low**: Limited engagement, no conversions

### Session Outcomes

- **Converted**: At least one conversion action
- **Browsed**: Engaged with 3+ beaches but no conversions
- **Bounced**: Low engagement

### Session Lifecycle

- Starts on first page load
- Resets after 30 minutes of inactivity
- Emits `session_summary` on timeout

## User Journey Tracking

### Complete Flow Example

```
1. page_view (/)
2. search_submit (q: "sandy beaches corfu")
3. results_view (count: 12, query_hash: "abc123")
4. [User clicks beach card and views detail page]
5. beach_engagement (beach_id: "xyz", source: "search", query_hash: "abc123")
6. search_quality (outcome: "success", time_to_engagement: 2500ms)
7. beach_conversion (beach_id: "xyz", action: "directions", source: "detail")
8. [30 min later] session_summary (searches: 1, engaged: 1, conversions: 1, outcome: "converted", session_quality: "high")
```

## Usage

```typescript
import { analytics } from "@/lib/analytics";

// Track beach engagement (auto-deduplicates per beach)
analytics.trackBeachEngagement("beach-123", "search", queryHash);

// Track conversions
analytics.event("beach_conversion", {
  beach_id: "beach-123",
  action: "directions",
  source: "detail",
});
analytics.trackConversion(); // Increments session counter

// Track search with automatic abandonment timer
const queryHash = analytics.generateQueryHash(query, filters);
analytics.trackSearch(queryHash);

// Track search quality
analytics.trackSearchQuality("success", {
  first_engagement_beach_id: "beach-123",
  time_to_engagement_ms: 2500,
});

// Set context
analytics.setContext({ area: "crete" });

// Track map engagement
analytics.startMapSession(); // Start tracking on map mount
analytics.trackMapInteraction(); // Track pan/zoom
analytics.trackMapBeachView("beach-123"); // Track beach popup opens
analytics.endMapSession(); // End tracking on unmount (auto-emits engagement event)
```

## Development

In development mode, the Analytics Inspector appears as a floating panel showing recent events. Enable debug mode to see console logs with grouped event data.

## Business Insights Available

- **Search success rate**: % of searches resulting in engagement
- **Engagement-to-conversion rate**: % of engaged users who convert
- **Session quality distribution**: Overall user satisfaction
- **Source effectiveness**: Which paths (search/map/browse) drive conversions
- **Time-to-engagement**: How quickly users find what they need
