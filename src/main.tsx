import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadCommonPlaceholders } from "./utils/imagePlaceholder";
import { analytics } from "./lib/analytics";

// Initialize analytics
analytics.init({
  enabled: true,
  debug: !import.meta.env.PROD,
});

// Preload common placeholder sizes for better performance
preloadCommonPlaceholders();

createRoot(document.getElementById("root")!).render(<App />);
