import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import Areas from "./pages/Areas";
import Ontology from "./pages/Ontology";
import Guide from "./pages/Guide";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAreasList from "./pages/admin/areas/AdminAreasList";
import AdminAreaCreate from "./pages/admin/areas/AdminAreaCreate";
import AdminAreaEdit from "./pages/admin/areas/AdminAreaEdit";
import AdminBeachesList from "./pages/admin/beaches/AdminBeachesList";
import AdminBeachCreate from "./pages/admin/beaches/AdminBeachCreate";
import AdminBeachEdit from "./pages/admin/beaches/AdminBeachEdit";
import ImportExport from "./pages/admin/ImportExport";
import AdminSettings from "./pages/admin/AdminSettings";
import BeachDetail from "./pages/BeachDetail";
import Area from "./pages/Area";
import NotFound from "./pages/NotFound";
import MapPage from "./pages/Map";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import ScrollToTop from "@/components/ScrollToTop";
import AcceptInvite from "./pages/admin/AcceptInvite";
import ConsentBanner from "@/components/ConsentBanner";
import AnalyticsInspector from "@/lib/AnalyticsInspector";
import AnalyticsRouter from "@/components/AnalyticsRouter";

// Admin route wrapper components
const AdminAcceptInvite = () => (
  <AuthProvider>
    <AcceptInvite />
  </AuthProvider>
);

const AdminLoginPage = () => (
  <AuthProvider>
    <AdminLogin />
  </AuthProvider>
);

const AdminDashboardWrapper = () => (
  <AuthProvider>
    <ProtectedRoute requiredRole="admin">
      <AdminLayout />
    </ProtectedRoute>
  </AuthProvider>
);

const queryClient = new QueryClient();

const AppContent = () => {
  // Register service worker for caching and offline support
  useServiceWorker();
  const [inspectorVisible, setInspectorVisible] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsRouter />
      <ConsentBanner />
      {!import.meta.env.PROD && (
        <AnalyticsInspector
          isVisible={inspectorVisible}
          onToggle={() => setInspectorVisible((v) => !v)}
        />
      )}
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
