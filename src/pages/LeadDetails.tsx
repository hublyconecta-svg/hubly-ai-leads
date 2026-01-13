import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState, useEffect } from "react";
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
  Download,
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
  const [siteHtml, setSiteHtml] = useState("");
  const [siteCss, setSiteCss] = useState("");
  const [siteGoal, setSiteGoal] = useState("Gerar mais leads para serviços de criação de sites");
  const [siteTone, setSiteTone] = useState("Profissional e consultivo");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [sections, setSections] = useState("Hero, Sobre, Serviços, Depoimentos, Contato");
  const [logoBrief, setLogoBrief] = useState(
    "Logo moderna para a clínica, transmitindo confiança, tecnologia e cuidado com o sorriso.",
  );
  const [logoColors, setLogoColors] = useState("#0ea5e9, #0f172a");
  const [logoStyle, setLogoStyle] = useState("Minimalista, clean, focada em tipografia");
  const [generatedLogos, setGeneratedLogos] = useState<{ url: string; variant_index: number }[]>([]);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
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

  const { data: lastLogos } = useQuery<{ images: { url: string; variant_index: number }[] } | null>({
    queryKey: ["lead-logos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_logos")
        .select("images")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { images: { url: string; variant_index: number }[] } | null;
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

  const generateSite = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Lead ID não encontrado");

      const { data, error } = await supabase.functions.invoke("generate-site-from-lead", {
        body: {
          lead_id: id,
          goal: siteGoal,
          tone: siteTone,
          primary_color: primaryColor,
          sections,
        },
      });

      if (error) throw error;
      if (!data?.html || !data?.css) {
        throw new Error("Site não foi gerado corretamente");
      }

      return data as { html: string; css: string };
    },
    onSuccess: (data) => {
      setSiteHtml(data.html);
      setSiteCss(data.css);
      toast({
        title: "Site gerado!",
        description: "Preview atualizado com base nas informações do lead.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar site",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (lead?.lead_sites && !siteHtml && !siteCss) {
      const lastLeadSite = [...lead.lead_sites].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      if (lastLeadSite) {
        setSiteHtml(lastLeadSite.html);
        setSiteCss(lastLeadSite.css);
      }
    }
  }, [lead, siteHtml, siteCss]);

  useEffect(() => {
    if (lastLogos?.images && lastLogos.images.length > 0 && generatedLogos.length === 0) {
      setGeneratedLogos(lastLogos.images);
    }
  }, [lastLogos, generatedLogos.length]);

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

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${lead.company_name ?? "Site do Lead"}</title>
        <style>
          ${siteCss}
        </style>
      </head>
      <body>
        ${siteHtml}
      </body>
    </html>
  `;

  const handleDownloadSite = () => {
    if (!siteHtml || !siteCss) {
      toast({
        title: "Nada para baixar",
        description: "Gere o site primeiro antes de fazer o download.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const fileNameBase = lead.company_name
      ? lead.company_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")
      : "site-lead";
    a.download = `${fileNameBase}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado",
      description: "Arquivo HTML gerado com sucesso.",
    });
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
            <TabsTrigger value="motor-proprio">Motor próprio</TabsTrigger>
            <TabsTrigger value="gerador-logos">Gerador de logos</TabsTrigger>
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

          <TabsContent value="motor-proprio">
            <div className="grid gap-6 lg:grid-cols-[1.1fr,1.5fr]">
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Motor próprio de site</h2>
                <p className="text-sm text-muted-foreground">
                  Gere uma landing page focada neste lead e faça o download do arquivo HTML.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Objetivo principal</label>
                  <Textarea
                    value={siteGoal}
                    onChange={(e) => setSiteGoal(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tom de voz</label>
                  <Input
                    value={siteTone}
                    onChange={(e) => setSiteTone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Cor primária (hex)</label>
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Seções desejadas</label>
                  <Textarea
                    value={sections}
                    onChange={(e) => setSections(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => generateSite.mutate()}
                    disabled={generateSite.isPending}
                  >
                    {generateSite.isPending ? "Gerando site..." : "Gerar site"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadSite}
                    disabled={!siteHtml || !siteCss}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download do site
                  </Button>
                </div>

                {generateSite.isError && (
                  <p className="text-sm text-destructive">
                    Erro ao gerar site. Tente novamente em alguns instantes.
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Preview</h2>

                {siteHtml ? (
                  <iframe
                    title="Preview do site"
                    className="h-[480px] w-full rounded border bg-background"
                    srcDoc={fullHtml}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Configure as opções e clique em "Gerar site" para visualizar o layout aqui.
                  </p>
                )}

                {siteHtml && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-1 text-sm font-medium">HTML</h3>
                      <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
                        <code>{siteHtml}</code>
                      </pre>
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-medium">CSS</h3>
                      <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
                        <code>{siteCss}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gerador-logos" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
              {/* Coluna esquerda: formulário de configuração */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-6">
                <h2 className="text-lg font-semibold">Configurações do logo</h2>
                <p className="text-sm text-muted-foreground">
                  Descreva como deve ser o logo da {lead.company_name} e quais cores/estilo você prefere.
                </p>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Brief do logo</label>
                  <Textarea
                    value={logoBrief}
                    onChange={(e) => setLogoBrief(e.target.value)}
                    placeholder="Ex.: Logo moderna para clínica odontológica em Curitiba, transmitindo confiança, tecnologia e cuidado."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cores desejadas</label>
                  <Input
                    value={logoColors}
                    onChange={(e) => setLogoColors(e.target.value)}
                    placeholder="#0ea5e9, #0f172a"
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode usar hex (#0ea5e9) ou descrever as cores (azul, branco, cinza escuro).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estilo visual</label>
                  <Input
                    value={logoStyle}
                    onChange={(e) => setLogoStyle(e.target.value)}
                    placeholder="Minimalista, premium, sofisticado, focado em tipografia"
                  />
                </div>

                <Button
                  type="button"
                  disabled={isGeneratingLogos}
                  onClick={async () => {
                    if (!id) return;
                    setIsGeneratingLogos(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-logo", {
                        body: {
                          lead_id: id,
                          brief: logoBrief,
                          colors: logoColors,
                          style: logoStyle,
                        },
                      });

                      if (error) throw error;

                      const leadLogo = (data as any)?.lead_logo;
                      const images = (leadLogo?.images || []) as { url: string; variant_index: number }[];
                      setGeneratedLogos(images);

                      toast({
                        title: "Logos gerados!",
                        description: "Novas variações de logo foram geradas para este lead.",
                      });
                    } catch (err) {
                      console.error(err);
                      toast({
                        title: "Erro ao gerar logos",
                        description:
                          err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsGeneratingLogos(false);
                    }
                  }}
                >
                  {isGeneratingLogos ? "Gerando..." : "Gerar logos"}
                </Button>
              </div>

              {/* Coluna direita: visualização de logos */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Pré-visualização de logos</h2>
                    <p className="text-sm text-muted-foreground">
                      As variações de logo geradas pela IA aparecerão aqui. Clique para abrir em outra aba ou fazer download.
                    </p>
                  </div>
                </div>

                {generatedLogos.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                    Defina o brief, cores e estilo ao lado e clique em &quot;Gerar logos&quot;. As variações geradas aparecerão aqui.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {generatedLogos.map((logo, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-stretch rounded-lg border bg-background p-4 text-xs text-muted-foreground"
                      >
                        <img
                          src={logo.url}
                          alt={`Logo ${index + 1} - ${lead.company_name}`}
                          className="mb-3 h-24 w-full rounded-md border bg-muted object-contain"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Variação de logo #{index + 1}
                        </span>
                        <a
                          href={logo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 break-all text-xs text-primary hover:underline"
                        >
                          Abrir em nova aba
                        </a>
                        <a
                          href={logo.url}
                          download
                          className="mt-2 inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Baixar PNG
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
