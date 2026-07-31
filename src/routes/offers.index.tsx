import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { OffersList } from "@/components/offers-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOffers } from "@/hooks/use-offers";
import type { OfferStatus } from "@/data/offers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/offers/")({
  head: () => ({
    meta: [
      { title: "Historia ofert — AI Oferta" },
      { name: "description", content: "Przeglądaj i wyszukuj wszystkie zapisane oferty." },
      { property: "og:title", content: "Historia ofert — AI Oferta" },
      { property: "og:description", content: "Wszystkie oferty z filtrem statusu i wyszukiwarką." },
    ],
  }),
  component: OffersHistory,
});

const filters: { value: OfferStatus | "all"; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "draft", label: "Szkic" },
  { value: "ready", label: "Gotowa" },
  { value: "sent", label: "Wysłana" },
  { value: "accepted", label: "Zaakceptowana" },
  { value: "rejected", label: "Odrzucona" },
];

function OffersHistory() {
  const { data: offers = [], isLoading, error, refetch } = useOffers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OfferStatus | "all">("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const matchesQuery =
        !normalizedQuery ||
        offer.client.toLowerCase().includes(normalizedQuery) ||
        offer.service.toLowerCase().includes(normalizedQuery) ||
        offer.clientEmail.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || offer.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [offers, query, status]);

  return (
    <AppLayout>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Historia ofert</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wszystkie zapytania i oferty zapisane na Twoim koncie.
          </p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link to="/offers/new">
            <PlusCircle className="size-4" aria-hidden="true" />
            Nowa oferta
          </Link>
        </Button>
      </header>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="szukaj">Szukaj</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="szukaj"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Klient, usługa lub e-mail"
              className="pl-9"
            />
          </div>
        </div>

        <div role="group" aria-label="Filtr statusu" className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                status === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Pobieranie historii…
        </div>
      ) : error ? (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
          <p className="font-medium text-destructive">Nie udało się pobrać ofert.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Sprawdź połączenie z Supabase."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
            Znaleziono {filtered.length} z {offers.length} ofert.
          </p>
          <div className="mt-4">
            <OffersList
              offers={filtered}
              actionLabel="Zobacz ofertę"
              emptyMessage={
                offers.length === 0
                  ? "Nie masz jeszcze żadnych ofert. Utwórz pierwszą ofertę, aby rozpocząć pracę."
                  : "Brak ofert spełniających wybrane kryteria."
              }
            />
          </div>
        </>
      )}
    </AppLayout>
  );
}
