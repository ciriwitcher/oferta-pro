import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PlusCircle, Search } from "lucide-react";
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

const filters: { value: OfferStatus | "wszystkie"; label: string }[] = [
  { value: "wszystkie", label: "Wszystkie" },
  { value: "draft", label: "Szkic" },
  { value: "ready", label: "Gotowa" },
  { value: "sent", label: "Wysłana" },
  { value: "accepted", label: "Zaakceptowana" },
  { value: "rejected", label: "Odrzucona" },
  { value: "archived", label: "Zarchiwizowana" },
];

function OffersHistory() {
  const { data: offers = [], isLoading, error } = useOffers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OfferStatus | "wszystkie">("wszystkie");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((o) => {
      const matchesQuery =
        !q || o.client.toLowerCase().includes(q) || o.service.toLowerCase().includes(q);
      const matchesStatus = status === "wszystkie" || o.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [offers, query, status]);

  return (
    <AppLayout>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Historia ofert</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wszystkie zapisane oferty wraz z ich statusem.
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nazwa klienta lub usługa"
              className="pl-9"
            />
          </div>
        </div>

        <div role="group" aria-label="Filtr statusu" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                status === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        Znaleziono {filtered.length} z {offers.length} ofert.
      </p>

      <div className="mt-4">
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
          <OffersList offers={filtered} actionLabel="Zobacz ofertę" />
        )}
      </div>
    </AppLayout>
  );
}
