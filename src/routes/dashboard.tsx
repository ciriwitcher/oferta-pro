import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Loader2, PlusCircle, Send } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { OffersList } from "@/components/offers-list";
import { Button } from "@/components/ui/button";
import { useOffers } from "@/hooks/use-offers";
import { getUserDisplayName, useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Oferta" },
      { name: "description", content: "Przegląd Twoich ofert: szkice, gotowe i wysłane." },
      { property: "og:title", content: "Dashboard — AI Oferta" },
      { property: "og:description", content: "Statystyki i ostatnie oferty w jednym miejscu." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: offers = [], isLoading, error, refetch } = useOffers();
  const stats = [
    { label: "Wszystkie oferty", value: offers.length, icon: FileText },
    { label: "Szkice", value: offers.filter((offer) => offer.status === "draft").length, icon: PlusCircle },
    { label: "Gotowe", value: offers.filter((offer) => offer.status === "ready").length, icon: CheckCircle2 },
    { label: "Wysłane", value: offers.filter((offer) => offer.status === "sent").length, icon: Send },
  ];

  return (
    <AppLayout>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Witaj, {getUserDisplayName(user)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dodaj zapytanie klienta, przygotuj wycenę i kontroluj status oferty.
          </p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link to="/offers/new">
            <PlusCircle className="size-4" aria-hidden="true" />
            Utwórz nową ofertę
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Pobieranie ofert…
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
          <h2 className="font-semibold text-destructive">Nie udało się pobrać danych</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Sprawdź konfigurację Supabase i spróbuj ponownie."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : offers.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-soft sm:p-12">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <FileText className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold">Nie masz jeszcze ofert</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Zacznij od prawdziwego zapytania klienta. Zapiszesz problem, zakres, cenę i termin w jednym miejscu.
          </p>
          <Button asChild className="mt-6">
            <Link to="/offers/new">Utwórz pierwszą ofertę</Link>
          </Button>
        </section>
      ) : (
        <>
          <section aria-labelledby="statystyki" className="mt-8">
            <h2 id="statystyki" className="sr-only">
              Statystyki
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <li key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <stat.icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tabular-nums">{stat.value}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="ostatnie" className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="ostatnie" className="text-lg font-semibold">
                Ostatnie oferty
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/offers">Zobacz wszystkie</Link>
              </Button>
            </div>
            <OffersList offers={offers.slice(0, 5)} />
          </section>
        </>
      )}
    </AppLayout>
  );
}
