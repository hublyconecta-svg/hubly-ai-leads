import { useAuth } from "@/integrations/supabase/AuthContext";

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Ajuste preferências da sua conta e integrações. Por enquanto é apenas uma página informativa.
          </p>
        </header>

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Conta</h2>
          <p className="text-xs text-muted-foreground">
            E-mail: <span className="font-mono">{user?.email ?? "desconhecido"}</span>
          </p>
        </section>

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Integrações</h2>
          <p className="text-xs text-muted-foreground">
            Aqui você poderá configurar sua chave da Serper API e outras integrações. Essa funcionalidade será
            adicionada em breve.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
