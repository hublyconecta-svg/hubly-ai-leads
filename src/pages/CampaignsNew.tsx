import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const NewCampaignPage = () => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Campanha criada (mock)",
      description: "No próximo passo vamos salvar campanhas no Supabase.",
    });
    navigate("/campanhas");
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
          <Button type="submit">Criar campanha (mock)</Button>
        </form>
      </div>
    </div>
  );
};

export default NewCampaignPage;
