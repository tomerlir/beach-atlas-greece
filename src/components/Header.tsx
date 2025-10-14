import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { CONTACT_EMAIL } from "@/lib/constants";

const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-md">
      <div className="container mx-auto px-4 py-5">
        <div className="relative flex items-center justify-between md:justify-start">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity z-10">
            <img src={logo} alt="Greek Beaches" className="h-12 w-10" />
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