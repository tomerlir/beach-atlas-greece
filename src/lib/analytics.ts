// Centralized analytics helpers for Umami

type AnalyticsEventProps = Record<string, unknown> | undefined;

const isBrowser = typeof window !== 'undefined';

function getUmami(): any | null {
  if (!isBrowser) return null;
  // @ts-ignore - umami is injected by script tag
  return (window as any).umami || null;
}

export function trackEvent(name: string, props?: AnalyticsEventProps) {
  if (!isBrowser) return;
  const umami = getUmami();
  try {
    umami?.track?.(name, props);
  } catch (_) {
    // no-op
  }
}

// Domain-specific convenience wrappers
export const analytics = {
  event: trackEvent,
};


