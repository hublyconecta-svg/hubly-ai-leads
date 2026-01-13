import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import { AuthProvider } from "@/integrations/supabase/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { AuthenticatedLayout } from "@/layouts/AuthenticatedLayout";
import DashboardPage from "./pages/Dashboard";
import CampaignsPage from "./pages/Campaigns";
import NewCampaignPage from "./pages/CampaignsNew";
import LeadsPage from "./pages/Leads";
import LeadDetailsPage from "./pages/LeadDetails";
import SettingsPage from "./pages/Settings";
import UpgradePage from "./pages/Upgrade";
import SuperAdminPage from "./pages/SuperAdmin";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <DashboardPage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/campanhas"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <CampaignsPage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/campanhas/nova"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <NewCampaignPage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/leads"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <LeadsPage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/leads/:id"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <LeadDetailsPage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <SettingsPage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/upgrade"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <UpgradePage />
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AuthenticatedLayout>
                    <SuperAdminGuard>
                      <SuperAdminPage />
                    </SuperAdminGuard>
                  </AuthenticatedLayout>
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
