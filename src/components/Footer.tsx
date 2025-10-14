import { CONTACT_EMAIL } from "@/lib/constants";

const Footer = () => {
  return (
    <footer className="bg-muted py-8 mt-16">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a 
            href="/about" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            About
          </a>
          <a 
            href="/faq" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            FAQ
          </a>
          <a 
            href="/guide" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Guide
          </a>
          <a 
            href="/ontology" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Ontology
          </a>
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
