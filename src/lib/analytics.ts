// Centralized analytics helpers for Umami

type AnalyticsEventProps = Record<string, unknown> | undefined;

const isBrowser = typeof window !== 'undefined';

function getUmami(): any | null {
  if (!isBrowser) return null;
  // @ts-ignore - umami is injected by script tag
  return (window as any).umami || null;
}

export function trackPageView(pathWithQuery: string, title?: string) {
  if (!isBrowser) return;
  if (pathWithQuery.startsWith('/admin')) return; // avoid admin noise
  const umami = getUmami();
  try {
    // title is optional in our setup
    // @ts-ignore
    umami?.trackView?.(title, pathWithQuery) || umami?.trackView?.(pathWithQuery);
  } catch (_) {
    // no-op
  }
}

export function trackEvent(name: string, props?: AnalyticsEventProps) {
  if (!isBrowser) return;
  if (location.pathname.startsWith('/admin')) return; // avoid admin noise
  const umami = getUmami();
  try {
    umami?.track?.(name, props);
  } catch (_) {
    // no-op
  }
}

// Domain-specific convenience wrappers
export const analytics = {
  pageview: trackPageView,
  event: trackEvent,
};


