import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [
      { title: "Potwierdzanie konta — AI Oferta" },
      {
        name: "description",
        content: "Potwierdzenie adresu e-mail i aktywacja konta AI Oferta.",
      },
    ],
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const timer = window.setTimeout(() => navigate({ to: "/dashboard", replace: true }), 900);
      return () => window.clearTimeout(timer);
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (user) return;
    const timer = window.setTimeout(() => setTimedOut(true), 5000);
    return () => window.clearTimeout(timer);
  }, [user]);

  if (user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold">Konto zostało aktywowane</h1>
          <p className="mt-3 text-sm text-muted-foreground">Za chwilę przejdziesz do panelu aplikacji.</p>
          <Loader2 className="mx-auto mt-5 size-5 animate-spin text-primary" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!timedOut || loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Aktywowanie konta…
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <TriangleAlert className="mx-auto size-12 text-destructive" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-bold">Nie udało się aktywować konta</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Link mógł wygasnąć albo zostać wcześniej wykorzystany. Spróbuj się zalogować. Jeżeli konto nadal nie jest
          aktywne, zarejestruj adres ponownie i użyj przycisku wysłania nowego linku.
        </p>
        <div className="mt-6 grid gap-3">
          <Button asChild>
            <Link to="/login">Przejdź do logowania</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">Wróć do rejestracji</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
