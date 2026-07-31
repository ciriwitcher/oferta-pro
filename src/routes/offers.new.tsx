import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { OfferForm, type OfferSaveStatus } from "@/components/offer-form";
import { Button } from "@/components/ui/button";
import { createOffer, type NewOfferInput } from "@/data/offers";

export const Route = createFileRoute("/offers/new")({
  head: () => ({
    meta: [
      { title: "Nowa oferta — AI Oferta" },
      { name: "description", content: "Zapisz zapytanie klienta i przygotuj uporządkowaną ofertę." },
      { property: "og:title", content: "Nowa oferta — AI Oferta" },
      { property: "og:description", content: "Formularz tworzenia oferty w AI Oferta." },
    ],
  }),
  component: NewOffer,
});

function NewOffer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savingMode, setSavingMode] = useState<OfferSaveStatus | null>(null);

  async function save(values: NewOfferInput, status: OfferSaveStatus) {
    setSavingMode(status);
    try {
      const created = await createOffer(values, status);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success(status === "draft" ? "Szkic został zapisany." : "Oferta została utworzona.");
      navigate({
        to: status === "draft" ? "/offers" : "/offers/$id",
        params: status === "draft" ? undefined : { id: created.id },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać oferty.");
    } finally {
      setSavingMode(null);
    }
  }

  return (
    <AppLayout>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Wróć do dashboardu
        </Link>
      </Button>

      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Nowe zapytanie i oferta</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Przygotuj ofertę dla klienta</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Najpierw zapisz wiadomość klienta. Zakres, cenę i warunki możesz uzupełnić od razu albo wrócić do nich później.
        </p>
      </div>

      <OfferForm savingMode={savingMode} onSave={save} />
    </AppLayout>
  );
}
