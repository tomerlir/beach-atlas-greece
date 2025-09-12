import { Link } from "react-router-dom";
import { Waves } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white-marble border-b border-border shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Waves className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Greek Beaches</span>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Home
            </Link>
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