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
  route?: string;
  area?: string;
  utm?: Record<string, string>;
  session_id?: string;
}

interface QueuedEvent {
  name: string;
  props?: AnalyticsProps;
  timestamp: number;
}

interface CBMDedupeEntry {
  beach_id: string;
  method: 'directions' | 'share';
  timestamp: number;
}

class AnalyticsSDK {
  private enabled = false;
  private debug = false;
  private consent: ConsentState = 'unknown';
  private context: AnalyticsContext = {};
  private eventQueue: QueuedEvent[] = [];
  private cbmDedupe: CBMDedupeEntry[] = [];
  private consentCallbacks: ((state: ConsentState) => void)[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.context.session_id = this.sessionId;
    
    if (isBrowser) {
      this.loadConsentState();
      this.captureUTMParams();
      this.setupOnlineHandler();
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

  trackPageview(path?: string, referrer?: string) {
    const currentPath = path || (isBrowser ? window.location.pathname : '');
    const currentReferrer = referrer || (isBrowser ? document.referrer : undefined);
    
    this.event('page_view', {
      path: currentPath,
      referrer: currentReferrer,
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

  cbm(beachId: string, method: 'directions' | 'share') {
    // Check for deduplication (12 hours TTL)
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;
    
    const existingEntry = this.cbmDedupe.find(
      entry => 
        entry.beach_id === beachId && 
        entry.method === method && 
        (now - entry.timestamp) < twelveHours
    );
    
    if (existingEntry) {
      if (this.debug) {
        console.log(`🚫 CBM deduplicated: ${beachId} (${method})`);
      }
      return;
    }
    
    // Add to dedupe cache
    this.cbmDedupe.push({
      beach_id: beachId,
      method,
      timestamp: now,
    });
    
    // Clean old entries
    this.cbmDedupe = this.cbmDedupe.filter(
      entry => (now - entry.timestamp) < twelveHours
    );
    
    this.event('cbm', {
      beach_id: beachId,
      method,
    });
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

  private enrichProps(props?: AnalyticsProps): AnalyticsProps {
    return {
      ...props,
      ...this.context,
      timestamp: Date.now(),
    };
  }

  private sendToUmami(name: string, props: AnalyticsProps) {
    if (!isBrowser) return;
    
    const umami = (window as any).umami;
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
  trackPageview: (path?: string, referrer?: string) => analyticsSDK.trackPageview(path, referrer),
  event: (name: string, props?: AnalyticsProps) => analyticsSDK.event(name, props),
  cbm: (beachId: string, method: 'directions' | 'share') => analyticsSDK.cbm(beachId, method),
};


