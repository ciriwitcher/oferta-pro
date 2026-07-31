import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Printer,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { useOffers } from "@/hooks/use-offers";
import {
  deleteOfferByLead,
  formatDate,
  formatPrice,
  updateOfferStatus,
  type OfferStatus,
} from "@/data/offers";
import { getUserDisplayName, useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/offers/$id")({
  head: () => ({
    meta: [
      { title: "Podgląd oferty — AI Oferta" },
      { name: "description", content: "Podgląd zapisanej oferty dla klienta." },
      { property: "og:title", content: "Podgląd oferty — AI Oferta" },
      { property: "og:description", content: "Zakres, wycena i status oferty w jednym miejscu." },
    ],
  }),
  component: OfferDetail,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 break-inside-avoid">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function statusMessage(status: OfferStatus) {
  if (status === "sent") return "Wysłana";
  if (status === "accepted") return "Zaakceptowana";
  if (status === "rejected") return "Odrzucona";
  return status;
}

function OfferDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: offers = [], isLoading, error } = useOffers();
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const offer = offers.find((item) => item.id === id);

  async function changeStatus(status: OfferStatus) {
    if (!offer) return;
    setWorkingAction(status);
    try {
      await updateOfferStatus(offer.id, status);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success(`Status zmieniono na: ${statusMessage(status)}.`);
    } catch (changeError) {
      toast.error(changeError instanceof Error ? changeError.message : "Nie udało się zmienić statusu.");
    } finally {
      setWorkingAction(null);
    }
  }

  async function removeOffer() {
    if (!offer) return;
    const confirmed = window.confirm(
      `Usunąć ofertę dla klienta „${offer.client}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setWorkingAction("delete");
    try {
      await deleteOfferByLead(offer.leadId);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Oferta została usunięta.");
      navigate({ to: "/offers" });
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Nie udało się usunąć oferty.");
    } finally {
      setWorkingAction(null);
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Pobieranie oferty…
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold">Nie udało się pobrać oferty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Sprawdź połączenie z Supabase."}
        </p>
        <Button asChild className="mt-6">
          <Link to="/offers">Wróć do historii</Link>
        </Button>
      </AppLayout>
    );
  }

  if (!offer) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold">Nie znaleziono oferty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Oferta nie istnieje albo nie należy do zalogowanego użytkownika.
        </p>
        <Button asChild className="mt-6">
          <Link to="/offers">Wróć do historii</Link>
        </Button>
      </AppLayout>
    );
  }

  const validUntil = new Date(offer.createdAt);
  validUntil.setDate(validUntil.getDate() + 30);
  const providerName = getUserDisplayName(user);
  const scopeItems = offer.scope
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const termsItems = offer.notes
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const disabled = workingAction !== null;
  const sentOrClosed = ["sent", "accepted", "rejected"].includes(offer.status);

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/offers">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Wróć do historii
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/offers/$id/edit" params={{ id: offer.id }}>
              <Pencil className="size-4" aria-hidden="true" />
              Edytuj
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Drukuj / PDF
          </Button>
          <Button
            size="sm"
            disabled={disabled || sentOrClosed}
            onClick={() => changeStatus("sent")}
          >
            {workingAction === "sent" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {sentOrClosed ? "Oferta wysłana" : "Oznacz jako wysłaną"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || offer.status === "accepted"}
            onClick={() => changeStatus("accepted")}
          >
            <ThumbsUp className="size-4" aria-hidden="true" />
            Zaakceptowana
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || offer.status === "rejected"}
            onClick={() => changeStatus("rejected")}
          >
            <ThumbsDown className="size-4" aria-hidden="true" />
            Odrzucona
          </Button>
          <Button size="sm" variant="destructive" disabled={disabled} onClick={removeOffer}>
            {workingAction === "delete" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
            Usuń
          </Button>
        </div>
      </div>

      <article className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card print:mt-0 print:border-0 print:p-0 print:shadow-none sm:p-10">
        <header className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Oferta współpracy
            </p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{offer.service || "Propozycja współpracy"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Przygotowana przez {providerName} dla {offer.client}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Numer oferty: {offer.number}</p>
          </div>
          <div className="print:hidden">
            <StatusBadge status={offer.status} />
          </div>
        </header>

        <Separator className="my-7" />

        <dl className="grid gap-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Klient</dt>
            <dd className="mt-2 font-semibold">{offer.client}</dd>
            {offer.industry && <dd className="mt-0.5 text-muted-foreground">{offer.industry}</dd>}
            {offer.clientEmail && <dd className="mt-0.5 text-muted-foreground">{offer.clientEmail}</dd>}
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data oferty</dt>
            <dd className="mt-2 font-semibold">{formatDate(offer.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ważna do</dt>
            <dd className="mt-2 font-semibold">{formatDate(validUntil.toISOString())}</dd>
          </div>
        </dl>

        <Separator className="my-7" />

        <div className="space-y-8">
          <Section title="Cel współpracy">
            <p>
              Dziękuję za przekazanie informacji dotyczących projektu. Poniższa propozycja porządkuje potrzeby,
              rekomendowane rozwiązanie, zakres odpowiedzialności, termin oraz koszt realizacji.
            </p>
          </Section>

          <Section title="Sytuacja i potrzeba klienta">
            <p className="whitespace-pre-line">{offer.problem}</p>
          </Section>

          <Section title="Proponowane rozwiązanie">
            <p>
              Rekomendowany projekt: <strong className="text-foreground">{offer.service}</strong>. Celem jest
              dostarczenie uzgodnionego rezultatu w ramach zakresu opisanego poniżej.
            </p>
          </Section>

          <Section title="Zakres i rezultaty">
            {scopeItems.length ? (
              <ul className="ml-5 list-disc space-y-1.5 marker:text-primary">
                {scopeItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Zakres nie został jeszcze uzupełniony.</p>
            )}
          </Section>

          <div className="grid gap-6 break-inside-avoid rounded-xl border border-border bg-secondary/40 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Termin realizacji</p>
              <p className="mt-2 font-semibold text-foreground">
                {offer.deliveryTime || "Do ustalenia"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cena całkowita</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatPrice(offer.price)}</p>
            </div>
          </div>

          <Section title="Warunki i założenia">
            {termsItems.length ? (
              <ul className="ml-5 list-disc space-y-1.5 marker:text-primary">
                {termsItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>
                Szczegółowe warunki płatności, materiały po stronie klienta, liczba rund poprawek oraz elementy
                niewchodzące w cenę należy potwierdzić przed rozpoczęciem realizacji.
              </p>
            )}
          </Section>

          <Section title="Kolejne kroki">
            <ol className="ml-5 list-decimal space-y-1.5 marker:font-semibold marker:text-primary">
              <li>Potwierdzenie zakresu, ceny i terminu realizacji.</li>
              <li>Akceptacja oferty oraz warunków rozpoczęcia prac.</li>
              <li>Przekazanie materiałów i rozpoczęcie projektu zgodnie z ustalonym harmonogramem.</li>
            </ol>
          </Section>
        </div>

        <Separator className="my-8" />

        <footer className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{providerName}</p>
          {user?.email && <p className="mt-1">{user.email}</p>}
        </footer>
      </article>
    </AppLayout>
  );
}
