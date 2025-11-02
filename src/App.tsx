import { Toaster } from "@/components/ui/toaster";
import { useState, Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import ScrollToTop from "@/components/ScrollToTop";
import AnalyticsRouter from "@/components/AnalyticsRouter";

// Lazy load non-critical components
const ConsentBanner = lazy(() => import("@/components/ConsentBanner"));
const AnalyticsInspector = lazy(() => import("@/lib/AnalyticsInspector"));
const AuthProvider = lazy(() =>
  import("@/contexts/AuthContext").then((m) => ({ default: m.AuthProvider }))
);
const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute"));

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Areas = lazy(() => import("./pages/Areas"));
const Ontology = lazy(() => import("./pages/Ontology"));
const Guide = lazy(() => import("./pages/Guide"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const BeachDetail = lazy(() => import("./pages/BeachDetail"));
const Area = lazy(() => import("./pages/Area"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MapPage = lazy(() => import("./pages/Map"));

// Lazy load admin components
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAreasList = lazy(() => import("./pages/admin/areas/AdminAreasList"));
const AdminAreaCreate = lazy(() => import("./pages/admin/areas/AdminAreaCreate"));
const AdminAreaEdit = lazy(() => import("./pages/admin/areas/AdminAreaEdit"));
const AdminBeachesList = lazy(() => import("./pages/admin/beaches/AdminBeachesList"));
const AdminBeachCreate = lazy(() => import("./pages/admin/beaches/AdminBeachCreate"));
const AdminBeachEdit = lazy(() => import("./pages/admin/beaches/AdminBeachEdit"));
const ImportExport = lazy(() => import("./pages/admin/ImportExport"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AcceptInvite = lazy(() => import("./pages/admin/AcceptInvite"));

// Admin route wrapper components - Wrapped in Suspense since AuthProvider is lazy
const AdminAcceptInvite = () => (
  <Suspense fallback={<PageLoadingFallback />}>
    <AuthProvider>
      <AcceptInvite />
    </AuthProvider>
  </Suspense>
);

const AdminLoginPage = () => (
  <Suspense fallback={<PageLoadingFallback />}>
    <AuthProvider>
      <AdminLogin />
    </AuthProvider>
  </Suspense>
);

const AdminDashboardWrapper = () => (
  <Suspense fallback={<PageLoadingFallback />}>
    <AuthProvider>
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    </AuthProvider>
  </Suspense>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)
      retry: 1, // Reduce retry attempts
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: false, // Use cached data when available
      refetchOnReconnect: "always", // Refetch when reconnecting
      networkMode: "offlineFirst", // Support offline mode
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppContent = () => {
  // Register service worker for caching and offline support
  useServiceWorker();
  const [inspectorVisible, setInspectorVisible] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsRouter />

      {/* Lazy load ConsentBanner since it's not critical for FCP */}
      <Suspense fallback={null}>
        <ConsentBanner />
      </Suspense>

      {/* Dev-only inspector - lazy loaded */}
      {!import.meta.env.PROD && (
        <Suspense fallback={null}>
          <AnalyticsInspector
            isVisible={inspectorVisible}
            onToggle={() => setInspectorVisible((v) => !v)}
          />
        </Suspense>
      )}

      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/ontology" element={<Ontology />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/:areaSlug" element={<Area />} />
          <Route path="/:area/:beach-name" element={<BeachDetail />} />

          {/* Admin routes with AuthProvider */}
          <Route path="/admin/accept-invite" element={<AdminAcceptInvite />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardWrapper />}>
            <Route index element={<AdminDashboard />} />
            <Route path="areas" element={<AdminAreasList />} />
            <Route path="areas/new" element={<AdminAreaCreate />} />
            <Route path="areas/:id" element={<AdminAreaEdit />} />
            <Route path="beaches" element={<AdminBeachesList />} />
            <Route path="beaches/new" element={<AdminBeachCreate />} />
            <Route path="beaches/:id" element={<AdminBeachEdit />} />
            <Route path="import-export" element={<ImportExport />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
