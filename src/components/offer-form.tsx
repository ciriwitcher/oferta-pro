import { useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NewOfferInput } from "@/data/offers";

export type OfferSaveStatus = "draft" | "ready";

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

type OfferFormProps = {
  initialValues?: Partial<NewOfferInput>;
  savingMode: OfferSaveStatus | null;
  onSave: (values: NewOfferInput, status: OfferSaveStatus) => Promise<void>;
  primaryLabel?: string;
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
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
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

function validate(values: CollectedValues, status: OfferSaveStatus) {
  const errors: Errors = {};

  if (!values.client) errors.client = "Podaj nazwę klienta.";
  if (!values.problem) errors.problem = "Wklej albo opisz zapytanie klienta.";

  if (values.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail)) {
    errors.clientEmail = "Podaj poprawny adres e-mail.";
  }

  if (values.price) {
    const parsedPrice = Number(values.price.replace(",", "."));
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = "Cena musi być liczbą nie mniejszą od zera.";
    }
  }

  if (status === "ready") {
    if (!values.service) errors.service = "Nazwij proponowaną usługę lub projekt.";
    if (!values.scope) errors.scope = "Opisz, co dokładnie otrzyma klient.";
    if (!values.price) errors.price = "Podaj cenę.";
    if (!values.deliveryTime) errors.deliveryTime = "Podaj przewidywany termin realizacji.";
  }

  return errors;
}

export function OfferForm({
  initialValues,
  savingMode,
  onSave,
  primaryLabel = "Utwórz ofertę",
}: OfferFormProps) {
  const [errors, setErrors] = useState<Errors>({});
  const saving = savingMode !== null;

  async function process(form: HTMLFormElement, status: OfferSaveStatus) {
    const values = collect(form);
    const nextErrors = validate(values, status);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast.error(
        status === "draft"
          ? "Do szkicu wystarczą nazwa klienta i treść zapytania."
          : "Uzupełnij pola wymagane do gotowej oferty.",
      );
      const firstError = Object.keys(nextErrors)[0];
      form.querySelector<HTMLElement>(`#${firstError}`)?.focus();
      return;
    }

    await onSave(
      {
        client: values.client,
        clientEmail: values.clientEmail,
        industry: values.industry,
        problem: values.problem,
        service: values.service,
        scope: values.scope,
        price: values.price ? Number(values.price.replace(",", ".")) : null,
        deliveryTime: values.deliveryTime,
        notes: values.notes,
        tone: initialValues?.tone ?? "partner",
      },
      status,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await process(event.currentTarget, "ready");
  }

  async function handleDraft(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    await process(form, "draft");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
      <div className="rounded-xl border border-primary/20 bg-accent/55 p-4 sm:flex sm:items-start sm:gap-4">
        <span className="mb-3 grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground sm:mb-0">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">Zacznij od wiadomości klienta</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Wklej pełne zapytanie, nawet gdy nie znasz jeszcze ceny i zakresu. Taki wpis możesz zapisać jako szkic i dokończyć później.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            1
          </span>
          <div>
            <h2 className="text-lg font-semibold">Zapytanie klienta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dane potrzebne do rozpoznania klienta i zrozumienia jego sytuacji.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <FieldWrap id="client" label="Nazwa klienta *" error={errors.client}>
            <Input
              id="client"
              name="client"
              defaultValue={initialValues?.client ?? ""}
              placeholder="Piekarnia Zbożowa"
              aria-invalid={!!errors.client}
              aria-describedby={errors.client ? "client-error" : undefined}
            />
          </FieldWrap>

          <FieldWrap id="clientEmail" label="E-mail klienta — opcjonalnie" error={errors.clientEmail}>
            <Input
              id="clientEmail"
              name="clientEmail"
              type="email"
              autoComplete="email"
              defaultValue={initialValues?.clientEmail ?? ""}
              placeholder="kontakt@klient.pl"
              aria-invalid={!!errors.clientEmail}
              aria-describedby={errors.clientEmail ? "clientEmail-error" : undefined}
            />
          </FieldWrap>

          <FieldWrap
            id="industry"
            label="Branża — opcjonalnie"
            hint="Przyda się później do dopasowania treści przez AI, ale nie blokuje utworzenia oferty."
          >
            <Input
              id="industry"
              name="industry"
              defaultValue={initialValues?.industry ?? ""}
              placeholder="Gastronomia"
              aria-describedby="industry-hint"
            />
          </FieldWrap>
        </div>

        <div className="mt-5">
          <FieldWrap
            id="problem"
            label="Treść zapytania lub potrzeba klienta *"
            hint="Najlepiej wklej oryginalną wiadomość klienta. Nie skracaj jej na siłę — szczegóły będą później przydatne do analizy AI."
            error={errors.problem}
          >
            <Textarea
              id="problem"
              name="problem"
              rows={6}
              defaultValue={initialValues?.problem ?? ""}
              placeholder="Dzień dobry, prowadzimy piekarnię i potrzebujemy strony, przez którą klienci będą mogli składać zamówienia…"
              aria-invalid={!!errors.problem}
              aria-describedby={
                ["problem-hint", errors.problem ? "problem-error" : ""].filter(Boolean).join(" ")
              }
            />
          </FieldWrap>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            2
          </span>
          <div>
            <h2 className="text-lg font-semibold">Rozwiązanie i zakres</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Zdefiniuj rezultat, który sprzedajesz — nie tylko listę czynności.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <FieldWrap
            id="service"
            label="Nazwa usługi lub projektu"
            hint="Wymagana dopiero dla gotowej oferty. Nazwij efekt, np. „Strona sprzedażowa z rezerwacją online”."
            error={errors.service}
          >
            <Input
              id="service"
              name="service"
              defaultValue={initialValues?.service === "Do ustalenia" ? "" : initialValues?.service ?? ""}
              placeholder="Strona internetowa z zamówieniami online"
              aria-invalid={!!errors.service}
              aria-describedby={
                ["service-hint", errors.service ? "service-error" : ""].filter(Boolean).join(" ")
              }
            />
          </FieldWrap>

          <FieldWrap
            id="scope"
            label="Zakres i rezultaty"
            hint="Wypisz każdy element w osobnej linii. Podgląd oferty zamieni je w czytelną listę."
            error={errors.scope}
          >
            <Textarea
              id="scope"
              name="scope"
              rows={7}
              defaultValue={initialValues?.scope ?? ""}
              placeholder={"Projekt graficzny strony\nWdrożenie 6 podstron\nFormularz zamówień\nKonfiguracja analityki\n30 dni wsparcia po wdrożeniu"}
              aria-invalid={!!errors.scope}
              aria-describedby={
                ["scope-hint", errors.scope ? "scope-error" : ""].filter(Boolean).join(" ")
              }
            />
          </FieldWrap>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            3
          </span>
          <div>
            <h2 className="text-lg font-semibold">Wycena i warunki</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ustal cenę, termin oraz zasady, które ograniczą nieporozumienia podczas realizacji.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldWrap
              id="price"
              label="Cena całkowita (PLN)"
              hint="Na tym etapie wpisz ustaloną kwotę. Rozbicie na pozycje dodamy w kalkulatorze wyceny."
              error={errors.price}
            >
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="100"
                inputMode="decimal"
                defaultValue={initialValues?.price ?? ""}
                placeholder="8400"
                aria-invalid={!!errors.price}
                aria-describedby={
                  ["price-hint", errors.price ? "price-error" : ""].filter(Boolean).join(" ")
                }
              />
            </FieldWrap>

            <FieldWrap
              id="deliveryTime"
              label="Termin realizacji"
              hint="Np. „6 tygodni od dostarczenia materiałów i wpłaty zaliczki”."
              error={errors.deliveryTime}
            >
              <Input
                id="deliveryTime"
                name="deliveryTime"
                defaultValue={initialValues?.deliveryTime ?? ""}
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
            label="Warunki i dodatkowe ustalenia — opcjonalnie"
            hint="Wpisz m.in. zaliczkę, liczbę rund poprawek, materiały po stronie klienta, zakres wsparcia oraz elementy niewchodzące w cenę."
          >
            <Textarea
              id="notes"
              name="notes"
              rows={6}
              defaultValue={initialValues?.notes ?? ""}
              placeholder={"50% zaliczki przed rozpoczęciem prac.\nCena obejmuje 2 rundy poprawek.\nKlient dostarcza teksty i zdjęcia.\nHosting i domena nie są wliczone w cenę."}
              aria-describedby="notes-hint"
            />
          </FieldWrap>
        </div>
      </section>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground sm:mb-0">
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          Szkic wymaga tylko klienta i zapytania. Gotowa oferta wymaga zakresu, ceny i terminu.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={handleDraft} disabled={saving}>
            {savingMode === "draft" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {savingMode === "draft" ? "Zapisywanie…" : "Zapisz szkic"}
          </Button>
          <Button type="submit" disabled={saving}>
            {savingMode === "ready" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {savingMode === "ready" ? "Zapisywanie…" : primaryLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
