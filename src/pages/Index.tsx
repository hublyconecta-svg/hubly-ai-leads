import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
              H
            </span>
            <span className="text-sm font-semibold tracking-tight text-muted-foreground">
              Hubly
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <a href="/auth">Entrar</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-24 py-16">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Prospecção B2B com IA focada no Brasil
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Encontre clientes ideais em minutos com agentes de IA.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                O Hubly usa buscas avançadas + IA para transformar consultas no Google em listas de leads
                qualificados, prontos para receber sua abordagem comercial.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="lg" className="border-border px-6" asChild>
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
            <div className="grid gap-4 text-xs text-muted-foreground sm:grid-cols-3 sm:text-sm">
              <div>
                <p className="font-medium text-foreground">Leads qualificados</p>
                <p>Score de interesse gerado por IA para priorizar quem abordar.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Contexto rico</p>
                <p>Resumo automático do site e principais sinais de fit.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Mensagens prontas</p>
                <p>Gere abordagens personalizadas em 1 clique para email ou WhatsApp.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_60%),_radial-gradient(circle_at_bottom,_hsl(var(--accent)/0.12),_transparent_55%)]" />
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Resumo de prospecção</p>
                  <p className="text-sm font-semibold">Consultorias em São Paulo</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  Rodando IA
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Leads encontrados</p>
                  <p className="text-lg font-semibold">128</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Últimos 7 dias</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Fit ideal</p>
                  <p className="text-lg font-semibold text-emerald-400">76%</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Score médio de IA</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Tempo ganho</p>
                  <p className="text-lg font-semibold">6h</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">vs. prospecção manual</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Leads em destaque</p>
                <div className="space-y-1 rounded-xl border border-border/80 bg-background/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">Atlas Consultoria Estratégica</p>
                      <p className="truncate text-[11px] text-muted-foreground">atlasconsultoria.com.br · São Paulo, SP</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      Score 9.2
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed">
                    Empresa focada em growth B2B. Site com forte destaque para expansão comercial e novos canais.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Consultoria</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Ticket médio alto</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">São Paulo</span>
                  </div>
                </div>
                <div className="space-y-1 rounded-xl border border-dashed border-border/70 bg-background/40 p-3">
                  <p className="text-[11px] font-medium text-foreground">Mensagem gerada pela IA</p>
                  <p className="text-[11px] leading-relaxed">
                    “Notei que a Atlas está em um momento forte de expansão B2B. Posso te mostrar como nossos fluxos de
                    prospecção automatizada estão ajudando consultorias em SP a gerar reuniões qualificadas toda semana.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Como o Hubly funciona</h2>
            <p className="text-sm text-muted-foreground">
              Em poucos minutos você sai de uma ideia de público-alvo para uma lista de leads qualificados, com contexto
              e mensagem sugerida.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-card p-4 text-left">
              <p className="text-xs font-semibold text-primary">Passo 1</p>
              <h3 className="mt-2 text-sm font-semibold">Descreva quem você quer atingir</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Digite buscas como “clínicas odontológicas em BH” ou “empresas SaaS B2B até 100 funcionários em SP”.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 text-left">
              <p className="text-xs font-semibold text-primary">Passo 2</p>
              <h3 className="mt-2 text-sm font-semibold">Deixe a IA qualificar para você</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                O Hubly analisa site, descrição e sinais públicos para entender se aquele lead tem fit com sua oferta.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 text-left">
              <p className="text-xs font-semibold text-primary">Passo 3</p>
              <h3 className="mt-2 text-sm font-semibold">Gere abordagens sob medida</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Para cada lead, você recebe sugestões de mensagens para email ou WhatsApp, prontas para copiar e usar.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Hubly. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Termos de uso
            </a>
            <a href="#" className="hover:text-foreground">
              Privacidade
            </a>
            <a href="#" className="hover:text-foreground">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
