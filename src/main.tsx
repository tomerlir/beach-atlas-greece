import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadCommonPlaceholders } from "./utils/imagePlaceholder";
import { analytics } from "./lib/analytics";

// Defer analytics initialization to avoid blocking main thread
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    analytics.init({
      enabled: true,
      debug: !import.meta.env.PROD,
    });
  });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    analytics.init({
      enabled: true,
      debug: !import.meta.env.PROD,
    });
  }, 0);
}

// Preload common placeholder sizes for better performance
preloadCommonPlaceholders();

createRoot(document.getElementById("root")!).render(<App />);
