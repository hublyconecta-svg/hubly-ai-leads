import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewCampaignPage = () => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCampaignAndGenerateLeads = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // 1. Criar a campanha
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name,
          query,
          status: "active",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // 2. Chamar edge function para gerar leads
      const { data: leadsData, error: leadsError } = await supabase.functions.invoke("generate-leads", {
        body: {
          campaign_id: campaign.id,
          query,
        },
      });

      if (leadsError) throw leadsError;

      return { campaign, leadsData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      
      const leadsCount = data.leadsData?.leads_created || 0;
      
      toast({
        title: "Campanha criada!",
        description: `${leadsCount} leads foram gerados e qualificados com IA.`,
      });
      navigate("/campanhas");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar campanha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, defina um nome para a campanha.",
        variant: "destructive",
      });
      return;
    }
    if (!query.trim()) {
      toast({
        title: "Busca obrigatória",
        description: "Por favor, defina uma busca para encontrar leads.",
        variant: "destructive",
      });
      return;
    }
    createCampaignAndGenerateLeads.mutate();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Nova campanha</h1>
          <p className="text-sm text-muted-foreground">
            Defina um nome e uma busca. A IA vai encontrar e qualificar leads automaticamente usando Serper + Gemini.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da campanha</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Consultorias em São Paulo"
              required
              disabled={createCampaignAndGenerateLeads.isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Busca</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Ex: "consultorias de marketing em SP", "clínicas odontológicas em BH"...'
              required
              disabled={createCampaignAndGenerateLeads.isPending}
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Seja específico na busca para obter leads mais relevantes
            </p>
          </div>
          <Button type="submit" disabled={createCampaignAndGenerateLeads.isPending}>
            {createCampaignAndGenerateLeads.isPending ? "Gerando leads..." : "Criar campanha e gerar leads"}
          </Button>
          {createCampaignAndGenerateLeads.isPending && (
            <p className="text-xs text-muted-foreground">
              ⏳ Buscando e qualificando leads com IA... isso pode levar alguns segundos.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewCampaignPage;
