import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
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
  toneLabels,
  updateOfferStatus,
  type OfferStatus,
} from "@/data/offers";
import { getUserDisplayName, useAuth } from "@/lib/auth-context";
import { useState } from "react";

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
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
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
      toast.success(`Status zmieniono na: ${status === "sent" ? "Wysłana" : status === "accepted" ? "Zaakceptowana" : "Odrzucona"}.`);
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
  const disabled = workingAction !== null;

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/offers">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Wróć do historii
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled || offer.status === "sent"}
            onClick={() => changeStatus("sent")}
          >
            {workingAction === "sent" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {offer.status === "sent" ? "Oznaczona jako wysłana" : "Oznacz jako wysłaną"}
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
            {offer.industry && <dd className="text-muted-foreground">{offer.industry}</dd>}
            {offer.clientEmail && <dd className="text-muted-foreground">{offer.clientEmail}</dd>}
          </div>
          <div>
            <dt className="text-muted-foreground">Data utworzenia</dt>
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
              Poniżej przedstawiam propozycję współpracy przygotowaną dla {offer.client}. Dokument
              porządkuje problem, proponowaną usługę, zakres, termin i wycenę.
              {offer.tone ? ` Wybrany ton: ${toneLabels[offer.tone].toLowerCase()}.` : ""}
            </p>
          </Section>

          <Section title="Zrozumienie problemu">
            <p>{offer.problem}</p>
          </Section>

          <Section title="Proponowane rozwiązanie">
            <p>
              Proponowana usługa: <strong className="text-foreground">{offer.service}</strong>.
            </p>
          </Section>

          <Section title="Zakres prac">
            {scopeItems.length ? (
              <ul className="ml-5 list-disc space-y-1">
                {scopeItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Zakres nie został jeszcze uzupełniony.</p>
            )}
            {offer.notes && <p className="mt-3">Dodatkowe ustalenia: {offer.notes}</p>}
          </Section>

          <Section title="Harmonogram">
            <p>
              {offer.deliveryTime
                ? `Przewidywany czas realizacji: ${offer.deliveryTime}.`
                : "Termin realizacji nie został jeszcze ustalony."}
            </p>
          </Section>

          <Section title="Cena">
            <p className="text-2xl font-bold text-foreground">{formatPrice(offer.price)}</p>
            {offer.price != null && <p className="mt-2">Cena obejmuje zakres opisany w tej ofercie.</p>}
          </Section>

          <Section title="Kolejne kroki">
            <ol className="ml-5 list-decimal space-y-1">
              <li>Zweryfikuj zakres, cenę i termin.</li>
              <li>Przekaż ofertę klientowi wybranym kanałem.</li>
              <li>Zmień status w aplikacji po wysłaniu oraz po decyzji klienta.</li>
            </ol>
          </Section>
        </div>

        <Separator className="my-8" />

        <footer className="text-sm text-muted-foreground">
          <p>{providerName}{user?.email ? ` · ${user.email}` : ""}</p>
        </footer>
      </article>
    </AppLayout>
  );
}
