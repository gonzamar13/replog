"use client";

import { Logo } from "@/components/app-nav";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
    // Si no hay error, el navegador ya está siendo redirigido a Google.
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading("email");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Cuenta creada. Revisá tu email para confirmarla.");
      }
    }
    setLoading(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <Logo className="text-3xl" />
        <p className="mt-2 text-sm text-muted">Track. Train. Progress.</p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleGoogle}
        disabled={loading !== null}
        className="w-full"
      >
        {loading === "google" ? "Abriendo Google…" : "Continuar con Google"}
      </Button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-[0.12em] text-faint">
          o con email
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="vos@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Contraseña">
          <Input
            type="password"
            required
            minLength={6}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-[13px] text-accent"
          >
            {message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading !== null}
          className="w-full"
        >
          {loading === "email"
            ? "Entrando…"
            : mode === "signin"
              ? "Entrar"
              : "Crear cuenta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setMessage(null);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
        className="mt-6 text-center text-[13px] text-faint transition-colors hover:text-muted"
      >
        {mode === "signin"
          ? "¿No tenés cuenta? Creála"
          : "¿Ya tenés cuenta? Entrá"}
      </button>
    </main>
  );
}
