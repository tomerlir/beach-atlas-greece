/**
 * TypeScript type definitions for Google Analytics gtag.js
 * Ensures type-safe interactions with the Google Analytics API
 */

/**
 * Consent parameters for Google Analytics Consent Mode v2
 * Used to control data collection based on user consent preferences
 */
export type ConsentParams = {
  /** Controls storage of advertising data */
  ad_storage?: "granted" | "denied";
  /** Controls collection of user data for advertising purposes */
  ad_user_data?: "granted" | "denied";
  /** Controls personalized advertising */
  ad_personalization?: "granted" | "denied";
  /** Controls storage of analytics data */
  analytics_storage?: "granted" | "denied";
  /** Controls storage for site functionality */
  functionality_storage?: "granted" | "denied";
  /** Controls storage for personalization features */
  personalization_storage?: "granted" | "denied";
  /** Controls storage for security purposes (usually granted) */
  security_storage?: "granted" | "denied";
  /** Milliseconds to wait for consent update before loading */
  wait_for_update?: number;
  /** Pass ad click info through URLs when consent denied */
  url_passthrough?: boolean;
  /** Redact ads data when consent denied */
  ads_data_redaction?: boolean;
};

/**
 * Configuration parameters for gtag config command
 */
export type GtagConfigParams = {
  /** Whether to send pageview automatically */
  send_page_view?: boolean;
  /** Anonymize IP addresses */
  anonymize_ip?: boolean;
  /** Cookie flags for security */
  cookie_flags?: string;
  /** Allow Google signals (cross-device tracking) */
  allow_google_signals?: boolean;
  /** Allow ad personalization signals */
  allow_ad_personalization_signals?: boolean;
  /** Custom page path */
  page_path?: string;
  /** Custom page title */
  page_title?: string;
  /** Custom page location */
  page_location?: string;
  /** Custom referrer */
  page_referrer?: string;
  /** Additional custom parameters */
  [key: string]: unknown;
};

/**
 * Global window interface extensions for Google Analytics
 */
declare global {
  interface Window {
    /** Google Analytics data layer array */
    dataLayer: unknown[];

    /**
     * Google Analytics gtag function
     *
     * @param command - The gtag command to execute
     * @param targetOrAction - The target measurement ID or action
     * @param params - Optional parameters for the command
     */
    gtag: {
      (command: "config", targetId: string, params?: GtagConfigParams): void;
      (command: "event", eventName: string, params?: Record<string, unknown>): void;
      (command: "js", date: Date): void;
      (command: "consent", action: "default" | "update", params: ConsentParams): void;
      (command: "set", params: Record<string, unknown>): void;
      (
        command: "get",
        targetId: string,
        fieldName: string,
        callback?: (value: unknown) => void
      ): void;
    };
  }
}

export {};
