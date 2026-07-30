import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-layout";
import { assertSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Zaloguj się — AI Oferta" },
      { name: "description", content: "Zaloguj się do AI Oferta i zarządzaj swoimi ofertami." },
      { property: "og:title", content: "Zaloguj się — AI Oferta" },
      { property: "og:description", content: "Dostęp do panelu ofert AI Oferta." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const next: Record<string, string> = {};
    if (!email) next.email = "Podaj adres e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Podaj poprawny adres e-mail.";
    if (!password) next.password = "Podaj hasło.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setIsSubmitting(true);
    try {
      assertSupabaseConfigured();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Zalogowano.");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zalogować.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mx-auto mb-8 flex w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">Zaloguj się</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Zaloguj się, aby przejść do swoich ofert.
          </p>
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jan@firma.pl"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logowanie…" : "Zaloguj się"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
