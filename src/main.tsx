import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadCommonPlaceholders } from "./utils/imagePlaceholder";
import { analytics } from "./lib/analytics";

// Render app IMMEDIATELY for fastest FCP
createRoot(document.getElementById("root")!).render(<App />);

// Defer analytics initialization to avoid blocking main thread
// Moved AFTER render to not delay FCP
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => {
    analytics.init({
      enabled: true,
      debug: !import.meta.env.PROD,
    });
    // Preload placeholders during idle time, not during critical path
    preloadCommonPlaceholders();
  });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    analytics.init({
      enabled: true,
      debug: !import.meta.env.PROD,
    });
    preloadCommonPlaceholders();
  }, 100); // Small delay to allow initial render
}
