import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type GenerateSiteResponse = {
  html: string;
  css: string;
};

export default function MotorProprioPage() {
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [goal, setGoal] = useState("Gerar mais leads para serviços digitais");
  const [tone, setTone] = useState("Profissional e consultivo");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [sections, setSections] = useState("Hero, Sobre, Serviços, Depoimentos, Contato");

  const generate = useMutation({
    mutationFn: async () => {
      if (!companyName.trim()) throw new Error("Informe o nome da empresa.");

      const { data, error } = await supabase.functions.invoke("generate-site", {
        body: {
          company_name: companyName.trim(),
          website: website.trim() || undefined,
          goal,
          tone,
          primary_color: primaryColor,
          sections,
        },
      });

      if (error) throw error;
      const payload = data as Partial<GenerateSiteResponse> | null;
      if (!payload?.html || !payload?.css) throw new Error("Site não foi gerado corretamente.");
      return payload as GenerateSiteResponse;
    },
    onSuccess: () =>
      toast({
        title: "Site gerado!",
        description: "Preview atualizado.",
      }),
    onError: (err) =>
      toast({
        title: "Erro ao gerar site",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      }),
  });

  const fullHtml = useMemo(() => {
    const html = generate.data?.html || "";
    const css = generate.data?.css || "";
    const title = companyName.trim() || "Landing Page";

    return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>${css}</style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
  }, [companyName, generate.data?.css, generate.data?.html]);

  const handleDownload = () => {
    if (!generate.data?.html || !generate.data?.css) {
      toast({
        title: "Nada para baixar",
        description: "Gere o site primeiro.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileNameBase = companyName
      ? companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")
      : "site";
    a.download = `${fileNameBase}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <Card className="glass-card border-border/60 bg-background/60">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">Motor Próprio</CardTitle>
          <p className="text-sm text-muted-foreground">Gere uma landing page sem depender de um lead.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[1.05fr,1.35fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Clínica Sorriso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (opcional)</Label>
                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom</Label>
                <Input id="tone" value={tone} onChange={(e) => setTone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor primária (hex)</Label>
                <Input id="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sections">Seções</Label>
                <Textarea id="sections" value={sections} onChange={(e) => setSections(e.target.value)} rows={2} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                  {generate.isPending ? "Gerando..." : "Gerar"}
                </Button>
                <Button variant="outline" type="button" onClick={handleDownload} disabled={!generate.data?.html || !generate.data?.css}>
                  Baixar HTML
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {generate.data?.html ? (
                <iframe title="Preview do site" className="h-[560px] w-full rounded-xl border bg-background" srcDoc={fullHtml} />
              ) : (
                <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/30 px-4 text-center">
                  <p className="text-sm text-muted-foreground">Clique em “Gerar” para ver o preview aqui.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
