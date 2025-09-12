import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'admin',
  fallback 
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
  if (!user || !profile) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/admin/login" replace />;
  }

  // Check role authorization
  if (requiredRole && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Access Restricted
            </h2>
            <p className="text-muted-foreground" aria-live="polite">
              You don't have permission to access this area. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;