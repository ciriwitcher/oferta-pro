import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-layout";
import { useAuth } from "@/lib/auth-context";
import { supabaseConfigError } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Odzyskaj hasło — AI Oferta" },
      {
        name: "description",
        content: "Wyślij bezpieczny link do ustawienia nowego hasła w AI Oferta.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    setFormError("");

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      setEmailError("Podaj adres e-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Podaj poprawny adres e-mail.");
      return;
    }
    if (supabaseConfigError) return;

    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSentEmail(email);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać wiadomości. Spróbuj ponownie później.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sentEmail) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold">Sprawdź skrzynkę e-mail</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Jeżeli konto z adresem <strong className="text-foreground">{sentEmail}</strong> istnieje,
            otrzymasz link do ustawienia nowego hasła. Sprawdź również folder Spam i Oferty.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">
              <Mail className="size-4" aria-hidden="true" />
              Wróć do logowania
            </Link>
          </Button>
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
          <h1 className="text-2xl font-bold">Odzyskaj hasło</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Podaj adres przypisany do konta. Wyślemy link prowadzący do bezpiecznej strony zmiany hasła.
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
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" role="alert" className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting || Boolean(supabaseConfigError)}>
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? "Wysyłanie…" : "Wyślij link do zmiany hasła"}
            </Button>
          </form>
        </div>

        <Button asChild variant="ghost" className="mx-auto mt-5 flex w-fit">
          <Link to="/login">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Wróć do logowania
          </Link>
        </Button>
      </div>
    </div>
  );
}
