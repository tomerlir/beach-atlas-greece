/**
 * Analytics SDK for Umami
 *
 * Provides a comprehensive analytics solution with:
 * - Consent gating
 * - Event queuing until Umami is ready
 * - SPA pageview tracking
 * - UTM/session context
 * - CBM deduplication (12h TTL)
 * - Offline resilience
 * - Developer-friendly debugging
 */

import type { AnalyticsProps, BeachEngagementEvent } from "./analyticsEvents";
import { addAnalyticsEvent } from "./analyticsBuffer";

const isBrowser = typeof window !== "undefined";
const GA_MEASUREMENT_ID =
  typeof import.meta !== "undefined"
    ? (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)
    : undefined;
const isProdEnvironment = typeof import.meta !== "undefined" ? import.meta.env.PROD : false;
const GA_CONSENT_DENIED_STATE = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
  wait_for_update: 500,
} as const;
const GA_CONSENT_GRANTED_STATE = {
  ad_storage: "denied",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
} as const;
const GA_QUEUE_LIMIT = 50;

type ConsentState = "accepted" | "rejected" | "unknown";

interface AnalyticsContext {
  page_path?: string;
  area?: string;
  utm?: Record<string, string>;
  session_id?: string;
  previous_path?: string;
}

interface QueuedEvent {
  name: string;
  props?: AnalyticsProps;
  timestamp: number;
}

interface MapSessionState {
  startTime: number;
  interactions: number;
  viewedBeaches: Set<string>;
  timer: NodeJS.Timeout | null;
}

interface SessionState {
  startTime: number;
  lastActivity: number;
  searchesCount: number;
  engagedBeaches: Set<string>;
  conversionsCount: number;
  currentSearch: { query_hash: string; timestamp: number } | null;
  searchTimer: NodeJS.Timeout | null;
  mapSession: MapSessionState | null;
}

class AnalyticsSDK {
  private enabled = false;
  private debug = false;
  private consent: ConsentState = "unknown";
  private context: AnalyticsContext = {};
  private eventQueue: QueuedEvent[] = [];
  private umamiEventQueue: QueuedEvent[] = [];
  private consentCallbacks: ((state: ConsentState) => void)[] = [];
  private sessionId: string;
  private sessionState: SessionState;
  private inactivityCheckInterval: NodeJS.Timeout | null = null;
  private umamiReadyInterval: NodeJS.Timeout | null = null;
  private umamiScriptLoaded = false;
  private gaScriptLoaded = false;
  private gtagInitialized = false;
  private gaEventQueue: QueuedEvent[] = [];
  private gaMeasurementId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.context.session_id = this.sessionId;
    this.gaMeasurementId = GA_MEASUREMENT_ID?.trim() || undefined;

    // Initialize session state
    this.sessionState = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      searchesCount: 0,
      engagedBeaches: new Set<string>(),
      conversionsCount: 0,
      currentSearch: null,
      searchTimer: null,
      mapSession: null,
    };

    if (isBrowser) {
      this.loadConsentState();
      this.captureUTMParams();
      this.setupOnlineHandler();
      this.setupInactivityCheck();
      this.setupPageLifecycleHandlers();

      // Only setup Umami watcher if consent is already accepted
      if (this.consent === "accepted") {
        this.loadUmamiScript();
        this.loadGAScript();
      }
    }
  }

  init(opts: { enabled?: boolean; debug?: boolean } = {}) {
    this.enabled = opts.enabled ?? true;
    this.debug = opts.debug ?? false;

    if (this.debug) {
      console.warn("🔍 Analytics SDK Initialized");
      console.warn("Enabled:", this.enabled);
      console.warn("Consent:", this.consent);
      console.warn("Context:", this.context);
      console.warn("GA Measurement ID:", this.gaMeasurementId ?? "not configured");
    }

    // Don't track initial page load here - let setConsent handle it
    // This prevents double tracking when consent is accepted
  }

  private trackInitialPageLoad() {
    // Set initial page path in context
    const initialPath = window.location.pathname;
    this.setContext({ page_path: initialPath });

    // Track the initial page view
    this.trackPageview(initialPath);
  }

  setConsent(state: ConsentState) {
    const previousState = this.consent;
    this.consent = state;

    if (isBrowser) {
      localStorage.setItem("analytics_consent", state);
    }

    // Notify callbacks
    this.consentCallbacks.forEach((cb) => cb(state));

    // If consent was just accepted, load Umami script and enable tracking
    if (previousState !== "accepted" && state === "accepted") {
      this.loadUmamiScript();
      this.loadGAScript();
      this.enableGATracking();
      // Track the initial pageview now that consent is given
      this.trackInitialPageLoad();
      this.flushEventQueue();
      this.flushUmamiEventQueue();
      this.flushGAPendingEvents();
    }

    // If consent was just revoked, disable Umami tracking and clean up
    if (previousState === "accepted" && state === "rejected") {
      this.disableUmamiTracking();
      this.cleanupUmamiScript();
      this.disableGATracking();
      this.cleanupGAScript();
    }

    if (this.debug) {
      console.warn("🔒 Analytics consent changed:", state);
    }
  }

  getConsent(): ConsentState {
    return this.consent;
  }

  onConsentChange(callback: (state: ConsentState) => void): () => void {
    this.consentCallbacks.push(callback);
    return () => {
      const index = this.consentCallbacks.indexOf(callback);
      if (index > -1) {
        this.consentCallbacks.splice(index, 1);
      }
    };
  }

  setContext(ctx: Partial<AnalyticsContext>) {
    this.context = { ...this.context, ...ctx };

    if (this.debug) {
      console.warn("📊 Analytics context updated:", this.context);
    }
  }

  trackPageview(pagePath?: string, referrer?: string) {
    const currentPagePath =
      pagePath || this.context.page_path || (isBrowser ? window.location.pathname : "/");
    const currentReferrer = referrer || (isBrowser ? document.referrer : undefined);
    const previousPath = this.context.previous_path;

    // Update context with current page path
    this.setContext({
      page_path: currentPagePath,
      previous_path: this.context.page_path,
    });

    this.event("page_view", {
      page_path: currentPagePath,
      referrer: currentReferrer,
      previous_path: previousPath,
    });
  }

  event(name: string, props?: AnalyticsProps) {
    if (!this.enabled || this.consent !== "accepted") {
      if (this.consent === "unknown") {
        // Queue events until consent is given
        this.eventQueue.push({
          name,
          props,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Update last activity time for session tracking
    this.updateActivity();

    const enrichedProps = this.enrichProps(props);

    if (this.debug) {
      console.warn(`📈 Analytics Event: ${name}`);
      console.warn("Props:", enrichedProps);
      console.warn("Context:", this.context);
    }

    // Add to inspector buffer for development
    addAnalyticsEvent(name, enrichedProps);

    this.dispatchEvent(name, enrichedProps);
  }

  // Generate a simple hash for query tracking
  generateQueryHash(query: string, filters: Record<string, unknown> = {}): string {
    const data = JSON.stringify({ query, filters, ts: Date.now() });
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Calculate session quality based on current state
  calculateSessionQuality(): "high" | "medium" | "low" {
    if (this.sessionState.conversionsCount > 0) return "high";
    if (this.sessionState.engagedBeaches.size > 2) return "medium";
    return "low";
  }

  // Track beach engagement with deduplication
  trackBeachEngagement(
    beachId: string,
    source: "search" | "map" | "browsing" | "area_explore",
    queryHash?: string
  ) {
    // Only track first engagement with each beach
    if (this.sessionState.engagedBeaches.has(beachId)) {
      if (this.debug) {
        console.warn(`🚫 Beach engagement deduplicated: ${beachId}`);
      }
      return;
    }

    // Mark beach as engaged
    this.sessionState.engagedBeaches.add(beachId);

    // If this is from a search, track search quality as success
    if (queryHash && this.sessionState.currentSearch?.query_hash === queryHash) {
      const timeToEngagement = Date.now() - this.sessionState.currentSearch.timestamp;
      this.trackSearchQuality("success", {
        first_engagement_beach_id: beachId,
        time_to_engagement_ms: timeToEngagement,
      });
    }

    // Emit beach engagement event (session_quality removed - it's a session-level metric in session_summary)
    const eventProps: BeachEngagementEvent = {
      beach_id: beachId,
      source,
    };

    // Only include query_hash if it exists (i.e., if this is from a search)
    if (queryHash) {
      eventProps.query_hash = queryHash;
    }

    this.event("beach_engagement", eventProps);
  }

  // Track search quality outcomes
  trackSearchQuality(
    outcome: "success" | "empty" | "relaxed" | "abandoned",
    data?: { first_engagement_beach_id?: string; time_to_engagement_ms?: number }
  ) {
    if (!this.sessionState.currentSearch) return;

    // Clear the search timer if it exists
    if (this.sessionState.searchTimer) {
      clearTimeout(this.sessionState.searchTimer);
      this.sessionState.searchTimer = null;
    }

    // Emit search quality event
    this.event("search_quality", {
      query_hash: this.sessionState.currentSearch.query_hash,
      outcome,
      first_engagement_beach_id: data?.first_engagement_beach_id,
      time_to_engagement_ms: data?.time_to_engagement_ms,
    });

    // Clear current search
    try {
      if (isBrowser) {
        sessionStorage.removeItem("current_query_hash");
      }
    } catch (error) {
      // SessionStorage may not be available in some contexts (private browsing, etc.)
      if (this.debug) {
        console.warn("Failed to clear session storage:", error);
      }
    }
    this.sessionState.currentSearch = null;
  }

  // Track search submission
  trackSearch(queryHash: string) {
    // If there's a previous search that wasn't engaged, mark as abandoned
    if (this.sessionState.currentSearch) {
      this.trackSearchQuality("abandoned");
    }

    // Set new current search
    this.sessionState.currentSearch = {
      query_hash: queryHash,
      timestamp: Date.now(),
    };
    this.sessionState.searchesCount++;

    // Set 60-second timer for abandonment
    this.sessionState.searchTimer = setTimeout(() => {
      this.trackSearchQuality("abandoned");
    }, 60000); // 60 seconds
  }

  // Track conversions
  trackConversion() {
    this.sessionState.conversionsCount++;
  }

  // Start a map session
  startMapSession() {
    // If there's an existing session, end it first
    if (this.sessionState.mapSession) {
      this.endMapSession();
    }

    this.sessionState.mapSession = {
      startTime: Date.now(),
      interactions: 0,
      viewedBeaches: new Set<string>(),
      timer: null,
    };

    // Set up periodic emission every 30 seconds
    this.sessionState.mapSession.timer = setInterval(() => {
      this.emitMapEngagement();
    }, 30000); // 30 seconds

    if (this.debug) {
      console.warn("🗺️ Map session started");
    }
  }

  // Track a map interaction (pan/zoom)
  trackMapInteraction() {
    if (!this.sessionState.mapSession) return;

    this.sessionState.mapSession.interactions++;

    if (this.debug) {
      console.warn(
        `🗺️ Map interaction tracked (total: ${this.sessionState.mapSession.interactions})`
      );
    }
  }

  // Track when a beach is viewed on the map (popup opened)
  trackMapBeachView(beachId: string) {
    if (!this.sessionState.mapSession) return;

    this.sessionState.mapSession.viewedBeaches.add(beachId);

    if (this.debug) {
      console.warn(
        `🗺️ Beach viewed on map: ${beachId} (unique: ${this.sessionState.mapSession.viewedBeaches.size})`
      );
    }
  }

  // Calculate exploration intensity based on interactions and beaches viewed
  private calculateExplorationIntensity(): "low" | "medium" | "high" {
    if (!this.sessionState.mapSession) return "low";

    const { interactions, viewedBeaches } = this.sessionState.mapSession;
    const uniqueBeaches = viewedBeaches.size;

    // High: 10+ interactions and 5+ beaches OR 20+ interactions
    if ((interactions >= 10 && uniqueBeaches >= 5) || interactions >= 20) {
      return "high";
    }

    // Medium: 5+ interactions and 2+ beaches OR 10+ interactions
    if ((interactions >= 5 && uniqueBeaches >= 2) || interactions >= 10) {
      return "medium";
    }

    return "low";
  }

  // Emit map engagement event
  private emitMapEngagement() {
    if (!this.sessionState.mapSession) return;

    const duration = Date.now() - this.sessionState.mapSession.startTime;
    const interactions = this.sessionState.mapSession.interactions;
    const uniqueBeaches = this.sessionState.mapSession.viewedBeaches.size;
    const intensity = this.calculateExplorationIntensity();

    // Only emit if there's been any activity
    if (interactions > 0 || uniqueBeaches > 0) {
      this.event("map_engagement", {
        duration_ms: duration,
        total_interactions: interactions,
        unique_beaches_viewed: uniqueBeaches,
        exploration_intensity: intensity,
      });

      if (this.debug) {
        console.warn("🗺️ Map engagement emitted", {
          duration_ms: duration,
          interactions,
          uniqueBeaches,
          intensity,
        });
      }
    }
  }

  // End the map session and emit final engagement event
  endMapSession() {
    if (!this.sessionState.mapSession) return;

    // Clear the periodic timer
    if (this.sessionState.mapSession.timer) {
      clearInterval(this.sessionState.mapSession.timer);
    }

    // Emit final engagement event
    this.emitMapEngagement();

    // Clear the map session
    this.sessionState.mapSession = null;

    if (this.debug) {
      console.warn("🗺️ Map session ended");
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadConsentState() {
    if (!isBrowser) return;

    const stored = localStorage.getItem("analytics_consent");
    if (stored && ["accepted", "rejected"].includes(stored)) {
      this.consent = stored as ConsentState;
    }
  }

  private captureUTMParams() {
    if (!isBrowser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};

    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
    utmKeys.forEach((key) => {
      const value = urlParams.get(key);
      if (value) {
        utmParams[key] = value;
      }
    });

    // Also capture partner parameter
    const partner = urlParams.get("partner");
    if (partner) {
      utmParams.partner = partner;
    }

    if (Object.keys(utmParams).length > 0) {
      this.context.utm = utmParams;

      // Store in sessionStorage for persistence
      sessionStorage.setItem("analytics_utm", JSON.stringify(utmParams));
    } else {
      // Try to load from sessionStorage
      const stored = sessionStorage.getItem("analytics_utm");
      if (stored) {
        try {
          this.context.utm = JSON.parse(stored);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  private setupOnlineHandler() {
    if (!isBrowser) return;

    window.addEventListener("online", () => {
      if (this.debug) {
        console.warn("🌐 Network online - retrying queued events");
      }
      this.flushEventQueue();
    });
  }

  private updateActivity() {
    this.sessionState.lastActivity = Date.now();
  }

  private setupInactivityCheck() {
    if (!isBrowser) return;

    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

    this.inactivityCheckInterval = setInterval(() => {
      const inactiveTime = Date.now() - this.sessionState.lastActivity;

      if (inactiveTime >= SESSION_TIMEOUT) {
        this.emitSessionSummary();

        // Reset session state after emitting summary
        this.sessionState = {
          startTime: Date.now(),
          lastActivity: Date.now(),
          searchesCount: 0,
          engagedBeaches: new Set<string>(),
          conversionsCount: 0,
          currentSearch: null,
          searchTimer: null,
          mapSession: null,
        };
      }
    }, CHECK_INTERVAL);
  }

  private loadUmamiScript() {
    if (!isBrowser || this.umamiScriptLoaded) return;

    this.umamiScriptLoaded = true;

    try {
      // Create and load the Umami script
      const script = document.createElement("script");
      script.src = "https://cloud.umami.is/script.js";
      script.setAttribute("data-website-id", "b3e6e36a-8334-4086-8a80-d3c894414392");
      script.setAttribute("data-domains", "beachesofgreece.com");
      script.setAttribute("data-auto-track", "false");
      script.defer = true;

      // Store script reference for cleanup
      (script as HTMLScriptElement & { __umami_script?: boolean }).__umami_script = true;

      script.onload = () => {
        if (this.debug) {
          console.warn("📊 Umami script loaded");
        }
        this.setupUmamiReadyWatcher();
        // Enable tracking if consent is still accepted
        if (this.consent === "accepted") {
          this.enableUmamiTracking();
        }
      };

      script.onerror = (error) => {
        if (this.debug) {
          console.error("❌ Failed to load Umami script:", error);
        }
        this.umamiScriptLoaded = false;
        // Reset consent to unknown on script load failure
        this.consent = "unknown";
        localStorage.removeItem("analytics_consent");
      };

      document.head.appendChild(script);
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error creating Umami script:", error);
      }
      this.umamiScriptLoaded = false;
    }
  }

  private disableUmamiTracking() {
    if (!isBrowser || !window.umami) return;

    // Use Umami's built-in disable method
    if (window.umami?.disable) {
      window.umami.disable();
      if (this.debug) {
        console.warn("🚫 Umami tracking disabled");
      }
    }
  }

  private enableUmamiTracking() {
    if (!isBrowser || !window.umami) return;

    try {
      // Use Umami's built-in enable method
      if (window.umami?.enable) {
        window.umami.enable();
        if (this.debug) {
          console.warn("✅ Umami tracking enabled");
        }
      }
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error enabling Umami tracking:", error);
      }
    }
  }

  private cleanupUmamiScript() {
    if (!isBrowser) return;

    try {
      // Remove Umami script from DOM
      const scripts = document.querySelectorAll('script[src*="cloud.umami.is"]');
      scripts.forEach((script) => {
        if ((script as HTMLScriptElement & { __umami_script?: boolean }).__umami_script) {
          script.remove();
        }
      });

      // Clear intervals
      if (this.umamiReadyInterval) {
        clearInterval(this.umamiReadyInterval);
        this.umamiReadyInterval = null;
      }

      // Reset script loaded flag
      this.umamiScriptLoaded = false;

      if (this.debug) {
        console.warn("🧹 Umami script cleaned up");
      }
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error cleaning up Umami script:", error);
      }
    }
  }

  private setupUmamiReadyWatcher() {
    if (!isBrowser) return;
    // Only relevant for production where we actually send events
    if (typeof import.meta !== "undefined" && !import.meta.env.PROD) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~10s at 250ms
    const CHECK_INTERVAL_MS = 250;

    const checkReady = () => {
      const umami = window.umami;
      attempts++;
      if (umami?.track) {
        if (this.umamiReadyInterval) clearInterval(this.umamiReadyInterval);
        this.umamiReadyInterval = null;
        if (this.debug) {
          console.warn("✅ Umami ready - flushing queued events");
        }
        this.flushEventQueue();
        this.flushUmamiEventQueue();
      } else if (attempts >= MAX_ATTEMPTS) {
        if (this.umamiReadyInterval) clearInterval(this.umamiReadyInterval);
        this.umamiReadyInterval = null;
      }
    };

    this.umamiReadyInterval = setInterval(checkReady, CHECK_INTERVAL_MS);
  }

  private setupPageLifecycleHandlers() {
    if (!isBrowser) return;

    const handleFinalize = () => {
      try {
        // End any ongoing map session and emit final engagement
        this.endMapSession();
      } catch (error) {
        // Map session cleanup failure should not prevent other cleanup
        if (this.debug) {
          console.warn("Failed to end map session during cleanup:", error);
        }
      }
      try {
        // Emit a final session summary on page hide
        this.emitSessionSummary();
      } catch (error) {
        // Session summary failure should not prevent other cleanup
        if (this.debug) {
          console.warn("Failed to emit session summary during cleanup:", error);
        }
      }
      try {
        if (this.inactivityCheckInterval) {
          clearInterval(this.inactivityCheckInterval);
          this.inactivityCheckInterval = null;
        }
      } catch (error) {
        // Interval cleanup failure should not prevent other cleanup
        if (this.debug) {
          console.warn("Failed to clear inactivity check interval:", error);
        }
      }
    };

    // pagehide is the most reliable signal for SPA tab close/navigation
    window.addEventListener("pagehide", handleFinalize);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleFinalize();
      }
    });
  }

  private emitSessionSummary() {
    const sessionDuration = Date.now() - this.sessionState.startTime;

    // Calculate outcome
    let outcome: "converted" | "browsed" | "bounced";
    if (this.sessionState.conversionsCount > 0) {
      outcome = "converted";
    } else if (this.sessionState.engagedBeaches.size > 2) {
      outcome = "browsed";
    } else {
      outcome = "bounced";
    }

    this.event("session_summary", {
      searches_count: this.sessionState.searchesCount,
      beaches_engaged: this.sessionState.engagedBeaches.size,
      conversions_count: this.sessionState.conversionsCount,
      session_duration_ms: sessionDuration,
      outcome,
    });

    if (this.debug) {
      console.warn("📊 Session summary emitted", {
        searches: this.sessionState.searchesCount,
        engaged: this.sessionState.engagedBeaches.size,
        conversions: this.sessionState.conversionsCount,
        duration: Math.round(sessionDuration / 1000) + "s",
        outcome,
      });
    }
  }

  private enrichProps(props?: AnalyticsProps): AnalyticsProps {
    return {
      ...props,
      ...this.context,
      timestamp: Date.now(),
    };
  }

  private dispatchEvent(name: string, props: AnalyticsProps) {
    this.sendToUmami(name, props);
    this.sendToGA(name, props);
  }

  private sendToUmami(name: string, props: AnalyticsProps) {
    if (!isBrowser) return;

    // Double-check consent before sending (defensive programming)
    if (this.consent !== "accepted") {
      if (this.debug) {
        console.warn("🚫 Analytics event blocked - consent not accepted:", name);
      }
      return;
    }

    const umami = window.umami;
    if (!umami?.track) {
      // Umami not ready, queue the event only if consent is still accepted
      if (this.consent === "accepted") {
        this.umamiEventQueue.push({
          name,
          props,
          timestamp: Date.now(),
        });
      }
      return;
    }

    try {
      // In development, log the event but don't send to Umami
      if (typeof import.meta !== "undefined" && !import.meta.env.PROD) {
        if (this.debug) {
          console.warn("🔍 [DEV] Would send to Umami:", name, props);
        }
        return;
      }

      // In production, send to Umami
      umami.track(name, props);
    } catch (error) {
      if (this.debug) {
        console.error("Analytics tracking error:", error);
      }
      // Queue for retry only if consent is still accepted
      if (this.consent === "accepted") {
        this.umamiEventQueue.push({
          name,
          props,
          timestamp: Date.now(),
        });
      }
    }
  }

  private sendToGA(name: string, props: AnalyticsProps, allowQueue = true) {
    if (!isBrowser || !this.gaMeasurementId) return;

    if (this.consent !== "accepted") {
      if (this.debug) {
        console.warn("🚫 GA event blocked - consent not accepted:", name);
      }
      return;
    }

    if (!isProdEnvironment) {
      if (this.debug) {
        console.warn("🔍 [DEV] Would send to GA:", name, props);
      }
      return;
    }

    if (!this.gtagInitialized || typeof window.gtag !== "function") {
      if (allowQueue) {
        this.gaEventQueue.push({
          name,
          props,
          timestamp: Date.now(),
        });
        if (this.gaEventQueue.length > GA_QUEUE_LIMIT) {
          this.gaEventQueue.shift();
        }
      }
      return;
    }

    try {
      if (name === "page_view") {
        window.gtag("event", "page_view", this.buildGaPageViewPayload(props));
        return;
      }

      window.gtag("event", name, this.normalizeGaPayload(props));
    } catch (error) {
      if (this.debug) {
        console.error("GA tracking error:", error);
      }
      if (allowQueue) {
        this.gaEventQueue.push({
          name,
          props,
          timestamp: Date.now(),
        });
        if (this.gaEventQueue.length > GA_QUEUE_LIMIT) {
          this.gaEventQueue.shift();
        }
      }
    }
  }

  private normalizeGaPayload(props: AnalyticsProps): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    Object.entries(props).forEach(([key, value]) => {
      const sanitized = this.sanitizeForGA(value);
      if (sanitized !== undefined) {
        normalized[key] = sanitized;
      }
    });

    return normalized;
  }

  private sanitizeForGA(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    const valueType = typeof value;

    if (valueType === "string" || valueType === "number" || valueType === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeForGA(item)).filter((item) => item !== undefined);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (valueType === "object") {
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
        const sanitizedNested = this.sanitizeForGA(nestedValue);
        if (sanitizedNested !== undefined) {
          result[key] = sanitizedNested;
        }
      });
      return result;
    }

    return undefined;
  }

  private buildGaPageViewPayload(props: AnalyticsProps): Record<string, unknown> {
    const pagePath =
      typeof props.page_path === "string"
        ? props.page_path
        : isBrowser
          ? window.location.pathname
          : "/";

    const payload: Record<string, unknown> = {
      page_path: pagePath,
    };

    if (isBrowser) {
      payload.page_title = document.title;
      payload.page_location = window.location.href;
      if (document.referrer) {
        payload.page_referrer = document.referrer;
      }
    }

    if (typeof props.previous_path === "string") {
      payload.previous_path = props.previous_path;
    }

    if (typeof props.referrer === "string") {
      payload.page_referrer = props.referrer;
    }

    return payload;
  }

  private ensureGtagBase(): boolean {
    if (!isBrowser || !this.gaMeasurementId) return false;

    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    if (!window.gtag) {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
      };
    }

    return true;
  }

  private loadGAScript() {
    if (!isBrowser || this.gaScriptLoaded || !this.gaMeasurementId) return;
    if (!isProdEnvironment) {
      if (this.debug) {
        console.warn("⚙️ Skipping GA script load in non-production environment");
      }
      return;
    }

    this.ensureGtagBase();

    try {
      // Set default consent state (with wait_for_update to give banner time to load)
      window.gtag?.("consent", "default", { ...GA_CONSENT_DENIED_STATE });

      // Since loadGAScript is only called after consent is accepted,
      // immediately update to granted state
      window.gtag?.("consent", "update", { ...GA_CONSENT_GRANTED_STATE });

      window.gtag?.("js", new Date());
      window.gtag?.("config", this.gaMeasurementId, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: "SameSite=None;Secure",
      });
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error configuring GA before script load:", error);
      }
    }

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaMeasurementId}`;
    script.async = true;
    script.setAttribute("data-ga-provider", "gtag");

    script.onload = () => {
      this.gaScriptLoaded = true;
      this.gtagInitialized = true;
      if (this.debug) {
        console.warn("📊 Google Analytics script loaded");
      }
      if (this.consent === "accepted") {
        this.enableGATracking();
        this.flushGAPendingEvents();
      }
    };

    script.onerror = (error) => {
      if (this.debug) {
        console.error("❌ Failed to load Google Analytics script:", error);
      }
      this.gaScriptLoaded = false;
      this.gtagInitialized = false;
    };

    document.head.appendChild(script);
  }

  private enableGATracking() {
    if (!isBrowser || !this.gaMeasurementId) return;

    this.ensureGtagBase();

    try {
      window.gtag?.("consent", "update", { ...GA_CONSENT_GRANTED_STATE });
      window.gtag?.("config", this.gaMeasurementId, {
        send_page_view: false,
        anonymize_ip: true,
      });
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error enabling Google Analytics tracking:", error);
      }
    }
  }

  private disableGATracking() {
    if (!isBrowser || !this.gaMeasurementId) return;

    try {
      window.gtag?.("consent", "update", { ...GA_CONSENT_DENIED_STATE });
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error disabling Google Analytics tracking:", error);
      }
    }
  }

  private cleanupGAScript() {
    if (!isBrowser) return;

    try {
      const scripts = document.querySelectorAll('script[data-ga-provider="gtag"]');
      scripts.forEach((script) => script.remove());
      this.gaScriptLoaded = false;
      this.gtagInitialized = false;
      this.gaEventQueue = [];
      if (window.dataLayer) {
        Reflect.deleteProperty(window, "dataLayer");
      }
      if (window.gtag) {
        Reflect.deleteProperty(window, "gtag");
      }
    } catch (error) {
      if (this.debug) {
        console.error("❌ Error cleaning up Google Analytics script:", error);
      }
    }
  }

  private flushGAPendingEvents() {
    if (this.gaEventQueue.length === 0) return;

    if (!this.gtagInitialized || typeof window.gtag !== "function") {
      return;
    }

    if (this.debug) {
      console.warn(`📤 Flushing ${this.gaEventQueue.length} queued GA events`);
    }

    const events = [...this.gaEventQueue];
    this.gaEventQueue = [];

    events.forEach(({ name, props }) => {
      const payload = (props as AnalyticsProps) ?? {};
      this.sendToGA(name, payload, false);
    });
  }

  private flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    if (this.debug) {
      console.warn(`📤 Flushing ${this.eventQueue.length} queued events`);
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    events.forEach(({ name, props }) => {
      const enrichedProps = this.enrichProps(props);
      this.dispatchEvent(name, enrichedProps);
    });
  }

  private flushUmamiEventQueue() {
    if (this.umamiEventQueue.length === 0) return;

    if (this.debug) {
      console.warn(`📤 Flushing ${this.umamiEventQueue.length} queued Umami events`);
    }

    const events = [...this.umamiEventQueue];
    this.umamiEventQueue = [];

    events.forEach(({ name, props }) => {
      const payload = (props as AnalyticsProps) ?? {};
      this.sendToUmami(name, payload);
    });
  }
}

// Create singleton instance
const analyticsSDK = new AnalyticsSDK();

// Export the public API
export const analytics = {
  init: (opts?: { enabled?: boolean; debug?: boolean }) => analyticsSDK.init(opts),
  setConsent: (state: "accepted" | "rejected" | "unknown") => analyticsSDK.setConsent(state),
  getConsent: () => analyticsSDK.getConsent(),
  onConsentChange: (callback: (state: "accepted" | "rejected" | "unknown") => void) =>
    analyticsSDK.onConsentChange(callback),
  setContext: (ctx: Partial<AnalyticsContext>) => analyticsSDK.setContext(ctx),
  trackPageview: (pagePath?: string, referrer?: string) =>
    analyticsSDK.trackPageview(pagePath, referrer),
  event: (name: string, props?: AnalyticsProps) => analyticsSDK.event(name, props),
  generateQueryHash: (query: string, filters?: Record<string, unknown>) =>
    analyticsSDK.generateQueryHash(query, filters),
  trackBeachEngagement: (
    beachId: string,
    source: "search" | "map" | "browsing" | "area_explore",
    queryHash?: string
  ) => analyticsSDK.trackBeachEngagement(beachId, source, queryHash),
  trackSearch: (queryHash: string) => analyticsSDK.trackSearch(queryHash),
  trackSearchQuality: (
    outcome: "success" | "empty" | "relaxed" | "abandoned",
    data?: { first_engagement_beach_id?: string; time_to_engagement_ms?: number }
  ) => analyticsSDK.trackSearchQuality(outcome, data),
  trackConversion: () => analyticsSDK.trackConversion(),
  startMapSession: () => analyticsSDK.startMapSession(),
  trackMapInteraction: () => analyticsSDK.trackMapInteraction(),
  trackMapBeachView: (beachId: string) => analyticsSDK.trackMapBeachView(beachId),
  endMapSession: () => analyticsSDK.endMapSession(),
};
