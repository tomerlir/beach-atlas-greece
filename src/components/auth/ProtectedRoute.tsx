import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin";
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = "admin",
  fallback,
}) => {
  const { user, profile, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground" aria-live="polite">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated but profile not loaded yet (e.g., bootstrapping)
  if (user && !profile && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground" aria-live="polite">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // If user exists but no profile and not loading, redirect to login
  if (user && !profile && !loading) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
