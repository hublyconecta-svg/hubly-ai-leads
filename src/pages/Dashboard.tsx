import { useAuth } from "@/integrations/supabase/AuthContext";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">HUBLY</p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo{user?.email ? `, ${user.email}` : ""}. Aqui você verá o resumo das suas campanhas e leads.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <a href="/campanhas/nova">Nova campanha</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/leads">Ver leads</a>
            </Button>
          </div>
        </header>

        <main className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Leads gerados este mês</p>
            <p className="mt-2 text-2xl font-semibold">0</p>
            <p className="mt-1 text-xs text-muted-foreground">Dados mockados por enquanto</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Campanhas ativas</p>
            <p className="mt-2 text-2xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Créditos restantes</p>
            <p className="mt-2 text-2xl font-semibold">50</p>
            <p className="mt-1 text-xs text-muted-foreground">Plano Free (mock)</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
