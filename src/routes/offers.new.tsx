import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toneLabels, type OfferStatus, type OfferTone } from "@/data/offers";
import { useCreateOffer } from "@/hooks/use-offers";

export const Route = createFileRoute("/offers/new")({
  head: () => ({ meta: [{ title: "Nowa oferta — AI Oferta" }] }),
  component: NewOffer,
});

type Errors = Record<string, string>;
type Values = {
  client: string;
  clientEmail: string;
  industry: string;
  problem: string;
  service: string;
  scope: string;
  price: string;
  deliveryTime: string;
  notes: string;
};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

const tones: OfferTone[] = ["formal", "partner", "sales"];

function NewOffer() {
  const navigate = useNavigate();
  const createOffer = useCreateOffer();
  const [errors, setErrors] = useState<Errors>({});
  const [tone, setTone] = useState<OfferTone | null>(null);

  function collect(form: HTMLFormElement): Values {
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    return {
      client: get("client"),
      clientEmail: get("clientEmail"),
      industry: get("industry"),
      problem: get("problem"),
      service: get("service"),
      scope: get("scope"),
      price: get("price"),
      deliveryTime: get("deliveryTime"),
      notes: get("notes"),
    };
  }

  function validate(values: Values, status: OfferStatus) {
    const next: Errors = {};
    if (!values.client) next.client = "Podaj nazwę klienta.";
    if (values.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail))
      next.clientEmail = "Podaj poprawny adres e-mail.";
    if (!values.problem) next.problem = "Opisz problem klienta.";
    if (!values.service) next.service = "Podaj proponowaną usługę.";
    if (values.price && (Number.isNaN(Number(values.price)) || Number(values.price) < 0))
      next.price = "Cena musi być liczbą nieujemną.";
    if (status !== "draft") {
      if (!values.scope) next.scope = "Uzupełnij zakres prac.";
      if (!values.price) next.price = "Uzupełnij cenę.";
      if (!values.deliveryTime) next.deliveryTime = "Uzupełnij czas realizacji.";
      if (!tone) next.tone = "Wybierz ton oferty.";
    }
    return next;
  }

  async function save(form: HTMLFormElement, status: OfferStatus) {
    const values = collect(form);
    const nextErrors = validate(values, status);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Sprawdź pola formularza.");
      return;
    }

    try {
      const id = await createOffer.mutateAsync({
        client: values.client,
        clientEmail: values.clientEmail || null,
        industry: values.industry || null,
        problem: values.problem,
        service: values.service,
        scope: values.scope || null,
        price: values.price ? Number(values.price) : null,
        deliveryTime: values.deliveryTime || null,
        notes: values.notes || null,
        tone,
        status,
      });
      toast.success(status === "draft" ? "Szkic został zapisany." : "Oferta jest gotowa.");
      navigate({ to: "/offers/$id", params: { id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać oferty.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(event.currentTarget, "ready");
  }

  return (
    <AppLayout>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" /> Wróć do dashboardu
        </Link>
      </Button>
      <h1 className="text-2xl font-bold sm:text-3xl">Nowa oferta</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Szkic może być niekompletny. Aby oznaczyć ofertę jako gotową, uzupełnij zakres, cenę, czas
        realizacji i ton.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Klient</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="client" label="Nazwa klienta *" error={errors.client}>
              <Input id="client" name="client" placeholder="Nazwa klienta" />
            </Field>
            <Field id="clientEmail" label="E-mail klienta" error={errors.clientEmail}>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                placeholder="kontakt@firma.pl"
              />
            </Field>
            <Field id="industry" label="Branża klienta">
              <Input id="industry" name="industry" placeholder="Gastronomia" />
            </Field>
          </div>
          <div className="mt-5">
            <Field id="problem" label="Problem klienta *" error={errors.problem}>
              <Textarea id="problem" name="problem" rows={4} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Zakres współpracy</h2>
          <div className="mt-5 space-y-5">
            <Field id="service" label="Proponowana usługa *" error={errors.service}>
              <Input id="service" name="service" />
            </Field>
            <Field id="scope" label="Zakres prac" error={errors.scope}>
              <Textarea id="scope" name="scope" rows={4} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="price" label="Cena (PLN)" error={errors.price}>
                <Input id="price" name="price" type="number" min="0" step="0.01" />
              </Field>
              <Field id="deliveryTime" label="Czas realizacji" error={errors.deliveryTime}>
                <Input
                  id="deliveryTime"
                  name="deliveryTime"
                  placeholder="30 dni roboczych od dostarczenia materiałów"
                />
              </Field>
            </div>
            <Field id="notes" label="Dodatkowe informacje">
              <Textarea id="notes" name="notes" rows={3} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Ton oferty</h2>
          <RadioGroup
            value={tone ?? undefined}
            onValueChange={(value) => setTone(value as OfferTone)}
            className="mt-5 grid gap-3 sm:grid-cols-3"
          >
            {tones.map((item) => (
              <Label
                key={item}
                htmlFor={`tone-${item}`}
                className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <RadioGroupItem id={`tone-${item}`} value={item} />
                <span>{toneLabels[item]}</span>
              </Label>
            ))}
          </RadioGroup>
          {errors.tone && <p className="mt-2 text-sm text-destructive">{errors.tone}</p>}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={createOffer.isPending}
            onClick={(event) =>
              event.currentTarget.form && void save(event.currentTarget.form, "draft")
            }
          >
            {createOffer.isPending ? "Zapisywanie…" : "Zapisz szkic"}
          </Button>
          <Button type="submit" disabled={createOffer.isPending}>
            {createOffer.isPending ? "Zapisywanie…" : "Utwórz ofertę"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
