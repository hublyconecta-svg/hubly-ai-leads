import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
interface AuthenticatedLayoutProps {
  children: ReactNode;
}
export function AuthenticatedLayout({
  children
}: AuthenticatedLayoutProps) {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", {
      replace: true
    });
  };
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-background/90">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          {/* Header fixo */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-primary/30 bg-gradient-to-r from-background/80 via-background/60 to-primary/20 px-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover-scale rounded-full border border-primary/40 bg-background/60 p-2 shadow-sm shadow-primary/40" />
              <span className="hidden text-xs font-semibold tracking-[0.32em] text-muted-foreground sm:inline">
                HUBLY • AI LEADS
              </span>
            </div>

            <div className="flex items-center rounded-none gap-[12px]">
              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-sans font-extrabold">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover-scale">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </header>

          {/* Conteúdo principal */}
          <main className="flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>;
}