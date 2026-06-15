"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { LogIn, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("password");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.auth.getSession();
      if (data.session) router.replace("/dashboard");
    })();
  }, [router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const sb = getSupabase();
    if (!sb) {
      toast.error("Error de conexión con Supabase");
      setLoading(false);
      return;
    }

    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message === "Invalid login credentials") {
        toast.error("Email o contraseña incorrectos");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Inicio de sesión exitoso");
    router.push("/dashboard");
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const sb = getSupabase();
    if (!sb) { toast.error("Error de conexión"); setLoading(false); return; }
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Email rate limit exceeded"
        ? "Demasiados intentos. Esperá 1 minuto"
        : error.message);
    } else {
      toast.success("Magic link enviado a tu correo");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-background to-surface" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-gold/5 blur-[100px]" />

        <div className="relative w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary shadow-sm flex items-center justify-center">
                <span className="text-lg font-heading font-bold text-primary-foreground">P</span>
              </div>
            </div>
            <h1 className="text-xl font-heading font-bold tracking-tight">PAP Diagnóstico</h1>
            <p className="text-sm text-muted-foreground mt-1">Accedé a tu panel de gestión</p>
          </div>

          <Card className="border border-border/50 shadow-lg bg-card">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center">
                <LogIn className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base font-heading">
                {mode === "password" ? "Iniciar sesión" : "Magic link"}
              </CardTitle>
              <CardDescription className="text-xs">
                {mode === "password"
                  ? "Ingresá con tu email y contraseña"
                  : "Recibí un link mágico en tu correo"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-3">
              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input id="email" type="email" placeholder="tu@correo.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="h-10" autoFocus required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-medium text-muted-foreground">Contraseña</label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="h-10 pr-10" required />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl gap-1.5" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                    {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                  </Button>
                  <button type="button" onClick={() => setMode("magic")}
                    className="w-full text-xs text-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    ¿No tenés contraseña? Usá magic link
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email-magic" className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input id="email-magic" type="email" placeholder="tu@correo.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="h-10" autoFocus required />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl gap-1.5" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar magic link"}
                    {!loading && <Mail className="w-3.5 h-3.5" />}
                  </Button>
                  <button type="button" onClick={() => setMode("password")}
                    className="w-full text-xs text-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    ¿Ya tenés cuenta? Usá email + contraseña
                  </button>
                </form>
              )}

              <Separator className="my-1" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  ¿Sos un paciente?{" "}
                  <button onClick={() => router.push("/portal/paciente")}
                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer">
                    Accedé a tu resultado
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30">
        PAP Diagnóstico &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
