import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted py-8 mt-16">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:flex-wrap md:gap-x-6 md:gap-y-2 mb-4">
          <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
            FAQ
          </Link>
          <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors">
            Guide
          </Link>
          <Link
            to="/ontology"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Ontology
          </Link>
          <Link
            to="/privacy"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Privacy policy
          </Link>
          <button
            type="button"
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent("open-privacy-preferences"));
              } catch (error) {
                // Custom event dispatch may fail in some environments
                console.warn("Failed to dispatch privacy preferences event:", error);
              }
            }}
            className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            aria-label="Open privacy preferences"
          >
            Privacy preferences
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          © 2025 Beaches of Greece . Discover the beauty of Greece.
        </p>
        <p className="text-muted-foreground text-xs mt-2">
          Information is for guidance only, please verify locally.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
