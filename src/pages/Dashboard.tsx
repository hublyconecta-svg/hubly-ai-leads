import { useAuth } from "@/integrations/supabase/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DashboardPage = () => {
  const { user } = useAuth();

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const leadsCount = leads?.length ?? 0;

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
            <p className="mt-2 text-2xl font-semibold">
              {loadingLeads ? "..." : leadsCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {leadsCount === 0 ? "Crie sua primeira campanha" : "Total de leads"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Campanhas ativas</p>
            <p className="mt-2 text-2xl font-semibold">
              {loadingCampaigns ? "..." : activeCampaigns}
            </p>
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
