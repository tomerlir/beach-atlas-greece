import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "@/lib/constants";

const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-md">
      <div className="container mx-auto px-4 py-5">
        <div className="relative flex items-center justify-between md:justify-start">
          {/* Logo - Optimized with correct aspect ratio (112:126 = 0.889) */}
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity z-10">
            <picture>
              <source type="image/avif" srcSet="/logo-43w.avif 1x, /logo.avif 2x" />
              <source type="image/webp" srcSet="/logo-43w.webp 1x, /logo.webp 2x" />
              <img
                src="/logo.png"
                alt="Greek Beaches"
                width={43}
                height={48}
                className="h-12 w-[43px]"
                loading="eager"
              />
            </picture>
          </Link>

          {/* Navigation - Centered on mobile, normal position on desktop */}
          <nav className="absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0 md:ml-16 lg:ml-24 flex items-center gap-3 md:gap-6">
            <Link
              to="/areas"
              className="text-muted-foreground hover:text-secondary transition-colors font-medium inline-block"
            >
              <span className="inline md:hidden">Areas</span>
              <span className="hidden md:inline">Explore areas</span>
            </Link>
            <Link
              to="/map"
              className="text-muted-foreground hover:text-secondary transition-colors font-medium inline-block"
            >
              Map
            </Link>
            <Link
              to="/about"
              className="text-muted-foreground hover:text-secondary transition-colors font-medium inline-block"
            >
              About
            </Link>
          </nav>

          {/* Right Navigation - Feedback */}
          <nav className="flex items-center md:ml-auto z-10">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-muted-foreground hover:text-secondary transition-colors font-medium inline-block"
            >
              Feedback
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
