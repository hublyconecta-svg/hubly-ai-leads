import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";

const CampaignsPage = () => {
  const { user } = useAuth();

  const { data: campaigns, isLoading } = useQuery({
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

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Campanhas</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${campaigns?.length ?? 0} campanhas criadas`}
            </p>
          </div>
          <Button asChild>
            <a href="/campanhas/nova">Nova campanha</a>
          </Button>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando campanhas...
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{campaign.query || "Sem query"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Criada em {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      campaign.status === "active" ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-600"
                    }`}
                  >
                    {campaign.status === "active" ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Você ainda não tem campanhas. Clique em "Nova campanha" para criar sua primeira campanha.
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage;
