import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBeachesList from "./pages/admin/beaches/AdminBeachesList";
import AdminBeachCreate from "./pages/admin/beaches/AdminBeachCreate";
import AdminBeachEdit from "./pages/admin/beaches/AdminBeachEdit";
import ImportExport from "./pages/admin/ImportExport";
import AdminSettings from "./pages/admin/AdminSettings";
import BeachDetail from "./pages/BeachDetail";
import NotFound from "./pages/NotFound";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const AppContent = () => {
  // Register service worker for caching and offline support
  useServiceWorker();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/beach/:slug" element={<BeachDetail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
