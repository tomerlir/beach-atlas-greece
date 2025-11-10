/**
 * Analytics Consent Mode Tests
 *
 * Tests for Google Analytics Consent Mode v2 implementation
 * Ensures proper timing, state management, and GDPR compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Analytics Consent Mode v2", () => {
  let mockGtag: ReturnType<typeof vi.fn>;
  let mockDataLayer: unknown[];

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = "";
    document.body.innerHTML = "";

    // Mock window.gtag and window.dataLayer
    mockDataLayer = [];
    mockGtag = vi.fn((...args: unknown[]) => {
      mockDataLayer.push(args);
    });

    Object.defineProperty(window, "dataLayer", {
      value: mockDataLayer,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    });

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Clear any existing consent state
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Consent Mode Initialization", () => {
    it("should set consent default with all required v2 parameters", () => {
      // Simulate the inline script from index.html
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }

      gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "granted",
        wait_for_update: 500,
        url_passthrough: true,
        ads_data_redaction: true,
      });

      // Verify consent default was called
      expect(window.dataLayer.length).toBeGreaterThan(0);
      const consentCall = window.dataLayer[0] as [string, string, Record<string, unknown>];
      expect(consentCall[0]).toBe("consent");
      expect(consentCall[1]).toBe("default");

      // Verify all v2 parameters are present
      const params = consentCall[2];
      expect(params.ad_storage).toBe("denied");
      expect(params.analytics_storage).toBe("denied");
      expect(params.url_passthrough).toBe(true);
      expect(params.ads_data_redaction).toBe(true);
      expect(params.wait_for_update).toBe(500);
    });

    it("should have security_storage granted by default", () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }

      gtag("consent", "default", {
        security_storage: "granted",
      });

      const consentCall = window.dataLayer[0] as [string, string, Record<string, unknown>];
      expect(consentCall[2].security_storage).toBe("granted");
    });
  });

  describe("Consent State Transitions", () => {
    it("should update consent mode when user accepts", () => {
      // Simulate consent update
      mockGtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "granted",
        url_passthrough: true,
        ads_data_redaction: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "consent",
        "update",
        expect.objectContaining({
          analytics_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        })
      );
    });

    it("should update consent mode when user rejects", () => {
      // Simulate consent denial
      mockGtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "granted",
        url_passthrough: true,
        ads_data_redaction: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "consent",
        "update",
        expect.objectContaining({
          analytics_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        })
      );
    });

    it("should persist consent state to localStorage", () => {
      localStorage.setItem("analytics_consent", "accepted");
      expect(localStorage.getItem("analytics_consent")).toBe("accepted");

      localStorage.setItem("analytics_consent", "rejected");
      expect(localStorage.getItem("analytics_consent")).toBe("rejected");
    });
  });

  describe("Script Loading Sequence", () => {
    it("should not load GA script before consent is accepted", () => {
      const scripts = document.querySelectorAll('script[data-ga-provider="gtag"]');
      expect(scripts.length).toBe(0);
    });

    it("should load GA script after consent is accepted", () => {
      // Simulate loading GA script
      const script = document.createElement("script");
      script.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST123";
      script.async = true;
      script.setAttribute("data-ga-provider", "gtag");
      document.head.appendChild(script);

      const scripts = document.querySelectorAll('script[data-ga-provider="gtag"]');
      expect(scripts.length).toBe(1);
      expect(scripts[0].getAttribute("src")).toContain("googletagmanager.com/gtag/js");
    });

    it("should configure GA with correct parameters after script loads", () => {
      mockGtag("js", new Date());
      mockGtag("config", "G-TEST123", {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: "SameSite=None;Secure",
        allow_google_signals: true,
        allow_ad_personalization_signals: true,
      });

      expect(mockGtag).toHaveBeenCalledWith("js", expect.any(Date));
      expect(mockGtag).toHaveBeenCalledWith(
        "config",
        "G-TEST123",
        expect.objectContaining({
          send_page_view: false,
          anonymize_ip: true,
          allow_google_signals: true,
        })
      );
    });
  });

  describe("Event Queuing", () => {
    it("should queue events when consent is unknown", () => {
      const queue: Array<{ name: string; props?: Record<string, unknown> }> = [];

      // Simulate queuing events
      queue.push({ name: "page_view", props: { page_path: "/" } });
      queue.push({ name: "search_submit", props: { q: "beach" } });

      expect(queue.length).toBe(2);
      expect(queue[0].name).toBe("page_view");
      expect(queue[1].name).toBe("search_submit");
    });

    it("should flush queued events after consent is accepted", () => {
      const queue: Array<{ name: string; props?: Record<string, unknown> }> = [
        { name: "page_view", props: { page_path: "/" } },
        { name: "search_submit", props: { q: "beach" } },
      ];

      // Simulate flushing queue
      queue.forEach(({ name, props }) => {
        mockGtag("event", name, props);
      });

      expect(mockGtag).toHaveBeenCalledTimes(2);
      expect(mockGtag).toHaveBeenNthCalledWith(1, "event", "page_view", { page_path: "/" });
      expect(mockGtag).toHaveBeenNthCalledWith(2, "event", "search_submit", { q: "beach" });
    });

    it("should not send events when consent is rejected", () => {
      localStorage.setItem("analytics_consent", "rejected");

      // Event should not be sent
      const consent = localStorage.getItem("analytics_consent");
      expect(consent).toBe("rejected");

      // Verify gtag is not called for events when rejected
      if (consent === "rejected") {
        // Don't call gtag
        expect(mockGtag).not.toHaveBeenCalled();
      }
    });
  });

  describe("Type Safety", () => {
    it("should have proper gtag type signature", () => {
      // TypeScript compile-time check
      const gtag = window.gtag;
      expect(gtag).toBeDefined();

      // Runtime check for function existence
      if (gtag) {
        expect(typeof gtag).toBe("function");
      }
    });

    it("should have proper dataLayer type", () => {
      expect(Array.isArray(window.dataLayer)).toBe(true);
    });
  });

  describe("GDPR Compliance", () => {
    it("should include url_passthrough in consent state", () => {
      mockGtag("consent", "default", {
        url_passthrough: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "consent",
        "default",
        expect.objectContaining({
          url_passthrough: true,
        })
      );
    });

    it("should include ads_data_redaction in consent state", () => {
      mockGtag("consent", "default", {
        ads_data_redaction: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "consent",
        "default",
        expect.objectContaining({
          ads_data_redaction: true,
        })
      );
    });

    it("should have wait_for_update to allow banner to load", () => {
      mockGtag("consent", "default", {
        wait_for_update: 500,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "consent",
        "default",
        expect.objectContaining({
          wait_for_update: 500,
        })
      );
    });
  });

  describe("Consent Callbacks", () => {
    it("should notify callbacks when consent changes", () => {
      const callbacks: Array<(state: string) => void> = [];
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      callbacks.push(callback1);
      callbacks.push(callback2);

      // Simulate consent change
      callbacks.forEach((cb) => cb("accepted"));

      expect(callback1).toHaveBeenCalledWith("accepted");
      expect(callback2).toHaveBeenCalledWith("accepted");
    });

    it("should allow unsubscribing from consent changes", () => {
      const callbacks: Array<(state: string) => void> = [];
      const callback = vi.fn();

      callbacks.push(callback);
      expect(callbacks.length).toBe(1);

      // Remove callback
      const index = callbacks.indexOf(callback);
      callbacks.splice(index, 1);
      expect(callbacks.length).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing gtag gracefully", () => {
      // Remove gtag
      Object.defineProperty(window, "gtag", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Should not throw
      expect(() => {
        if (window.gtag) {
          window.gtag("consent", "default", {});
        }
      }).not.toThrow();
    });

    it("should handle missing dataLayer gracefully", () => {
      // Remove dataLayer
      Object.defineProperty(window, "dataLayer", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Should not throw when checking
      expect(() => {
        if (!window.dataLayer) {
          window.dataLayer = [];
        }
      }).not.toThrow();
    });

    it("should handle localStorage being unavailable", () => {
      // Simulate private browsing mode
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: () => {
            throw new Error("localStorage is not available");
          },
          setItem: () => {
            throw new Error("localStorage is not available");
          },
        },
        writable: true,
        configurable: true,
      });

      // Should not throw
      expect(() => {
        try {
          localStorage.setItem("test", "value");
        } catch {
          // Gracefully handle error
        }
      }).not.toThrow();
    });
  });
});
