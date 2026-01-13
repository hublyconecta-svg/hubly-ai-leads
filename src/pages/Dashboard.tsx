import { useAuth } from "@/integrations/supabase/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DashboardPage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const leadsCount = leads?.length ?? 0;

  // Contar leads por status para o funil
  const leadsByStatus = {
    new: leads?.filter((l) => l.status === "new").length ?? 0,
    contacted: leads?.filter((l) => l.status === "contacted").length ?? 0,
    qualified: leads?.filter((l) => l.status === "qualified").length ?? 0,
    negotiation: leads?.filter((l) => l.status === "negotiation").length ?? 0,
    won: leads?.filter((l) => l.status === "won").length ?? 0,
    lost: leads?.filter((l) => l.status === "lost").length ?? 0,
  };

  const funnelStages = [
    { label: "Novos", count: leadsByStatus.new, color: "bg-gray-500" },
    { label: "Contatados", count: leadsByStatus.contacted, color: "bg-blue-500" },
    { label: "Qualificados", count: leadsByStatus.qualified, color: "bg-green-500" },
    { label: "Negociação", count: leadsByStatus.negotiation, color: "bg-yellow-500" },
    { label: "Ganhos", count: leadsByStatus.won, color: "bg-emerald-500" },
  ];

  const totalActive = leadsByStatus.new + leadsByStatus.contacted + leadsByStatus.qualified + leadsByStatus.negotiation;

  // Preparar dados para gráfico de evolução temporal
  const leadsTimeline = leads?.reduce((acc, lead) => {
    const date = new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, [] as { date: string; count: number }[]) || [];

  // Agrupar leads por campanha e calcular taxa de conversão
  const campaignStats = campaigns?.map((campaign) => {
    const campaignLeads = leads?.filter((l) => l.campaign_id === campaign.id) || [];
    const total = campaignLeads.length;
    const won = campaignLeads.filter((l) => l.status === "won").length;
    const qualified = campaignLeads.filter((l) => l.status === "qualified").length;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0";
    const qualificationRate = total > 0 ? ((qualified / total) * 100).toFixed(1) : "0";

    return {
      name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + "..." : campaign.name,
      leads: total,
      won,
      qualified,
      conversionRate: parseFloat(conversionRate),
      qualificationRate: parseFloat(qualificationRate),
    };
  }).filter((c) => c.leads > 0) || [];

  // Preparar dados de comparação por status ao longo do tempo
  const statusTimeline = leads?.reduce((acc, lead) => {
    const date = new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const existing = acc.find((item) => item.date === date);
    
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
        lost: 0,
      });
    }
    return acc;
  }, [] as any[]) || [];

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const periodLabel = period === "7d" ? "7 dias" : period === "30d" ? "30 dias" : "90 dias";

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-6 animate-fade-in">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.32em] text-muted-foreground/80">HUBLY • AI FUNIL 2026</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bem-vindo{user?.email ? `, ${user.email}` : ""}. Acompanhe a performance das suas campanhas e do funil de leads em tempo real.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="hover-scale shadow-lg shadow-primary/40">
                <a href="/campanhas/nova">Nova campanha</a>
              </Button>
              <Button variant="outline" size="lg" asChild className="hover-scale">
                <a href="/leads">Ver leads</a>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-[0.18em]">Período</span>
            <div className="flex gap-1 rounded-full border border-primary/30 bg-background/40 p-1 shadow-sm shadow-primary/30">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  className={
                    period === p
                      ? "rounded-full px-4 text-xs"
                      : "rounded-full px-3 text-xs text-muted-foreground hover:bg-primary/10"
                  }
                  onClick={() => setPeriod(p)}
                >
                  {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
                </Button>
              ))}
            </div>
            <span className="ml-auto text-xs text-muted-foreground/70">Visualizando últimos {periodLabel}</span>
          </div>
        </header>

        <main className="grid gap-5 md:grid-cols-3">
          <div className="glass-card animate-fade-in">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Leads gerados</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-primary">
              {loadingLeads ? "..." : leadsCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {leadsCount === 0 ? "Crie sua primeira campanha" : "Total de leads cadastrados"}
            </p>
          </div>
          <div className="glass-card animate-fade-in [animation-delay:60ms]">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Campanhas ativas</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-secondary">
              {loadingCampaigns ? "..." : activeCampaigns}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Campanhas com leads em andamento</p>
          </div>
          <div className="glass-card animate-fade-in [animation-delay:120ms]">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Créditos</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-accent">50</p>
            <p className="mt-1 text-xs text-muted-foreground">Plano Free (mock)</p>
          </div>
        </main>

        {/* Funil de vendas */}
        {totalActive > 0 && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Funil de vendas</h2>
            <div className="space-y-3">
              {funnelStages.map((stage, index) => {
                const percentage = totalActive > 0 ? (stage.count / totalActive) * 100 : 0;
                return (
                  <div key={stage.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-muted-foreground">
                        {stage.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-lg bg-muted">
                      <div
                        className={`h-full ${stage.color} flex items-center justify-center text-xs font-medium text-white transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        {stage.count > 0 && stage.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg bg-muted/30 p-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-semibold text-red-600">{leadsByStatus.lost} leads perdidos</span> não são
                contabilizados no funil
              </p>
            </div>
          </section>
        )}

        {/* Gráfico de evolução de leads ao longo do tempo */}
        {leadsTimeline.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Evolução de leads ({periodLabel})</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadsTimeline.slice(-periodDays)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs text-muted-foreground"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs text-muted-foreground"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Leads gerados"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Gráfico de taxa de conversão por campanha */}
        {campaignStats.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Performance por campanha</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs text-muted-foreground"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs text-muted-foreground"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="leads" name="Total de leads" fill="hsl(var(--primary))" />
                <Bar dataKey="qualified" name="Qualificados" fill="hsl(142.1 76.2% 36.3%)" />
                <Bar dataKey="won" name="Ganhos" fill="hsl(142.1 70.6% 45.3%)" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Tabela de taxas de conversão */}
            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Campanha</th>
                    <th className="px-4 py-2 text-center font-medium">Leads</th>
                    <th className="px-4 py-2 text-center font-medium">Taxa Qualif.</th>
                    <th className="px-4 py-2 text-center font-medium">Taxa Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.map((stat, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="px-4 py-2">{stat.name}</td>
                      <td className="px-4 py-2 text-center">{stat.leads}</td>
                      <td className="px-4 py-2 text-center font-medium text-green-600">
                        {stat.qualificationRate}%
                      </td>
                      <td className="px-4 py-2 text-center font-medium text-primary">
                        {stat.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Gráfico de distribuição de status ao longo do tempo */}
        {statusTimeline.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Distribuição de status ao longo do tempo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statusTimeline.slice(-periodDays)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs text-muted-foreground"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs text-muted-foreground"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="new" name="Novos" stroke="#9ca3af" strokeWidth={2} />
                <Line type="monotone" dataKey="contacted" name="Contatados" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="qualified" name="Qualificados" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="negotiation" name="Negociação" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="won" name="Ganhos" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
