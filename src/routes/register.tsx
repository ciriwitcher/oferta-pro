import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-layout";
import { assertSupabaseConfigured, supabase } from "@/lib/supabase";

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
}: React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...props}
      />
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("full_name") ?? "").trim();
    const companyName = String(data.get("company_name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    const next: Record<string, string> = {};
    if (!fullName) next.full_name = "Podaj imię i nazwisko.";
    if (!email) next.email = "Podaj adres e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Podaj poprawny adres e-mail.";
    if (password.length < 8) next.password = "Hasło musi mieć co najmniej 8 znaków.";
    if (confirm !== password) next.confirm = "Hasła muszą być takie same.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setIsSubmitting(true);
    try {
      assertSupabaseConfigured();
      const { data: result, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, company_name: companyName || null },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (result.session) {
        toast.success("Konto zostało utworzone.");
        navigate({ to: "/dashboard" });
      } else {
        setConfirmationSent(true);
        toast.success("Sprawdź pocztę i potwierdź adres e-mail.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się utworzyć konta.");
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
          <h1 className="text-2xl font-bold">Utwórz konto</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dane będą bezpiecznie zapisane na Twoim koncie.
          </p>
          {confirmationSent && (
            <div
              role="status"
              className="mt-5 rounded-lg border border-primary/30 bg-accent p-4 text-sm"
            >
              Konto zostało utworzone. Sprawdź skrzynkę pocztową i kliknij link potwierdzający, a
              następnie zaloguj się.
            </div>
          )}
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            <Field
              id="full_name"
              name="full_name"
              label="Imię i nazwisko"
              placeholder="Jan Kowalski"
              autoComplete="name"
              error={errors.full_name}
            />
            <Field
              id="company_name"
              name="company_name"
              label="Nazwa firmy (opcjonalnie)"
              placeholder="Twoja firma"
              autoComplete="organization"
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Tworzenie konta…" : "Utwórz konto"}
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
