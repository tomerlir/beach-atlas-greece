import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadCommonPlaceholders } from "./utils/imagePlaceholder";
import { analytics } from "./lib/analytics";
import type { DehydratedState } from "@tanstack/react-query";

declare global {
  interface Window {
    __REACT_QUERY_STATE__?: DehydratedState;
  }
}

const rootEl = document.getElementById("root")!;
const dehydratedState = window.__REACT_QUERY_STATE__;

// Hydrate when prerendered HTML is present (root has children); otherwise
// render fresh (dev mode or non-prerendered route fallback).
if (rootEl.firstElementChild) {
  hydrateRoot(rootEl, <App dehydratedState={dehydratedState} />);
} else {
  createRoot(rootEl).render(<App dehydratedState={dehydratedState} />);
}

// Defer analytics to avoid blocking main thread; runs after first paint.
const initAnalytics = () => {
  analytics.init({
    enabled: true,
    debug: !import.meta.env.PROD,
  });
  preloadCommonPlaceholders();
};

if ("requestIdleCallback" in window) {
  requestIdleCallback(initAnalytics);
} else {
  setTimeout(initAnalytics, 100);
}
