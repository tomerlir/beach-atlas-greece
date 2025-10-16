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

import type { AnalyticsProps } from './analyticsEvents';
import { addAnalyticsEvent } from './AnalyticsInspector';

const isBrowser = typeof window !== 'undefined';

export type ConsentState = 'accepted' | 'rejected' | 'unknown';

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
  private consent: ConsentState = 'unknown';
  private context: AnalyticsContext = {};
  private eventQueue: QueuedEvent[] = [];
  private consentCallbacks: ((state: ConsentState) => void)[] = [];
  private sessionId: string;
  private sessionState: SessionState;
  private inactivityCheckInterval: NodeJS.Timeout | null = null;
  private umamiReadyInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.context.session_id = this.sessionId;
    
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
      this.setupUmamiReadyWatcher();
      this.setupPageLifecycleHandlers();
    }
  }

  init(opts: { enabled?: boolean; debug?: boolean } = {}) {
    this.enabled = opts.enabled ?? true;
    this.debug = opts.debug ?? false;
    
    if (this.debug) {
      console.group('🔍 Analytics SDK Initialized');
      console.log('Enabled:', this.enabled);
      console.log('Consent:', this.consent);
      console.log('Context:', this.context);
      console.groupEnd();
    }
    
    // Track initial page load if in browser
    if (isBrowser) {
      this.trackInitialPageLoad();
    }
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
      localStorage.setItem('analytics_consent', state);
    }
    
    // Notify callbacks
    this.consentCallbacks.forEach(cb => cb(state));
    
    // If consent was just accepted, flush the queue
    if (previousState !== 'accepted' && state === 'accepted') {
      this.flushEventQueue();
    }
    
    if (this.debug) {
      console.log('🔒 Analytics consent changed:', state);
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
      console.log('📊 Analytics context updated:', this.context);
    }
  }


  trackPageview(pagePath?: string, referrer?: string) {
    const currentPagePath = pagePath || this.context.page_path || (isBrowser ? window.location.pathname : '/');
    const currentReferrer = referrer || (isBrowser ? document.referrer : undefined);
    const previousPath = this.context.previous_path;
    
    // Update context with current page path
    this.setContext({ 
      page_path: currentPagePath,
      previous_path: this.context.page_path 
    });
    
    this.event('page_view', {
      page_path: currentPagePath,
      referrer: currentReferrer,
      previous_path: previousPath,
    });
  }

  event(name: string, props?: AnalyticsProps) {
    if (!this.enabled || this.consent !== 'accepted') {
      if (this.consent === 'unknown') {
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
      console.group(`📈 Analytics Event: ${name}`);
      console.log('Props:', enrichedProps);
      console.log('Context:', this.context);
      console.groupEnd();
    }

    // Add to inspector buffer for development
    addAnalyticsEvent(name, enrichedProps);

    this.sendToUmami(name, enrichedProps);
  }

  // Generate a simple hash for query tracking
  generateQueryHash(query: string, filters: Record<string, unknown> = {}): string {
    const data = JSON.stringify({ query, filters, ts: Date.now() });
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Calculate session quality based on current state
  calculateSessionQuality(): 'high' | 'medium' | 'low' {
    if (this.sessionState.conversionsCount > 0) return 'high';
    if (this.sessionState.engagedBeaches.size > 2) return 'medium';
    return 'low';
  }

  // Track beach engagement with deduplication
  trackBeachEngagement(
    beachId: string, 
    source: 'search' | 'map' | 'browsing' | 'area_explore',
    queryHash?: string
  ) {
    // Only track first engagement with each beach
    if (this.sessionState.engagedBeaches.has(beachId)) {
      if (this.debug) {
        console.log(`🚫 Beach engagement deduplicated: ${beachId}`);
      }
      return;
    }

    // Mark beach as engaged
    this.sessionState.engagedBeaches.add(beachId);

    // If this is from a search, track search quality as success
    if (queryHash && this.sessionState.currentSearch?.query_hash === queryHash) {
      const timeToEngagement = Date.now() - this.sessionState.currentSearch.timestamp;
      this.trackSearchQuality('success', {
        first_engagement_beach_id: beachId,
        time_to_engagement_ms: timeToEngagement,
      });
    }

    // Emit beach engagement event (session_quality removed - it's a session-level metric in session_summary)
    const eventProps: any = {
      beach_id: beachId,
      source,
    };
    
    // Only include query_hash if it exists (i.e., if this is from a search)
    if (queryHash) {
      eventProps.query_hash = queryHash;
    }
    
    this.event('beach_engagement', eventProps);
  }

  // Track search quality outcomes
  trackSearchQuality(
    outcome: 'success' | 'empty' | 'relaxed' | 'abandoned',
    data?: { first_engagement_beach_id?: string; time_to_engagement_ms?: number }
  ) {
    if (!this.sessionState.currentSearch) return;

    // Clear the search timer if it exists
    if (this.sessionState.searchTimer) {
      clearTimeout(this.sessionState.searchTimer);
      this.sessionState.searchTimer = null;
    }

    // Emit search quality event
    this.event('search_quality', {
      query_hash: this.sessionState.currentSearch.query_hash,
      outcome,
      first_engagement_beach_id: data?.first_engagement_beach_id,
      time_to_engagement_ms: data?.time_to_engagement_ms,
    });

    // Clear current search
    try {
      if (isBrowser) {
        sessionStorage.removeItem('current_query_hash');
      }
    } catch {}
    this.sessionState.currentSearch = null;
  }

  // Track search submission
  trackSearch(queryHash: string) {
    // If there's a previous search that wasn't engaged, mark as abandoned
    if (this.sessionState.currentSearch) {
      this.trackSearchQuality('abandoned');
    }

    // Set new current search
    this.sessionState.currentSearch = {
      query_hash: queryHash,
      timestamp: Date.now(),
    };
    this.sessionState.searchesCount++;

    // Set 60-second timer for abandonment
    this.sessionState.searchTimer = setTimeout(() => {
      this.trackSearchQuality('abandoned');
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
      console.log('🗺️ Map session started');
    }
  }

  // Track a map interaction (pan/zoom)
  trackMapInteraction() {
    if (!this.sessionState.mapSession) return;
    
    this.sessionState.mapSession.interactions++;
    
    if (this.debug) {
      console.log(`🗺️ Map interaction tracked (total: ${this.sessionState.mapSession.interactions})`);
    }
  }

  // Track when a beach is viewed on the map (popup opened)
  trackMapBeachView(beachId: string) {
    if (!this.sessionState.mapSession) return;
    
    this.sessionState.mapSession.viewedBeaches.add(beachId);
    
    if (this.debug) {
      console.log(`🗺️ Beach viewed on map: ${beachId} (unique: ${this.sessionState.mapSession.viewedBeaches.size})`);
    }
  }

  // Calculate exploration intensity based on interactions and beaches viewed
  private calculateExplorationIntensity(): 'low' | 'medium' | 'high' {
    if (!this.sessionState.mapSession) return 'low';

    const { interactions, viewedBeaches } = this.sessionState.mapSession;
    const uniqueBeaches = viewedBeaches.size;

    // High: 10+ interactions and 5+ beaches OR 20+ interactions
    if ((interactions >= 10 && uniqueBeaches >= 5) || interactions >= 20) {
      return 'high';
    }

    // Medium: 5+ interactions and 2+ beaches OR 10+ interactions
    if ((interactions >= 5 && uniqueBeaches >= 2) || interactions >= 10) {
      return 'medium';
    }

    return 'low';
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
      this.event('map_engagement', {
        duration_ms: duration,
        total_interactions: interactions,
        unique_beaches_viewed: uniqueBeaches,
        exploration_intensity: intensity,
      });

      if (this.debug) {
        console.log('🗺️ Map engagement emitted', {
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
      console.log('🗺️ Map session ended');
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadConsentState() {
    if (!isBrowser) return;
    
    const stored = localStorage.getItem('analytics_consent');
    if (stored && ['accepted', 'rejected'].includes(stored)) {
      this.consent = stored as ConsentState;
    }
  }

  private captureUTMParams() {
    if (!isBrowser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};
    
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    utmKeys.forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        utmParams[key] = value;
      }
    });
    
    // Also capture partner parameter
    const partner = urlParams.get('partner');
    if (partner) {
      utmParams.partner = partner;
    }
    
    if (Object.keys(utmParams).length > 0) {
      this.context.utm = utmParams;
      
      // Store in sessionStorage for persistence
      sessionStorage.setItem('analytics_utm', JSON.stringify(utmParams));
    } else {
      // Try to load from sessionStorage
      const stored = sessionStorage.getItem('analytics_utm');
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
    
    window.addEventListener('online', () => {
      if (this.debug) {
        console.log('🌐 Network online - retrying queued events');
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

  private setupUmamiReadyWatcher() {
    if (!isBrowser) return;
    // Only relevant for production where we actually send events
    if (typeof import.meta !== 'undefined' && !import.meta.env.PROD) return;

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
          console.log('✅ Umami ready - flushing queued events');
        }
        this.flushEventQueue();
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
      } catch {}
      try {
        // Emit a final session summary on page hide
        this.emitSessionSummary();
      } catch {}
      try {
        if (this.inactivityCheckInterval) {
          clearInterval(this.inactivityCheckInterval);
          this.inactivityCheckInterval = null;
        }
      } catch {}
    };

    // pagehide is the most reliable signal for SPA tab close/navigation
    window.addEventListener('pagehide', handleFinalize);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleFinalize();
      }
    });
  }

  private emitSessionSummary() {
    const sessionDuration = Date.now() - this.sessionState.startTime;
    
    // Calculate outcome
    let outcome: 'converted' | 'browsed' | 'bounced';
    if (this.sessionState.conversionsCount > 0) {
      outcome = 'converted';
    } else if (this.sessionState.engagedBeaches.size > 2) {
      outcome = 'browsed';
    } else {
      outcome = 'bounced';
    }

    this.event('session_summary', {
      searches_count: this.sessionState.searchesCount,
      beaches_engaged: this.sessionState.engagedBeaches.size,
      conversions_count: this.sessionState.conversionsCount,
      session_duration_ms: sessionDuration,
      outcome,
    });

    if (this.debug) {
      console.log('📊 Session summary emitted', {
        searches: this.sessionState.searchesCount,
        engaged: this.sessionState.engagedBeaches.size,
        conversions: this.sessionState.conversionsCount,
        duration: Math.round(sessionDuration / 1000) + 's',
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

  private sendToUmami(name: string, props: AnalyticsProps) {
    if (!isBrowser) return;
    // In development, do not send to Umami and do not queue
    if (typeof import.meta !== 'undefined' && !import.meta.env.PROD) {
      return;
    }
    
    const umami = window.umami;
    if (!umami?.track) {
      // Umami not ready, queue the event
      this.eventQueue.push({
        name,
        props,
        timestamp: Date.now(),
      });
      return;
    }
    
    try {
      umami.track(name, props);
    } catch (error) {
      if (this.debug) {
        console.error('Analytics tracking error:', error);
      }
      // Queue for retry
      this.eventQueue.push({
        name,
        props,
        timestamp: Date.now(),
      });
    }
  }

  private flushEventQueue() {
    if (this.eventQueue.length === 0) return;
    
    if (this.debug) {
      console.log(`📤 Flushing ${this.eventQueue.length} queued events`);
    }
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    events.forEach(({ name, props }) => {
      this.sendToUmami(name, this.enrichProps(props));
    });
  }
}

// Create singleton instance
const analyticsSDK = new AnalyticsSDK();

// Export the public API
export const analytics = {
  init: (opts?: { enabled?: boolean; debug?: boolean }) => analyticsSDK.init(opts),
  setConsent: (state: ConsentState) => analyticsSDK.setConsent(state),
  getConsent: () => analyticsSDK.getConsent(),
  onConsentChange: (callback: (state: ConsentState) => void) => analyticsSDK.onConsentChange(callback),
  setContext: (ctx: Partial<AnalyticsContext>) => analyticsSDK.setContext(ctx),
  trackPageview: (pagePath?: string, referrer?: string) => analyticsSDK.trackPageview(pagePath, referrer),
  event: (name: string, props?: AnalyticsProps) => analyticsSDK.event(name, props),
  generateQueryHash: (query: string, filters?: Record<string, unknown>) => analyticsSDK.generateQueryHash(query, filters),
  trackBeachEngagement: (beachId: string, source: 'search' | 'map' | 'browsing' | 'area_explore', queryHash?: string) => 
    analyticsSDK.trackBeachEngagement(beachId, source, queryHash),
  trackSearch: (queryHash: string) => analyticsSDK.trackSearch(queryHash),
  trackSearchQuality: (outcome: 'success' | 'empty' | 'relaxed' | 'abandoned', data?: { first_engagement_beach_id?: string; time_to_engagement_ms?: number }) => 
    analyticsSDK.trackSearchQuality(outcome, data),
  trackConversion: () => analyticsSDK.trackConversion(),
  startMapSession: () => analyticsSDK.startMapSession(),
  trackMapInteraction: () => analyticsSDK.trackMapInteraction(),
  trackMapBeachView: (beachId: string) => analyticsSDK.trackMapBeachView(beachId),
  endMapSession: () => analyticsSDK.endMapSession(),
};


