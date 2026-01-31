import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type LogoItem = { url: string; variant_index: number };
type GenerateLogoGenericResponse = { images: LogoItem[]; meta?: Record<string, unknown> };

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",", 2);
  const mime = /data:(.*);base64/.exec(meta)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function GeradorLogosPage() {
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [brief, setBrief] = useState("Logo moderna, profissional e memorável.");
  const [colors, setColors] = useState("azul, branco, cinza escuro");
  const [style, setStyle] = useState("minimalista, clean, focada em tipografia");
  const [variations, setVariations] = useState(3);

  const generate = useMutation({
    mutationFn: async () => {
      if (!companyName.trim()) throw new Error("Informe o nome da empresa.");

      const safeVariations = Math.max(1, Math.min(6, Number(variations) || 3));
      const { data, error } = await supabase.functions.invoke("generate-logo-generic", {
        body: {
          company_name: companyName.trim(),
          brief,
          colors,
          style,
          variations: safeVariations,
        },
      });

      if (error) throw error;
      const payload = data as Partial<GenerateLogoGenericResponse> | null;
      if (!payload?.images?.length) throw new Error("Nenhuma imagem retornada.");
      return payload as GenerateLogoGenericResponse;
    },
    onSuccess: () => toast({ title: "Logos gerados!", description: "As variações aparecerão na grade." }),
    onError: (err) =>
      toast({
        title: "Erro ao gerar logos",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      }),
  });

  const logos = useMemo(() => generate.data?.images || [], [generate.data?.images]);

  const handleDownload = (logo: LogoItem, index: number) => {
    if (!logo.url?.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = logo.url;
      a.download = `logo-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const blob = dataUrlToBlob(logo.url);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logo-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <Card className="glass-card border-border/60 bg-background/60">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">Gerador de Logos</CardTitle>
          <p className="text-sm text-muted-foreground">Gere logos sem depender de um lead.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[1.05fr,1.35fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa *</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief">Brief</Label>
                <Textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colors">Cores</Label>
                <Input id="colors" value={colors} onChange={(e) => setColors(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Estilo</Label>
                <Input id="style" value={style} onChange={(e) => setStyle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variations">Variações (1–6)</Label>
                <Input id="variations" type="number" min={1} max={6} value={variations} onChange={(e) => setVariations(Number(e.target.value))} />
              </div>

              <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? "Gerando..." : "Gerar logos"}
              </Button>
            </div>

            <div className="space-y-4">
              {logos.length === 0 ? (
                <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/30 px-4 text-center">
                  <p className="text-sm text-muted-foreground">Gere para ver as variações aqui.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {logos.map((logo, idx) => (
                    <div key={`${logo.variant_index}-${idx}`} className="rounded-xl border bg-background/40 p-3">
                      <img
                        src={logo.url}
                        alt={`Logo ${idx + 1} - ${companyName || "empresa"}`}
                        className="h-28 w-full rounded-lg border bg-background object-contain"
                        loading="lazy"
                      />
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">Variação #{idx + 1}</p>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleDownload(logo, idx)}>
                          Baixar PNG
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
