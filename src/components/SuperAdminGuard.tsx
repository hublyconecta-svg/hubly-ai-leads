import { ReactNode } from "react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Navigate } from "react-router-dom";

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8">
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
