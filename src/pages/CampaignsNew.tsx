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

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name,
          query,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campanha criada!",
        description: "Sua campanha foi criada com sucesso.",
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
    createCampaign.mutate();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Nova campanha</h1>
          <p className="text-sm text-muted-foreground">
            Defina um nome e uma busca base. A integração real com Serper e IA será adicionada depois.
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
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Busca</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Ex: "consultorias de marketing em SP", "clínicas odontológicas em BH"...'
            />
          </div>
          <Button type="submit" disabled={createCampaign.isPending}>
            {createCampaign.isPending ? "Criando..." : "Criar campanha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewCampaignPage;
