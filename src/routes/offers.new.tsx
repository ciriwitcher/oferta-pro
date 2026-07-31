import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createOffer, toneLabels, type NewOfferInput, type OfferTone } from "@/data/offers";

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

type Errors = Record<string, string>;

type CollectedValues = {
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

function FieldWrap({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const tones: OfferTone[] = ["formal", "partner", "sales"];
const toneHints: Record<OfferTone, string> = {
  formal: "Dla instytucji, kancelarii i klientów korporacyjnych.",
  partner: "Swobodny, ale rzeczowy — dla małych firm i stałych klientów.",
  sales: "Podkreśla korzyści i zachęca do podjęcia decyzji.",
};

function collect(form: HTMLFormElement): CollectedValues {
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

function validate(values: CollectedValues, mode: "draft" | "ready") {
  const errors: Errors = {};
  if (!values.client) errors.client = "Podaj nazwę klienta.";
  if (!values.problem) errors.problem = "Opisz problem klienta.";
  if (!values.service) errors.service = "Podaj proponowaną usługę.";

  if (values.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail)) {
    errors.clientEmail = "Podaj poprawny adres e-mail.";
  }

  if (values.price) {
    const parsedPrice = Number(values.price.replace(",", "."));
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) errors.price = "Cena musi być liczbą nie mniejszą od zera.";
  }

  if (mode === "ready") {
    if (!values.industry) errors.industry = "Podaj branżę klienta.";
    if (!values.scope) errors.scope = "Opisz zakres prac.";
    if (!values.price) errors.price = "Podaj cenę.";
    if (!values.deliveryTime) errors.deliveryTime = "Podaj termin realizacji.";
  }

  return errors;
}

function NewOffer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Errors>({});
  const [tone, setTone] = useState<OfferTone>("partner");
  const [savingMode, setSavingMode] = useState<"draft" | "ready" | null>(null);

  async function save(form: HTMLFormElement, status: "draft" | "ready") {
    const values = collect(form);
    const nextErrors = validate(values, status);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(
        status === "draft"
          ? "Aby zapisać szkic, podaj klienta, problem i usługę."
          : "Uzupełnij wymagane pola oferty.",
      );
      return null;
    }

    const input: NewOfferInput = {
      client: values.client,
      clientEmail: values.clientEmail,
      industry: values.industry,
      problem: values.problem,
      service: values.service,
      scope: values.scope,
      price: values.price ? Number(values.price.replace(",", ".")) : null,
      deliveryTime: values.deliveryTime,
      notes: values.notes,
      tone,
    };

    setSavingMode(status);
    try {
      const created = await createOffer(input, status);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      return created;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać oferty.");
      return null;
    } finally {
      setSavingMode(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await save(event.currentTarget, "ready");
    if (!created) return;
    toast.success("Oferta została utworzona.");
    navigate({ to: "/offers/$id", params: { id: created.id } });
  }

  async function onSaveDraft(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const created = await save(form, "draft");
    if (!created) return;
    toast.success("Szkic oferty został zapisany.");
    navigate({ to: "/offers" });
  }

  const saving = savingMode !== null;

  return (
    <AppLayout>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Wróć do dashboardu
        </Link>
      </Button>

      <h1 className="text-2xl font-bold sm:text-3xl">Nowa oferta</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Zapisz zapytanie klienta, wycenę i zakres współpracy. Szkic wymaga tylko podstawowych danych;
        oferta gotowa wymaga uzupełnienia całego zakresu.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Klient i zapytanie</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FieldWrap id="client" label="Nazwa klienta *" error={errors.client}>
              <Input
                id="client"
                name="client"
                placeholder="Piekarnia Zbożowa"
                aria-invalid={!!errors.client}
                aria-describedby={errors.client ? "client-error" : undefined}
              />
            </FieldWrap>
            <FieldWrap id="clientEmail" label="E-mail klienta" error={errors.clientEmail}>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                autoComplete="email"
                placeholder="kontakt@klient.pl"
                aria-invalid={!!errors.clientEmail}
                aria-describedby={errors.clientEmail ? "clientEmail-error" : undefined}
              />
            </FieldWrap>
            <FieldWrap
              id="industry"
              label="Branża klienta"
              hint="Wymagana, gdy tworzysz gotową ofertę."
              error={errors.industry}
            >
              <Input
                id="industry"
                name="industry"
                placeholder="Gastronomia"
                aria-invalid={!!errors.industry}
                aria-describedby={
                  ["industry-hint", errors.industry ? "industry-error" : ""].filter(Boolean).join(" ")
                }
              />
            </FieldWrap>
          </div>
          <div className="mt-5">
            <FieldWrap
              id="problem"
              label="Problem lub potrzeba klienta *"
              hint="Wklej lub streść zapytanie klienta."
              error={errors.problem}
            >
              <Textarea
                id="problem"
                name="problem"
                rows={4}
                placeholder="Klient potrzebuje strony, która pozwoli przyjmować zamówienia online…"
                aria-invalid={!!errors.problem}
                aria-describedby={
                  ["problem-hint", errors.problem ? "problem-error" : ""].filter(Boolean).join(" ")
                }
              />
            </FieldWrap>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Wycena i zakres współpracy</h2>
          <div className="mt-5 space-y-5">
            <FieldWrap id="service" label="Proponowana usługa *" error={errors.service}>
              <Input
                id="service"
                name="service"
                placeholder="Strona internetowa z formularzem zamówień"
                aria-invalid={!!errors.service}
                aria-describedby={errors.service ? "service-error" : undefined}
              />
            </FieldWrap>
            <FieldWrap
              id="scope"
              label="Zakres prac"
              hint="Wypisz najważniejsze elementy realizacji."
              error={errors.scope}
            >
              <Textarea
                id="scope"
                name="scope"
                rows={4}
                placeholder="Projekt graficzny, wdrożenie, formularz zamówień, konfiguracja analityki…"
                aria-invalid={!!errors.scope}
                aria-describedby={
                  ["scope-hint", errors.scope ? "scope-error" : ""].filter(Boolean).join(" ")
                }
              />
            </FieldWrap>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldWrap id="price" label="Cena (PLN)" error={errors.price}>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  inputMode="decimal"
                  placeholder="8400"
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? "price-error" : undefined}
                />
              </FieldWrap>
              <FieldWrap
                id="deliveryTime"
                label="Termin realizacji"
                hint="Np. 6 tygodni od dostarczenia materiałów."
                error={errors.deliveryTime}
              >
                <Input
                  id="deliveryTime"
                  name="deliveryTime"
                  placeholder="6 tygodni od akceptacji"
                  aria-invalid={!!errors.deliveryTime}
                  aria-describedby={
                    ["deliveryTime-hint", errors.deliveryTime ? "deliveryTime-error" : ""]
                      .filter(Boolean)
                      .join(" ")
                  }
                />
              </FieldWrap>
            </div>
            <FieldWrap
              id="notes"
              label="Dodatkowe informacje"
              hint="Ustalenia, ograniczenia budżetowe i materiały dostarczane przez klienta."
            >
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Klient dostarcza własne zdjęcia i treści."
                aria-describedby="notes-hint"
              />
            </FieldWrap>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Ton oferty</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Określa sposób przedstawienia propozycji w podglądzie dokumentu.
          </p>
          <RadioGroup
            value={tone}
            onValueChange={(value) => setTone(value as OfferTone)}
            className="mt-5 grid gap-3 sm:grid-cols-3"
          >
            {tones.map((item) => (
              <Label
                key={item}
                htmlFor={`ton-${item}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <RadioGroupItem id={`ton-${item}`} value={item} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block font-medium">{toneLabels[item]}</span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {toneHints[item]}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onSaveDraft} disabled={saving}>
            {savingMode === "draft" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {savingMode === "draft" ? "Zapisywanie…" : "Zapisz szkic"}
          </Button>
          <Button type="submit" disabled={saving}>
            {savingMode === "ready" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {savingMode === "ready" ? "Tworzenie…" : "Utwórz ofertę"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
