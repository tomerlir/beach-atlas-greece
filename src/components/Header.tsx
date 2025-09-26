import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { CONTACT_EMAIL } from "@/lib/constants";

const Header = () => {
  return (
    <header className="bg-white-marble border-b border-border shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="Greek Beaches" className="h-10 w-8" />
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-6 min-w-[140px] justify-end">
            <Link 
              to="/areas" 
              className="text-foreground hover:text-primary transition-colors font-medium inline-block"
            >
              Areas
            </Link>
            <Link 
              to="/about" 
              className="text-foreground hover:text-primary transition-colors font-medium inline-block"
            >
              About
            </Link>
            <a 
              href={`mailto:${CONTACT_EMAIL}`} 
              className="text-foreground hover:text-primary transition-colors font-medium inline-block"
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