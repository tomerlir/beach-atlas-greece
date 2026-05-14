import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
  type DehydratedState,
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import ScrollToTop from "@/components/ScrollToTop";
import AnalyticsRouter from "@/components/AnalyticsRouter";

// Eager imports for prerendered public pages: SSR (renderToString) does not
// resolve React.lazy boundaries — they would render Suspense fallback only.
// Eager-importing ensures the actual page HTML reaches crawlers.
import Index from "./pages/Index";
import About from "./pages/About";
import Areas from "./pages/Areas";
import Ontology from "./pages/Ontology";
import Guide from "./pages/Guide";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import BeachDetail from "./pages/BeachDetail";
import Area from "./pages/Area";
import NotFound from "./pages/NotFound";
import MapPage from "./pages/Map";
import Best from "./pages/Best";
import BestIndex from "./pages/BestIndex";

// Non-critical lazy components
const ConsentBanner = lazy(() => import("@/components/ConsentBanner"));
const AnalyticsInspector = lazy(() => import("@/lib/AnalyticsInspector"));
const AuthProvider = lazy(() =>
  import("@/contexts/AuthContext").then((m) => ({ default: m.AuthProvider }))
);
const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute"));

// Admin pages stay lazy: never prerendered, only loaded on-demand
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

const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: "always",
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

/**
 * Router-agnostic core. Used by App (BrowserRouter) on the client and by
 * prerender.tsx (StaticRouter) on the server. Wrap with a router before use.
 */
export const AppCoreContent = () => {
  // Service worker registration is browser-only via useEffect; safe under SSR.
  useServiceWorker();
  const [inspectorVisible, setInspectorVisible] = useState(false);

  // Render lazy widgets only after client mount. Prevents React error #419
  // (Suspense boundaries that don't resolve during renderToString) and keeps
  // SSR HTML in lockstep with the client's first render.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <>
      <ScrollToTop />
      <AnalyticsRouter />

      {isClient && (
        <Suspense fallback={null}>
          <ConsentBanner />
        </Suspense>
      )}

      {isClient && !import.meta.env.PROD && (
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
          <Route path="/best" element={<BestIndex />} />
          <Route path="/best/:slug" element={<Best />} />
          <Route path="/:areaSlug" element={<Area />} />
          <Route path="/:area/:beach-name" element={<BeachDetail />} />

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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

interface AppProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  helmetContext?: object;
  dehydratedState?: DehydratedState;
}

/**
 * Provider stack shared by client (App) and server (prerender.tsx).
 * `queryClient` and `helmetContext` allow callers to inject SSR-specific
 * instances; `dehydratedState` rehydrates the client cache from server output.
 */
export const AppProviders = ({
  children,
  queryClient = defaultQueryClient,
  helmetContext,
  dehydratedState,
}: AppProvidersProps) => (
  <QueryClientProvider client={queryClient}>
    <HydrationBoundary state={dehydratedState}>
      <HelmetProvider context={helmetContext}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </HelmetProvider>
    </HydrationBoundary>
  </QueryClientProvider>
);

const App = ({ dehydratedState }: { dehydratedState?: DehydratedState } = {}) => (
  <AppProviders dehydratedState={dehydratedState}>
    <BrowserRouter>
      <AppCoreContent />
    </BrowserRouter>
  </AppProviders>
);

export default App;
