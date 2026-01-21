import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { MessageTemplatesModal } from "@/components/MessageTemplatesModal";
import { useToast } from "@/hooks/use-toast";

const LeadsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);

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

  const generateMessagesMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-message", {
        body: { lead_id: leadId },
      });

      if (error) throw error;
      if (!data?.messages) throw new Error("Mensagens não geradas");

      return data.messages as string[];
    },
    onSuccess: (messages) => {
      setGeneratedMessages(messages);
      toast({
        title: "Mensagens geradas!",
        description: "3 variações de mensagem foram criadas pela IA.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar mensagens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleOpenMessageModal = (leadId: string) => {
    setSelectedLeadId(leadId);
    setGeneratedMessages([]);
    setModalOpen(true);
  };

  const handleGenerateMessages = () => {
    if (selectedLeadId) {
      generateMessagesMutation.mutate(selectedLeadId);
    }
  };

  const formatWhatsappLink = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  };

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
                  <th className="w-16 px-4 py-2 text-left font-medium">Nº</th>
                  <th className="px-4 py-2 text-left font-medium">Empresa</th>
                  <th className="px-4 py-2 text-left font-medium">Site</th>
                  <th className="px-4 py-2 text-left font-medium">WhatsApp</th>
                  <th className="px-4 py-2 text-left font-medium">Score IA</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <tr key={lead.id} className="border-t border-border/60 hover:bg-muted/20">
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">{index + 1}</td>
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
                    <td className="px-4 py-2">
                      {lead.whatsapp ? (
                        (() => {
                          const link = formatWhatsappLink(lead.whatsapp);
                          return link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline hover:no-underline"
                            >
                              {lead.whatsapp}
                            </a>
                          ) : (
                            <span>{lead.whatsapp}</span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{lead.score ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${
                          lead.status === "won"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : lead.status === "qualified"
                            ? "bg-green-500/10 text-green-600"
                            : lead.status === "negotiation"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : lead.status === "contacted"
                            ? "bg-blue-500/10 text-blue-600"
                            : lead.status === "lost"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {lead.status === "won"
                          ? "Ganho"
                          : lead.status === "qualified"
                          ? "Qualificado"
                          : lead.status === "negotiation"
                          ? "Negociação"
                          : lead.status === "contacted"
                          ? "Contatado"
                          : lead.status === "lost"
                          ? "Perdido"
                          : "Novo"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMessageModal(lead.id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Mensagens
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/leads/${lead.id}`)}>
                          Ver detalhes
                        </Button>
                      </div>
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

        <MessageTemplatesModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          messages={generatedMessages}
          isGenerating={generateMessagesMutation.isPending}
          onGenerate={handleGenerateMessages}
        />
      </div>
    </div>
  );
};

export default LeadsPage;
