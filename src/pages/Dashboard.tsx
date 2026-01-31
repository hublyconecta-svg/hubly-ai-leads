import { useAuth } from "@/integrations/supabase/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
const DashboardPage = () => {
  const {
    user
  } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const {
    data: campaigns,
    isLoading: loadingCampaigns
  } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("campaigns").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const {
    data: leads,
    isLoading: loadingLeads
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("leads").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const activeCampaigns = campaigns?.filter(c => c.status === "active").length ?? 0;
  const leadsCount = leads?.length ?? 0;

  // Contar leads por status para o funil
  const leadsByStatus = {
    new: leads?.filter(l => l.status === "new").length ?? 0,
    contacted: leads?.filter(l => l.status === "contacted").length ?? 0,
    qualified: leads?.filter(l => l.status === "qualified").length ?? 0,
    negotiation: leads?.filter(l => l.status === "negotiation").length ?? 0,
    won: leads?.filter(l => l.status === "won").length ?? 0,
    lost: leads?.filter(l => l.status === "lost").length ?? 0
  };
  const funnelStages = [{
    label: "Novos",
    count: leadsByStatus.new,
    color: "bg-gray-500"
  }, {
    label: "Contatados",
    count: leadsByStatus.contacted,
    color: "bg-blue-500"
  }, {
    label: "Qualificados",
    count: leadsByStatus.qualified,
    color: "bg-green-500"
  }, {
    label: "Negociação",
    count: leadsByStatus.negotiation,
    color: "bg-yellow-500"
  }, {
    label: "Ganhos",
    count: leadsByStatus.won,
    color: "bg-emerald-500"
  }];
  const totalActive = leadsByStatus.new + leadsByStatus.contacted + leadsByStatus.qualified + leadsByStatus.negotiation;

  // Preparar dados para gráfico de evolução temporal
  const leadsTimeline = leads?.reduce((acc, lead) => {
    const date = new Date(lead.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        date,
        count: 1
      });
    }
    return acc;
  }, [] as {
    date: string;
    count: number;
  }[]) || [];

  // Agrupar leads por campanha e calcular taxa de conversão
  const campaignStats = campaigns?.map(campaign => {
    const campaignLeads = leads?.filter(l => l.campaign_id === campaign.id) || [];
    const total = campaignLeads.length;
    const won = campaignLeads.filter(l => l.status === "won").length;
    const qualified = campaignLeads.filter(l => l.status === "qualified").length;
    const conversionRate = total > 0 ? (won / total * 100).toFixed(1) : "0";
    const qualificationRate = total > 0 ? (qualified / total * 100).toFixed(1) : "0";
    return {
      name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + "..." : campaign.name,
      leads: total,
      won,
      qualified,
      conversionRate: parseFloat(conversionRate),
      qualificationRate: parseFloat(qualificationRate)
    };
  }).filter(c => c.leads > 0) || [];

  // Preparar dados de comparação por status ao longo do tempo
  const statusTimeline = leads?.reduce((acc, lead) => {
    const date = new Date(lead.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing[lead.status] = (existing[lead.status] || 0) + 1;
    } else {
      acc.push({
        date,
        [lead.status]: 1,
        new: 0,
        contacted: 0,
        qualified: 0,
        negotiation: 0,
        won: 0,
        lost: 0
      });
    }
    return acc;
  }, [] as any[]) || [];
  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const periodLabel = period === "7d" ? "7 dias" : period === "30d" ? "30 dias" : "90 dias";
  return <div className="min-h-screen px-4 pb-10 pt-8 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-5 animate-fade-in">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-start">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.32em] text-muted-foreground/80">
                HUBLY • AI FUNIL 2026
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground font-bold">
                Bem-vindo{user?.email ? `, ${user.email}` : ""}. Acompanhe a
                performance das suas campanhas e do funil de leads em tempo
                real.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <Button asChild size="lg" className="hover-scale min-w-[200px] justify-center rounded-full px-8 text-sm font-semibold shadow-lg shadow-primary/40">
                <a href="/campanhas/nova">Nova campanha</a>
              </Button>
              <Button variant="outline" size="lg" asChild className="hover-scale min-w-[200px] justify-center rounded-full border-primary/40 px-8 text-sm">
                <a href="/leads">Ver leads</a>
              </Button>
            </div>
          </div>

          <div className="flex-wrap gap-3 text-sm text-muted-foreground flex items-center justify-start">
            <span className="text-xs font-medium uppercase tracking-[0.18em]">
              Período
            </span>
            <div className="flex gap-1 rounded-full border border-primary/30 bg-background/40 p-1 shadow-sm shadow-primary/30">
              {(["7d", "30d", "90d"] as const).map(p => <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" className={period === p ? "rounded-full px-5 text-xs" : "rounded-full px-4 text-xs text-muted-foreground hover:bg-primary/10"} onClick={() => setPeriod(p)}>
                  {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
                </Button>)}
            </div>
            <span className="ml-auto text-[11px] text-muted-foreground/70">
              Visualizando últimos {periodLabel}
            </span>
          </div>
        </header>

        <main className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="glass-card animate-fade-in">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70 mx-[5px] px-[5px] font-extrabold">
                       Leads gerados
            </p>
            <p className="mt-3 font-mono text-3xl font-semibold text-primary mx-[5px]">
              {loadingLeads ? "..." : leadsCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground mx-[5px]">
              {leadsCount === 0 ? "Crie sua primeira campanha" : "Total de leads cadastrados"}
            </p>
          </div>
          <div className="glass-card animate-fade-in [animation-delay:60ms]">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70 mx-[5px] px-[5px] font-extrabold">
              Campanhas ativas
            </p>
            <p className="mt-3 font-mono text-3xl font-semibold text-secondary mx-[5px]">
              {loadingCampaigns ? "..." : activeCampaigns}
            </p>
            <p className="mt-1 text-xs text-muted-foreground mx-[5px]">
              Campanhas com leads em andamento
            </p>
          </div>
        </main>

        {/* Funil de vendas */}
        {totalActive > 0 && <section className="glass-card mt-4 animate-fade-in">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground mx-[10px]">
                  Funil de vendas
                </h2>
                <p className="text-xs text-muted-foreground/80 mx-[5px] px-[5px]">
                  Distribuição dos leads por estágio ativo
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-primary shadow-[0_0_18px_rgba(192,132,252,0.65)]">
                Ativos {totalActive}
              </span>
            </div>

            <div className="space-y-4">
              {funnelStages.map(stage => {
            const percentage = totalActive > 0 ? stage.count / totalActive * 100 : 0;
            const width = Math.max(percentage, 5);
            return <div key={stage.label} className="group">
                    <div className="mb-1 text-xs sm:text-sm flex-row flex items-start justify-between">
                      <span className="font-medium text-foreground/90">
                        {stage.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-background/40 px-2 py-0.5 text-[11px] text-muted-foreground shadow-[0_0_14px_rgba(15,23,42,0.9)]">
                        <span className="font-mono text-[11px] text-primary">
                          {stage.count}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">
                          {percentage.toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-xl bg-muted/40">
                      <div className="h-full rounded-xl bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400 text-[11px] font-semibold text-primary-foreground shadow-[0_0_30px_rgba(192,132,252,0.65)] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(192,132,252,0.8)] flex-row flex items-center justify-center" style={{
                  width: `${width}%`
                }}>
                        {stage.count > 0 && <span className="mr-3 font-mono">
                            {stage.count}
                            <span className="ml-1 text-[10px] opacity-70">leads</span>
                          </span>}
                      </div>
                    </div>
                  </div>;
          })}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground/90">
              <p>
                <span className="font-semibold text-destructive">
                  {leadsByStatus.lost} leads perdidos
                </span>{" "}
                não são contabilizados no funil.
              </p>
              <span className="hidden rounded-full border border-destructive/50 bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive shadow-[0_0_18px_rgba(248,113,113,0.5)] sm:inline-flex">
                Risco
              </span>
            </div>
          </section>}

        {/* Gráficos principais */}
        {(leadsTimeline.length > 0 || campaignStats.length > 0) && <section className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Gráfico de evolução de leads ao longo do tempo */}
            {leadsTimeline.length > 0 && <div className="glass-card animate-fade-in [animation-delay:180ms] h-full">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground px-[5px] mx-[5px]">
                  Evolução de leads
                  <span className="ml-1 text-sm text-muted-foreground">
                    ({periodLabel})
                  </span>
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={leadsTimeline.slice(-periodDays)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" />
                    <XAxis dataKey="date" className="text-xs text-muted-foreground" tick={{
                fill: "hsl(var(--muted-foreground))"
              }} />
                    <YAxis className="text-xs text-muted-foreground" tick={{
                fill: "hsl(var(--muted-foreground))"
              }} />
                    <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 20px 50px rgba(15,23,42,0.7)"
              }} />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Leads gerados" stroke="hsl(var(--primary))" strokeWidth={2} dot={{
                fill: "hsl(var(--primary))"
              }} activeDot={{
                r: 6,
                stroke: "hsl(var(--secondary))",
                strokeWidth: 2
              }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>}

            {/* Gráfico de taxa de conversão por campanha */}
            {campaignStats.length > 0 && <div className="glass-card animate-fade-in [animation-delay:220ms] h-full">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground mx-[5px] px-[5px]">
                  Performance por campanha
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={campaignStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" />
                    <XAxis dataKey="name" className="text-xs text-muted-foreground" tick={{
                fill: "hsl(var(--muted-foreground))"
              }} />
                    <YAxis className="text-xs text-muted-foreground" tick={{
                fill: "hsl(var(--muted-foreground))"
              }} />
                    <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 20px 50px rgba(15,23,42,0.7)"
              }} />
                    <Legend />
                    <Bar dataKey="leads" name="Total de leads" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="qualified" name="Qualificados" fill="hsl(var(--chart-4))" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="won" name="Ganhos" fill="hsl(var(--chart-5))" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Tabela de taxas de conversão */}
                <div className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-background/40">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Campanha</th>
                        <th className="px-4 py-2 text-center font-medium">Leads</th>
                        <th className="px-4 py-2 text-center font-medium">
                          Taxa Qualif.
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Taxa Conversão
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignStats.map((stat, i) => <tr key={i} className="border-t border-border/70">
                          <td className="px-4 py-2">{stat.name}</td>
                          <td className="px-4 py-2 text-center font-mono text-xs">
                            {stat.leads}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.45)]">
                              {stat.qualificationRate}%
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary shadow-[0_0_18px_rgba(192,132,252,0.5)]">
                              {stat.conversionRate}%
                            </span>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>}
          </section>}

        {/* Gráfico de distribuição de status ao longo do tempo */}
        {statusTimeline.length > 0 && <section className="glass-card animate-fade-in [animation-delay:260ms] mt-6 mx-[5px] px-[5px]">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground mx-[5px] px-[5px]">
              Distribuição de status ao longo do tempo
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statusTimeline.slice(-periodDays)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" />
                <XAxis dataKey="date" className="text-xs text-muted-foreground" tick={{
              fill: "hsl(var(--muted-foreground))"
            }} />
                <YAxis className="text-xs text-muted-foreground" tick={{
              fill: "hsl(var(--muted-foreground))"
            }} />
                <Tooltip contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 20px 50px rgba(15,23,42,0.7)"
            }} />
                <Legend />
                <Line type="monotone" dataKey="new" name="Novos" stroke="#9ca3af" strokeWidth={2} />
                <Line type="monotone" dataKey="contacted" name="Contatados" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="qualified" name="Qualificados" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="negotiation" name="Negociação" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="won" name="Ganhos" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>}
      </div>
    </div>;
};
export default DashboardPage;