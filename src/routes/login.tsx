import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-layout";
import { useAuth } from "@/lib/auth-context";
import { supabaseConfigError } from "@/lib/supabase";

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
  const { signIn, user, loading } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, navigate, user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const next: Record<string, string> = {};

    if (!email) next.email = "Podaj adres e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Podaj poprawny adres e-mail.";
    if (!password) next.password = "Podaj hasło.";

    setErrors(next);
    if (Object.keys(next).length || supabaseConfigError) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Zalogowano.");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      setFormError(
        message.includes("invalid login credentials") || message.includes("email not confirmed")
          ? message.includes("email not confirmed")
            ? "Adres e-mail nie został jeszcze potwierdzony. Otwórz link aktywacyjny wysłany po rejestracji."
            : "Nieprawidłowy e-mail lub hasło."
          : error instanceof Error
            ? error.message
            : "Nie udało się zalogować.",
      );
    } finally {
      setSubmitting(false);
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
            Uzyskaj dostęp do własnych zapytań, wycen i ofert.
          </p>

          {supabaseConfigError && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {supabaseConfigError}
            </p>
          )}

          {formError && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {formError}
            </p>
          )}

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
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Hasło</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Nie pamiętasz hasła?
                </Link>
              </div>
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
            <Button type="submit" className="w-full" disabled={submitting || Boolean(supabaseConfigError)}>
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? "Logowanie…" : "Zaloguj się"}
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
