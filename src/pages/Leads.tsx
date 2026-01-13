import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";

const LeadsPage = () => {
  const { user } = useAuth();

  const { data: leads, isLoading } = useQuery({
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

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${leads?.length ?? 0} leads gerados`}
          </p>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando leads...
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Empresa</th>
                  <th className="px-4 py-2 text-left font-medium">Site</th>
                  <th className="px-4 py-2 text-left font-medium">Score IA</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-border/60">
                    <td className="px-4 py-2">{lead.company_name}</td>
                    <td className="px-4 py-2">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary underline">
                          {lead.website.replace("https://", "").replace("http://", "")}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{lead.score ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground capitalize">{lead.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Você ainda não tem leads. Crie uma campanha para começar a gerar leads automaticamente.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
