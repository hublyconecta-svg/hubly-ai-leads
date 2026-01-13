import { Button } from "@/components/ui/button";

const UpgradePage = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Upgrade de plano</h1>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá contratar o plano Pro diretamente por aqui. Por enquanto, use o plano Free para
            testar o canal.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Plano Pro (R$ 99/mês)</p>
          <ul className="text-xs text-muted-foreground">
            <li>· Até 500 leads/mês (planejado)</li>
            <li>· Score de fit avançado</li>
            <li>· Mensagens personalizadas salvas por lead</li>
          </ul>
          <Button className="mt-2" variant="outline" asChild>
            <a href="mailto:contato@hubly.app?subject=Quero%20o%20plano%20Pro%20Hubly">
              Falar com o time sobre o plano Pro
            </a>
          </Button>
        </section>
      </div>
    </div>
  );
};

export default UpgradePage;
