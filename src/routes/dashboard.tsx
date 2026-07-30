import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, PlusCircle, Send } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { OffersList } from "@/components/offers-list";
import { Button } from "@/components/ui/button";
import { useOffers, useProfile } from "@/hooks/use-offers";

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
  const { data: offers = [], isLoading, error } = useOffers();
  const { data: profile } = useProfile();
  const stats = [
    { label: "Wszystkie oferty", value: offers.length, icon: FileText },
    { label: "Szkice", value: offers.filter((o) => o.status === "draft").length, icon: PlusCircle },
    { label: "Wysłane", value: offers.filter((o) => o.status === "sent").length, icon: Send },
  ];

  return (
    <AppLayout>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Witaj ponownie, {profile?.company_name || profile?.full_name || "użytkowniku"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sprawdź status ofert i przygotuj kolejną propozycję dla klienta.
          </p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link to="/offers/new">
            <PlusCircle className="size-4" aria-hidden="true" />
            Utwórz nową ofertę
          </Link>
        </Button>
      </header>

      <section aria-labelledby="statystyki" className="mt-8">
        <h2 id="statystyki" className="sr-only">
          Statystyki
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <li key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums">{s.value}</p>
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
        {isLoading ? (
          <p className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Ładowanie ofert…
          </p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-card p-8 text-sm text-destructive"
          >
            Nie udało się pobrać ofert: {error.message}
          </p>
        ) : (
          <OffersList offers={offers.slice(0, 5)} />
        )}
      </section>
    </AppLayout>
  );
}
