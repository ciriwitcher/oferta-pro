import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-layout";
import { useAuth } from "@/lib/auth-context";
import { supabaseConfigError } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Ustaw nowe hasło — AI Oferta" },
      {
        name: "description",
        content: "Ustaw nowe hasło do konta AI Oferta.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, loading, recoveryMode, updateRecoveredPassword } = useAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setSessionChecked(true);
      return;
    }

    const timer = window.setTimeout(() => setSessionChecked(true), 1500);
    return () => window.clearTimeout(timer);
  }, [loading, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    const next: Record<string, string> = {};

    if (password.length < 8) next.password = "Hasło musi mieć co najmniej 8 znaków.";
    if (password !== confirm) next.confirm = "Hasła muszą być takie same.";

    setErrors(next);
    if (Object.keys(next).length || !user || supabaseConfigError) return;

    setSubmitting(true);
    try {
      await updateRecoveredPassword(password);
      setCompleted(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nie udało się ustawić nowego hasła. Poproś o nowy link.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold">Hasło zostało zmienione</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sesja odzyskiwania została zakończona. Możesz zalogować się przy użyciu nowego hasła.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Zaloguj się</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Sprawdzanie linku do zmiany hasła…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <KeyRound className="mx-auto size-12 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold">Link jest nieważny lub wygasł</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Link do zmiany hasła mógł już zostać użyty albo przekroczono jego czas ważności.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/forgot-password">Wyślij nowy link</Link>
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
          <h1 className="text-2xl font-bold">Ustaw nowe hasło</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Wprowadź nowe hasło do konta {user.email ? `przypisanego do ${user.email}` : ""}.
          </p>

          {!recoveryMode && (
            <p className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
              Sesja jest aktywna. Po zapisaniu nowego hasła zostaniesz wylogowany i zalogujesz się ponownie.
            </p>
          )}

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
              <Label htmlFor="password">Nowe hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
              />
              <p id="password-hint" className="text-xs text-muted-foreground">
                Minimum 8 znaków.
              </p>
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Powtórz nowe hasło</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? "confirm-error" : undefined}
              />
              {errors.confirm && (
                <p id="confirm-error" role="alert" className="text-sm text-destructive">
                  {errors.confirm}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting || Boolean(supabaseConfigError)}>
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? "Zapisywanie…" : "Ustaw nowe hasło"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
