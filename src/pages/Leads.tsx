const LeadsPage = () => {
  const leads = [
    {
      company: "Atlas Consultoria Estratégica",
      website: "https://atlasconsultoria.com.br",
      score: 9.2,
      status: "Qualificado",
    },
    {
      company: "Clinic Odonto BH",
      website: "https://clinicodontobh.com.br",
      score: 7.8,
      status: "Contatar",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Esta é uma tabela de exemplo. Depois vamos conectar aos dados reais do Supabase.
          </p>
        </header>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Empresa</th>
                <th className="px-4 py-2 text-left font-medium">Site</th>
                <th className="px-4 py-2 text-left font-medium">Score IA</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.company} className="border-t border-border/60">
                  <td className="px-4 py-2">{lead.company}</td>
                  <td className="px-4 py-2">
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      {lead.website.replace("https://", "")}
                    </a>
                  </td>
                  <td className="px-4 py-2">{lead.score}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;
