import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { OfferForm, type OfferSaveStatus } from "@/components/offer-form";
import { Button } from "@/components/ui/button";
import { updateOffer, type NewOfferInput } from "@/data/offers";
import { useOffers } from "@/hooks/use-offers";

export const Route = createFileRoute("/offers/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edytuj ofertę — AI Oferta" },
      { name: "description", content: "Popraw dane klienta, zakres, cenę i warunki oferty." },
      { property: "og:title", content: "Edytuj ofertę — AI Oferta" },
      { property: "og:description", content: "Edycja zapisanej oferty." },
    ],
  }),
  component: EditOffer,
});

function EditOffer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading, error } = useOffers();
  const [savingMode, setSavingMode] = useState<OfferSaveStatus | null>(null);
  const offer = offers.find((item) => item.id === id);

  async function save(values: NewOfferInput, status: OfferSaveStatus) {
    if (!offer) return;

    setSavingMode(status);
    try {
      await updateOffer(offer.id, offer.leadId, values, status);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success(status === "draft" ? "Zmiany zapisano jako szkic." : "Oferta została zaktualizowana.");
      navigate({ to: "/offers/$id", params: { id: offer.id } });
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Nie udało się zapisać zmian.");
    } finally {
      setSavingMode(null);
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

  if (error || !offer) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold">Nie można edytować oferty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Oferta nie istnieje albo nie należy do zalogowanego użytkownika."}
        </p>
        <Button asChild className="mt-6">
          <Link to="/offers">Wróć do historii</Link>
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/offers/$id" params={{ id: offer.id }}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Wróć do podglądu
        </Link>
      </Button>

      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Edycja {offer.number}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Popraw ofertę dla {offer.client}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Zmień zapytanie, zakres, wycenę albo warunki. Po zapisaniu wrócisz do aktualnego podglądu dokumentu.
        </p>
      </div>

      <OfferForm
        initialValues={offer}
        savingMode={savingMode}
        onSave={save}
        primaryLabel="Zapisz gotową ofertę"
      />
    </AppLayout>
  );
}
