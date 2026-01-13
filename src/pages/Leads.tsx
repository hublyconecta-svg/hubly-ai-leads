import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const LeadsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);

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

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      searchTerm === "" ||
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.website?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWebsiteFilter = !filterNoWebsite || !lead.website;

    return matchesSearch && matchesWebsiteFilter;
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

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Buscar por empresa ou site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant={filterNoWebsite ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterNoWebsite(!filterNoWebsite)}
          >
            {filterNoWebsite ? "✓ " : ""}Sem website
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando leads...
          </div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Empresa</th>
                  <th className="px-4 py-2 text-left font-medium">Site</th>
                  <th className="px-4 py-2 text-left font-medium">Score IA</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-border/60 hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">{lead.company_name}</td>
                    <td className="px-4 py-2">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          {lead.website.replace("https://", "").replace("http://", "")}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{lead.score ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${
                          lead.status === "qualified"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {lead.status === "qualified" ? "Qualificado" : lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/leads/${lead.id}`)}>
                        Ver detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            {searchTerm || filterNoWebsite
              ? "Nenhum lead encontrado com os filtros aplicados."
              : "Você ainda não tem leads. Crie uma campanha para começar a gerar leads automaticamente."}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
