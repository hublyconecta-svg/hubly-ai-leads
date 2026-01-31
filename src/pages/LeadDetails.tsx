import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Globe,
  Star,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  User,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { MessageTemplatesModal } from "@/components/MessageTemplatesModal";

interface Lead {
  id: string;
  company_name: string;
  website: string | null;
  score: number | null;
  status: string;
  reasoning: string | null;
  created_at: string;
}

interface Interaction {
  id: string;
  type: string;
  content: string;
  created_at: string;
}

interface LeadSite {
  id: string;
  lead_id: string;
  html: string;
  css: string;
  meta: any | null;
  created_at: string;
}

const LeadDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [interactionType, setInteractionType] = useState<"note" | "email" | "call" | "meeting">("note");
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: lead, isLoading: loadingLead } = useQuery<Lead & { lead_sites?: LeadSite[] }>({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, lead_sites(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Lead & { lead_sites?: LeadSite[] };
    },
    enabled: !!user && !!id,
  });

  const { data: interactions = [], isLoading: loadingInteractions } = useQuery<Interaction[]>({
    queryKey: ["lead-interactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_interactions")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const addInteraction = useMutation({
    mutationFn: async () => {
      if (!user?.id || !id) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("lead_interactions").insert({
        lead_id: id,
        user_id: user.id,
        type: interactionType,
        content: newNote,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-interactions", id] });
      setNewNote("");
      toast({
        title: "Interação adicionada!",
        description: "Sua nota foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar interação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const generateMessage = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Lead ID não encontrado");

      const { data, error } = await supabase.functions.invoke("generate-message", {
        body: { lead_id: id },
      });

      if (error) throw error;
      if (!data?.messages) throw new Error("Mensagens não geradas");

      return data.messages as string[];
    },
    onSuccess: (messages) => {
      setGeneratedMessages(messages);
      queryClient.invalidateQueries({ queryKey: ["lead-interactions", id] });
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

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id) throw new Error("Lead ID não encontrado");

      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Status atualizado!",
        description: "O status do lead foi alterado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });


  const handleOpenMessageModal = () => {
    setGeneratedMessages([]);
    setModalOpen(true);
  };

  const handleGenerateMessages = () => {
    generateMessage.mutate();
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast({
        title: "Nota vazia",
        description: "Por favor, escreva uma nota antes de salvar.",
        variant: "destructive",
      });
      return;
    }
    addInteraction.mutate();
  };

  if (loadingLead) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-destructive">Lead não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/leads")} className="mt-4">
            Voltar para leads
          </Button>
        </div>
      </div>
    );
  }

  const statusOptions = [
    { value: "new", label: "Novo", color: "bg-gray-500/10 text-gray-600" },
    { value: "contacted", label: "Contatado", color: "bg-blue-500/10 text-blue-600" },
    { value: "qualified", label: "Qualificado", color: "bg-green-500/10 text-green-600" },
    { value: "negotiation", label: "Negociação", color: "bg-yellow-500/10 text-yellow-600" },
    { value: "won", label: "Ganho", color: "bg-emerald-500/10 text-emerald-600" },
    { value: "lost", label: "Perdido", color: "bg-red-500/10 text-red-600" },
  ];

  const currentStatus = statusOptions.find((s) => s.value === lead.status) || statusOptions[0];
  const typeIcons = {
    note: MessageSquare,
    email: Mail,
    call: Phone,
    meeting: User,
  };

  const typeLabels = {
    note: "Nota",
    email: "E-mail",
    call: "Ligação",
    meeting: "Reunião",
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para leads
        </Button>

        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            {/* Cabeçalho do Lead */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold">{lead.company_name}</h1>
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        {lead.website.replace("https://", "").replace("http://", "")}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Sem website</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2 flex items-center justify-end gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-semibold">{lead.score ?? "—"}</span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${currentStatus.color}`}
                      >
                        {currentStatus.label}
                        <ChevronDown className="ml-2 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-50 bg-background" align="end">
                      <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {statusOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => updateStatus.mutate(option.value)}
                          disabled={updateStatus.isPending}
                          className="cursor-pointer"
                        >
                          <span className={`inline-block rounded-full px-2 py-1 text-xs ${option.color}`}>
                            {option.label}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Análise da IA */}
              {lead.reasoning && (
                <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Star className="h-4 w-4 text-primary" />
                    Análise da IA
                  </h3>
                  <p className="text-sm text-muted-foreground">{lead.reasoning}</p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Criado em {new Date(lead.created_at).toLocaleString("pt-BR")}
              </div>
            </div>

            {/* Gerador de mensagens com IA */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Mensagens de vendas geradas por IA
                  </h2>
                </div>
                <Button
                  onClick={handleOpenMessageModal}
                  size="sm"
                  className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Mensagens
                </Button>
              </div>
            </div>

            {/* Adicionar nova interação */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Nova interação</h2>
              <form onSubmit={handleSubmitNote} className="space-y-4">
                <div className="flex gap-2">
                  {(["note", "email", "call", "meeting"] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={interactionType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInteractionType(type)}
                    >
                      {typeLabels[type]}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`Adicionar ${typeLabels[interactionType].toLowerCase()}...`}
                  rows={3}
                />
                <Button type="submit" disabled={addInteraction.isPending}>
                  {addInteraction.isPending ? "Salvando..." : "Salvar interação"}
                </Button>
              </form>
            </div>

            {/* Histórico de interações */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Histórico de interações</h2>
              {loadingInteractions ? (
                <p className="text-sm text-muted-foreground">Carregando interações...</p>
              ) : interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction) => {
                    const Icon = typeIcons[interaction.type as keyof typeof typeIcons];
                    return (
                      <div
                        key={interaction.id}
                        className="rounded-lg border border-border/60 bg-muted/20 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                {typeLabels[interaction.type as keyof typeof typeLabels]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(interaction.created_at).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{interaction.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma interação ainda. Adicione a primeira acima!
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <MessageTemplatesModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          messages={generatedMessages}
          isGenerating={generateMessage.isPending}
          onGenerate={handleGenerateMessages}
        />
      </div>
    </div>
  );
};

export default LeadDetailsPage;
