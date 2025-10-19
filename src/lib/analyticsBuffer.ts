interface AnalyticsEvent {
  name: string;
  props: Record<string, unknown>;
  timestamp: number;
  id: string;
}

// Global event buffer (shared across inspector instances)
const eventBuffer: AnalyticsEvent[] = [];
const maxEvents = 50;

// Function to add events to the buffer (called by analytics SDK)
export const addAnalyticsEvent = (name: string, props: Record<string, unknown>) => {
  const event: AnalyticsEvent = {
    name,
    props,
    timestamp: Date.now(),
    id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  };

  eventBuffer.unshift(event);

  // Keep only the most recent events
  if (eventBuffer.length > maxEvents) {
    eventBuffer.splice(maxEvents);
  }
};

// Function to get all events (for the inspector)
export const getAnalyticsEvents = (): AnalyticsEvent[] => {
  return [...eventBuffer];
};

// Function to clear all events
export const clearAnalyticsEvents = (): void => {
  eventBuffer.length = 0;
};

export type { AnalyticsEvent };
