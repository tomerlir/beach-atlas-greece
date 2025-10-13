import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    analytics.event('404', { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/80 transition-colors">
            Return to Home
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
