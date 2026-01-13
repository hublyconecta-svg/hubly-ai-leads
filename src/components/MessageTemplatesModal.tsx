import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: string[];
  isGenerating: boolean;
  onGenerate: () => void;
}

export function MessageTemplatesModal({
  open,
  onOpenChange,
  messages,
  isGenerating,
  onGenerate,
}: MessageTemplatesModalProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (message: string, index: number) => {
    navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  const toneLabels = ["Formal", "Casual", "Direto"];
  const toneDescriptions = [
    "Tom corporativo e profissional",
    "Tom amigável e próximo",
    "Focado em resultados rápidos",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Templates de Mensagens com IA
          </DialogTitle>
          <DialogDescription>
            Escolha entre 3 variações de mensagem personalizada geradas pela IA
          </DialogDescription>
        </DialogHeader>

        {messages.length === 0 ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Clique no botão abaixo para gerar 3 variações de mensagem personalizadas
              </p>
            </div>
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400"
            >
              {isGenerating ? "Gerando..." : "Gerar Mensagens"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {messages.map((_, index) => (
                <TabsTrigger key={index} value={String(index)}>
                  {toneLabels[index]}
                </TabsTrigger>
              ))}
            </TabsList>
            {messages.map((message, index) => (
              <TabsContent key={index} value={String(index)} className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    {toneDescriptions[index]}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(message, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {messages.length > 0 && (
          <div className="flex justify-center pt-4 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Gerando..." : "Gerar Novas Mensagens"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
