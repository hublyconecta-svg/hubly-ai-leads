import { Button } from "@/components/ui/button";

const CampaignsPage = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Campanhas</h1>
            <p className="text-sm text-muted-foreground">
              Em breve você verá aqui todas as campanhas de prospecção criadas.
            </p>
          </div>
          <Button asChild>
            <a href="/campanhas/nova">Nova campanha</a>
          </Button>
        </header>

        <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
          Você ainda não tem campanhas. Clique em "Nova campanha" para criar sua primeira campanha (por enquanto,
          fluxo mock).
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
