import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { useOffers, useProfile, useSetOfferStatus } from "@/hooks/use-offers";
import { formatDate, formatPrice, isOfferComplete, toneLabels } from "@/data/offers";

export const Route = createFileRoute("/offers/$id")({
  head: () => ({
    meta: [
      { title: "Podgląd oferty — AI Oferta" },
      { name: "description", content: "Profesjonalny podgląd wygenerowanej oferty dla klienta." },
      { property: "og:title", content: "Podgląd oferty — AI Oferta" },
      { property: "og:description", content: "Pełna treść oferty gotowa do wysyłki." },
    ],
  }),
  component: OfferDetail,
  notFoundComponent: OfferNotFound,
});

function OfferNotFound() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold">Nie znaleziono oferty</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Oferta mogła zostać usunięta lub adres jest nieprawidłowy.
      </p>
      <Button asChild className="mt-6">
        <Link to="/offers">Wróć do historii</Link>
      </Button>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function OfferDetail() {
  const { id } = Route.useParams();
  const { data: offers = [], isLoading, error } = useOffers();
  const { data: profile } = useProfile();
  const setStatus = useSetOfferStatus();
  const navigate = useNavigate();
  const offer = offers.find((o) => o.id === id);

  if (isLoading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Ładowanie oferty…</p>
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout>
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      </AppLayout>
    );
  }
  if (!offer) return <OfferNotFound />;
  const providerName = profile?.company_name || profile?.full_name || "Twoja firma";

  const validUntil = new Date(offer.createdAt);
  validUntil.setDate(validUntil.getDate() + 30);

  const scopeItems = (offer.scope ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <AppLayout>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/offers">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Wróć do historii
          </Link>
        </Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            disabled={offer.status === "sent" || setStatus.isPending}
            onClick={async () => {
              if (!isOfferComplete(offer)) {
                toast.error("Uzupełnij zakres, cenę, czas realizacji i ton przed wysłaniem.");
                return;
              }
              try {
                await setStatus.mutateAsync({ id: offer.id, status: "sent" });
                toast.success("Oferta została oznaczona jako wysłana.");
              } catch (statusError) {
                toast.error(
                  statusError instanceof Error
                    ? statusError.message
                    : "Nie udało się zmienić statusu.",
                );
              }
            }}
          >
            <Check className="size-4" aria-hidden="true" />
            {offer.status === "sent" ? "Już wysłana" : "Oznacz jako wysłaną"}
          </Button>
        </div>
      </div>

      <article className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
        <header className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Oferta współpracy
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{providerName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Numer oferty: {offer.number}</p>
          </div>
          <StatusBadge status={offer.status} />
        </header>

        <Separator className="my-6" />

        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Klient</dt>
            <dd className="mt-1 font-medium">{offer.client}</dd>
            <dd className="text-muted-foreground">{offer.industry}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data wystawienia</dt>
            <dd className="mt-1 font-medium">{formatDate(offer.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Termin ważności</dt>
            <dd className="mt-1 font-medium">{formatDate(validUntil.toISOString())}</dd>
          </div>
        </dl>

        <Separator className="my-6" />

        <div className="space-y-7">
          <Section title="Wprowadzenie">
            <p>
              Dziękujemy za rozmowę i zaufanie. Poniżej przedstawiamy propozycję współpracy
              przygotowaną dla firmy {offer.client}. Dokument opisuje nasze rozumienie sytuacji,
              proponowane rozwiązanie, zakres prac oraz warunki realizacji. Ton oferty:{" "}
              {offer.tone ? toneLabels[offer.tone].toLowerCase() : "nie wybrano"}.
            </p>
          </Section>

          <Section title="Zrozumienie problemu">
            <p>{offer.problem}</p>
            <p className="mt-2">
              Na podstawie naszych doświadczeń w branży{" "}
              {(offer.industry || "klienta").toLowerCase()} widzimy, że takie sytuacje najczęściej
              wynikają z braku jednego uporządkowanego procesu. Naszym celem jest usunięcie tej
              przeszkody w sposób możliwie prosty dla Państwa zespołu.
            </p>
          </Section>

          <Section title="Proponowane rozwiązanie">
            <p>
              Proponujemy realizację usługi:{" "}
              <strong className="text-foreground">{offer.service}</strong>. Rozwiązanie projektujemy
              tak, aby odpowiadało bezpośrednio na opisany problem i było gotowe do samodzielnego
              utrzymania po zakończeniu prac.
            </p>
          </Section>

          <Section title="Zakres prac">
            <ul className="ml-5 list-disc space-y-1">
              {scopeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {offer.notes && <p className="mt-3">Dodatkowe ustalenia: {offer.notes}</p>}
          </Section>

          <Section title="Harmonogram">
            <p>
              Przewidywany czas realizacji:{" "}
              <strong className="text-foreground">{offer.deliveryTime || "do ustalenia"}</strong> od
              momentu akceptacji oferty. Prace dzielimy na trzy etapy: analiza i ustalenia,
              realizacja oraz przekazanie wraz z krótkim szkoleniem.
            </p>
          </Section>

          <Section title="Cena">
            <p className="text-2xl font-bold text-foreground">{formatPrice(offer.price)} netto</p>
            <p className="mt-2">
              Wynagrodzenie obejmuje pełny zakres prac opisany powyżej. Płatność w dwóch transzach:
              50% na start i 50% po odbiorze.
            </p>
          </Section>

          <Section title="Warunki współpracy">
            <p>
              Oferta jest ważna do {formatDate(validUntil.toISOString())}. Wszelkie prace
              wykraczające poza opisany zakres wyceniamy osobno przed rozpoczęciem. Przekazujemy
              pełne prawa do wykonanych materiałów po uregulowaniu płatności.
            </p>
          </Section>

          <Section title="Kolejne kroki">
            <ol className="ml-5 list-decimal space-y-1">
              <li>Akceptacja oferty i ustalenie terminu startu.</li>
              <li>Spotkanie wprowadzające oraz przekazanie materiałów.</li>
              <li>Rozpoczęcie prac zgodnie z harmonogramem.</li>
            </ol>
          </Section>
        </div>

        <Separator className="my-8" />

        <footer className="text-sm text-muted-foreground">
          <p>{providerName}</p>
        </footer>
      </article>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate({ to: "/offers" })}>
          Wróć do historii
        </Button>
      </div>
    </AppLayout>
  );
}
