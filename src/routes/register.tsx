import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-layout";
import { AuthFlowError, useAuth } from "@/lib/auth-context";
import { supabaseConfigError } from "@/lib/supabase";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Załóż konto — AI Oferta" },
      {
        name: "description",
        content: "Utwórz konto w AI Oferta i przygotuj pierwszą ofertę dla klienta.",
      },
      { property: "og:title", content: "Załóż konto — AI Oferta" },
      { property: "og:description", content: "Rejestracja w AI Oferta zajmuje chwilę." },
    ],
  }),
  component: RegisterPage,
});

function Field({
  id,
  label,
  hint,
  error,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string; hint?: string; error?: string }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} aria-describedby={describedBy || undefined} {...props} />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, resendSignupConfirmation, user, loading } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, navigate, user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    const next: Record<string, string> = {};

    if (!name) next.name = "Podaj imię, nazwę lub nazwę firmy.";
    if (!email) next.email = "Podaj adres e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Podaj poprawny adres e-mail.";
    if (password.length < 8) next.password = "Hasło musi mieć co najmniej 8 znaków.";
    if (confirm !== password) next.confirm = "Hasła muszą być takie same.";

    setErrors(next);
    if (Object.keys(next).length || supabaseConfigError) return;

    setSubmitting(true);
    try {
      const result = await signUp(name, email, password);
      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(email);
        setResendCooldown(60);
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      if (error instanceof AuthFlowError && error.code === "EMAIL_ALREADY_REGISTERED") {
        setFormError(
          "Konto z tym adresem e-mail już istnieje. Zaloguj się albo użyj opcji „Nie pamiętasz hasła?”.",
        );
      } else {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        setFormError(
          message.includes("already registered") || message.includes("user already registered")
            ? "Konto z tym adresem e-mail już istnieje. Zaloguj się albo zresetuj hasło."
            : error instanceof Error
              ? error.message
              : "Nie udało się utworzyć konta.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendConfirmation() {
    if (!confirmationEmail || resending || resendCooldown > 0) return;
    setResending(true);
    try {
      await resendSignupConfirmation(confirmationEmail);
      setResendCooldown(60);
      toast.success("Nowy link aktywacyjny został wysłany.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nie udało się ponownie wysłać linku aktywacyjnego.",
      );
    } finally {
      setResending(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold">Potwierdź adres e-mail</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Wysłaliśmy link aktywacyjny na <strong className="text-foreground">{confirmationEmail}</strong>.
            Sprawdź również folder Spam i Oferty. Link przekieruje Cię z powrotem do aplikacji.
          </p>

          <div className="mt-6 space-y-3">
            <Button asChild className="w-full">
              <Link to="/login">
                <Mail className="size-4" aria-hidden="true" />
                Przejdź do logowania
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resending || resendCooldown > 0}
              onClick={resendConfirmation}
            >
              {resending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
              {resending
                ? "Wysyłanie…"
                : resendCooldown > 0
                  ? `Wyślij ponownie za ${resendCooldown} s`
                  : "Wyślij link ponownie"}
            </Button>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold">Utwórz konto</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Każde konto ma własne, odseparowane zapytania i oferty.
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
            <div
              role="alert"
              className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p>{formError}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <Link to="/login" className="font-medium underline underline-offset-4">
                  Zaloguj się
                </Link>
                <Link to="/forgot-password" className="font-medium underline underline-offset-4">
                  Zresetuj hasło
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            <Field
              id="name"
              name="name"
              label="Imię i nazwisko lub nazwa firmy"
              placeholder="Studio Nova"
              autoComplete="organization"
              error={errors.name}
            />
            <Field
              id="email"
              name="email"
              type="email"
              label="Adres e-mail"
              placeholder="kontakt@studionova.pl"
              autoComplete="email"
              error={errors.email}
            />
            <Field
              id="password"
              name="password"
              type="password"
              label="Hasło"
              hint="Minimum 8 znaków."
              autoComplete="new-password"
              error={errors.password}
            />
            <Field
              id="confirm"
              name="confirm"
              type="password"
              label="Powtórz hasło"
              autoComplete="new-password"
              error={errors.confirm}
            />
            <Button type="submit" className="w-full" disabled={submitting || Boolean(supabaseConfigError)}>
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? "Tworzenie konta…" : "Utwórz konto"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
