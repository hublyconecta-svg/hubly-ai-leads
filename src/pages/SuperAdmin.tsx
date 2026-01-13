import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

export default function SuperAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sendMagicLink, setSendMagicLink] = useState(true);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        "https://wkpvmnrmsjsubhdupzec.supabase.co/functions/v1/admin-list-users",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch users");
      }

      return response.json() as Promise<User[]>;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (payload: { email: string; password?: string; send_magic_link: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        "https://wkpvmnrmsjsubhdupzec.supabase.co/functions/v1/admin-create-user",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
        description: sendMagicLink 
          ? "Um link mágico foi enviado para o e-mail do usuário."
          : "O usuário foi criado e pode fazer login.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsDialogOpen(false);
      setEmail("");
      setPassword("");
      setSendMagicLink(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!email) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      email,
      password: sendMagicLink ? undefined : password,
      send_magic_link: sendMagicLink,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/40 to-slate-900/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6 border-l-4 border-primary">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              Painel Super Admin
            </h1>
          </div>
          <p className="text-muted-foreground">
            Somente você tem acesso. Aqui você gerencia quem pode usar o Hubly.
          </p>
        </div>

        {/* Create User Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400 hover:opacity-90">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-primary/20">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema. Você pode enviar um link mágico ou definir uma senha.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="magic-link"
                    checked={sendMagicLink}
                    onCheckedChange={setSendMagicLink}
                  />
                  <Label htmlFor="magic-link">Enviar link mágico</Label>
                </div>
                {!sendMagicLink && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite uma senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                  className="bg-gradient-to-r from-primary to-cyan-400"
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead>E-mail</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Último acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="border-primary/10">
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.roles.includes("admin") && (
                          <Badge className="bg-gradient-to-r from-primary to-fuchsia-500 shadow-[0_0_15px_rgba(192,132,252,0.5)]">
                            ADMIN
                          </Badge>
                        )}
                        {user.roles.includes("user") && (
                          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                            USER
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
