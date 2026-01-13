import { z } from "zod";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.string().email("Informe um e-mail válido");

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas não conferem",
});

const magicLinkSchema = z.object({ email: emailSchema });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type MagicLinkValues = z.infer<typeof magicLinkSchema>;

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup" | "magic">(
    (searchParams.get("mode") as "login" | "signup" | "magic") || "login",
  );
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const magicForm = useForm<MagicLinkValues>({ resolver: zodResolver(magicLinkSchema), defaultValues: { email: "" } });

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    setLoading(false);

    if (error) {
      toast({
        title: "Não foi possível entrar",
        description: "Verifique seu e-mail e senha e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  const handleSignup = async (values: SignupValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada",
      description: "Enviamos um e-mail para confirmar seu acesso. Depois é só fazer login.",
    });
    setMode("login");
  };

  const handleMagicLink = async (values: MagicLinkValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setLoading(false);

    if (error) {
      toast({
        title: "Não foi possível enviar o link",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Link enviado",
      description: "Confira sua caixa de entrada para acessar com 1 clique.",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">HUBLY</p>
          <h1 className="text-xl font-semibold">Acesse sua conta</h1>
          <p className="text-xs text-muted-foreground">
            Entre com e-mail e senha, crie sua conta ou receba um link mágico.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-1 text-xs">
          <Button
            type="button"
            size="sm"
            variant={mode === "login" ? "default" : "ghost"}
            className="w-full"
            onClick={() => setMode("login")}
          >
            Entrar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "signup" ? "default" : "ghost"}
            className="w-full"
            onClick={() => setMode("signup")}
          >
            Criar conta
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "magic" ? "default" : "ghost"}
            className="w-full"
            onClick={() => setMode("magic")}
          >
            Link mágico
          </Button>
        </div>

        {mode === "login" && (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="voce@empresa.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="******" type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                Entrar
              </Button>
            </form>
          </Form>
        )}

        {mode === "signup" && (
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="voce@empresa.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="Mínimo 6 caracteres" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input placeholder="Repita a senha" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                Criar conta
              </Button>
            </form>
          </Form>
        )}

        {mode === "magic" && (
          <Form {...magicForm}>
            <form onSubmit={magicForm.handleSubmit(handleMagicLink)} className="space-y-4">
              <FormField
                control={magicForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="voce@empresa.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                Enviar link mágico
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
