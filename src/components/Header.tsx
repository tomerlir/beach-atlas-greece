import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Header = () => {
  return (
    <header className="bg-white-marble border-b border-border shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="Greek Beaches" className="h-10 w-10" />
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link 
              to="/about" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              About
            </Link>
            <a 
              href="mailto:info@greekbeaches.com" 
              className="text-foreground hover:text-primary transition-colors font-medium"
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