import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { CONTACT_EMAIL } from "@/lib/constants";

const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-md">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo and Left Navigation */}
          <div className="flex items-center gap-4 md:gap-16 lg:gap-24">
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
              <img src={logo} alt="Greek Beaches" className="h-12 w-10" />
            </Link>
            
            {/* Left Navigation - Centered on mobile, normal on desktop */}
            <nav className="flex items-center gap-3 md:gap-6 justify-center md:justify-start flex-1 md:flex-none">
              <Link 
                to="/areas" 
                className="text-muted-foreground hover:text-secondary transition-colors font-medium inline-block"
              >
                Explore areas
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
          </div>
          
          {/* Right Navigation - Feedback */}
          <nav className="flex items-center">
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