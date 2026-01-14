import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface PrdFormState {
  aiProvider: string;
  productName: string;
  goal: string;
  audience: string;
  problem: string;
  scope: string;
  constraints: string;
  tone: string;
}

interface PrdHistoryItem {
  id: string;
  createdAt: string;
  aiProvider: string;
  productName: string;
  goal: string;
  audience: string;
  problem: string;
  scope: string;
  constraints: string;
  tone: string;
  content: string;
}

const STORAGE_KEY = "prd_prompt_history_v1";

const initialFormState: PrdFormState = {
  aiProvider: "lovable",
  productName: "",
  goal: "",
  audience: "",
  problem: "",
  scope: "",
  constraints: "",
  tone: "profissional",
};

export default function PrdPromptPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<PrdFormState>(initialFormState);
  const [prd, setPrd] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<PrdHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PrdHistoryItem[];
        setHistory(parsed);
        if (parsed[0]) {
          setActiveHistoryId(parsed[0].id);
          setPrd(parsed[0].content);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de PRDs", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Erro ao salvar histórico de PRDs", err);
    }
  }, [history]);

  const handleChange = (field: keyof PrdFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.productName || !form.goal || !form.problem) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Pelo menos nome do produto, objetivo e problema são necessários.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPrd("");

    const prompt = `Você é um(a) PM experiente. Use as informações abaixo para escrever um PRD completo em português, com seções claras (Visão Geral, Objetivos, Público-alvo, Problema, Solução Proposta, Funcionalidades, Jornada do Usuário, Requisitos Técnicos, Métricas de Sucesso, Riscos e Abertos).

Ferramenta de IA escolhida: ${form.aiProvider}
Nome do produto/projeto: ${form.productName}
Objetivo principal: ${form.goal}
Público-alvo: ${form.audience || "(não informado)"}
Problema a ser resolvido: ${form.problem}
Escopo / funcionalidades principais: ${form.scope || "(não informado)"}
Restrições / requisitos: ${form.constraints || "(não informado)"}
Tom da escrita desejado: ${form.tone}`;

    try {
      const { data, error } = await supabase.functions.invoke("generate-prd", {
        body: {
          aiProvider: form.aiProvider,
          prompt,
        },
      });

      if (error) {
        console.error(error);
        toast({
          title: "Erro ao gerar PRD",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
        return;
      }

      const content = (data as { prd?: string })?.prd || "";
      setPrd(content);

      const newItem: PrdHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        aiProvider: form.aiProvider,
        productName: form.productName,
        goal: form.goal,
        audience: form.audience,
        problem: form.problem,
        scope: form.scope,
        constraints: form.constraints,
        tone: form.tone,
        content,
      };

      setHistory((prev) => [newItem, ...prev]);
      setActiveHistoryId(newItem.id);

      toast({
        title: "PRD gerado com sucesso",
        description: "Revise, edite e compartilhe com o time.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro inesperado",
        description: "Não foi possível gerar o PRD agora.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: PrdHistoryItem) => {
    setActiveHistoryId(item.id);
    setPrd(item.content);
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
    setPrd("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex h-full gap-6 p-6">
      <div className="flex-1 space-y-4">
        <Card className="glass-card border-border/60 bg-background/60">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              PRD Prompt
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Selecione a IA, responda algumas perguntas e gere um PRD completo com histórico embutido.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>IA / Ferramenta</Label>
                  <Select
                    value={form.aiProvider}
                    onValueChange={(value) => handleChange("aiProvider", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a IA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">Lovable AI</SelectItem>
                      <SelectItem value="replit">Replit</SelectItem>
                      <SelectItem value="windsurf">Windsurf</SelectItem>
                      <SelectItem value="bolt">Bolt</SelectItem>
                      <SelectItem value="google-ai-studio">Google AI Studio</SelectItem>
                      <SelectItem value="outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productName">Nome do produto / projeto</Label>
                  <Input
                    id="productName"
                    value={form.productName}
                    onChange={(e) => handleChange("productName", e.target.value)}
                    placeholder="Ex: Hub de leads para SDRs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo principal</Label>
                <Textarea
                  id="goal"
                  value={form.goal}
                  onChange={(e) => handleChange("goal", e.target.value)}
                  placeholder="O que esse produto precisa entregar de resultado?"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audience">Público-alvo</Label>
                  <Textarea
                    id="audience"
                    value={form.audience}
                    onChange={(e) => handleChange("audience", e.target.value)}
                    placeholder="Quem vai usar? Perfil, nível de maturidade, contexto."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problema a ser resolvido</Label>
                  <Textarea
                    id="problem"
                    value={form.problem}
                    onChange={(e) => handleChange("problem", e.target.value)}
                    placeholder="Qual dor específica esse produto precisa atacar?"
                    rows={3}
                  />
                </div>
              </div>

              <Tabs defaultValue="scope" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="scope">Escopo</TabsTrigger>
                  <TabsTrigger value="constraints">Restrições</TabsTrigger>
                  <TabsTrigger value="tone">Tom</TabsTrigger>
                </TabsList>
                <TabsContent value="scope" className="mt-4 space-y-2">
                  <Label htmlFor="scope">Escopo / funcionalidades principais</Label>
                  <Textarea
                    id="scope"
                    value={form.scope}
                    onChange={(e) => handleChange("scope", e.target.value)}
                    placeholder="Liste módulos, telas, integrações, regras importantes."
                    rows={4}
                  />
                </TabsContent>
                <TabsContent value="constraints" className="mt-4 space-y-2">
                  <Label htmlFor="constraints">Restrições / requisitos</Label>
                  <Textarea
                    id="constraints"
                    value={form.constraints}
                    onChange={(e) => handleChange("constraints", e.target.value)}
                    placeholder="Prazos, orçamento, tech stack obrigatória, dependências, etc."
                    rows={4}
                  />
                </TabsContent>
                <TabsContent value="tone" className="mt-4 space-y-2">
                  <Label htmlFor="tone">Tom da escrita</Label>
                  <Input
                    id="tone"
                    value={form.tone}
                    onChange={(e) => handleChange("tone", e.target.value)}
                    placeholder="Ex: profissional, direto ao ponto, focado em negócios"
                  />
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  O PRD gerado fica salvo automaticamente no histórico ao lado, para você comparar versões.
                </p>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Gerando PRD..." : "Gerar PRD"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60 bg-background/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-tight">
              PRD gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[480px] rounded-xl border border-border/60 bg-background/40 p-4">
              {prd ? (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {prd}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preencha o formulário ao lado e clique em "Gerar PRD" para ver o resultado aqui.
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Card className="glass-card border-border/60 bg-background/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Histórico de PRDs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{history.length} versões salvas</span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Limpar histórico
                </button>
              )}
            </div>

            <ScrollArea className="h-[520px] pr-2">
              <div className="space-y-2">
                {history.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Assim que você gerar o primeiro PRD ele aparece aqui, já com contexto e data.
                  </p>
                )}

                {history.map((item) => {
                  const isActive = item.id === activeHistoryId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectHistory(item)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "border-primary/70 bg-primary/10 text-primary-foreground/90"
                          : "border-border/70 bg-background/60 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="line-clamp-1 font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                          {item.productName || "Sem título"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">
                          {new Date(item.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {item.goal || item.problem}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80">
                        IA: {item.aiProvider}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
