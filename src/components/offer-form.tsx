import {
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AlertTriangle, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NewOfferInput } from "@/data/offers";
import {
  analyzeClientInquiry,
  type OfferAiAnalysis,
} from "@/lib/ai-inquiry";

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

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function AiAnalysisEditor({
  analysis,
  onChange,
  onRemove,
}: {
  analysis: OfferAiAnalysis;
  onChange: (analysis: OfferAiAnalysis) => void;
  onRemove: () => void;
}) {
  const confidence = Math.round(analysis.confidence * 100);

  function update<K extends keyof OfferAiAnalysis>(key: K, value: OfferAiAnalysis[K]) {
    onChange({ ...analysis, [key]: value });
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-accent/35 p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Analiza AI — sprawdź i popraw</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Kompletność zapytania: {confidence}%. AI przygotowało szkic, ale odpowiedzialność za zakres,
              termin i treść pozostaje po stronie wykonawcy.
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4" aria-hidden="true" />
          Usuń analizę
        </Button>
      </div>

      {analysis.assumptions.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Założenia wymagające weryfikacji</p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                {analysis.assumptions.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5">
        <FieldWrap
          id="aiProblemSummary"
          label="Krótkie podsumowanie problemu"
          hint="To jest interpretacja wiadomości klienta, a nie jej oryginalna treść."
        >
          <Textarea
            id="aiProblemSummary"
            rows={4}
            value={analysis.problemSummary}
            onChange={(event) => update("problemSummary", event.target.value)}
          />
        </FieldWrap>

        <FieldWrap id="aiProjectGoal" label="Cel projektu">
          <Textarea
            id="aiProjectGoal"
            rows={3}
            value={analysis.projectGoal}
            onChange={(event) => update("projectGoal", event.target.value)}
          />
        </FieldWrap>

        <div className="grid gap-5 lg:grid-cols-2">
          <FieldWrap
            id="aiResults"
            label="Rezultaty dla klienta"
            hint="Każdy rezultat wpisz w osobnej linii. Nie używaj niepotwierdzonych gwarancji."
          >
            <Textarea
              id="aiResults"
              rows={6}
              value={listToText(analysis.resultItems)}
              onChange={(event) => update("resultItems", textToList(event.target.value))}
            />
          </FieldWrap>

          <FieldWrap
            id="aiExclusions"
            label="Elementy niewchodzące w zakres"
            hint="Ta sekcja ogranicza późniejsze rozszerzanie projektu bez dodatkowej wyceny."
          >
            <Textarea
              id="aiExclusions"
              rows={6}
              value={listToText(analysis.exclusionItems)}
              onChange={(event) => update("exclusionItems", textToList(event.target.value))}
            />
          </FieldWrap>
        </div>

        <FieldWrap
          id="aiQuestions"
          label="Pytania wymagające doprecyzowania"
          hint="Przed wysłaniem oferty odpowiedz na nie z klientem albo usuń te, które zostały już wyjaśnione."
        >
          <Textarea
            id="aiQuestions"
            rows={6}
            value={listToText(analysis.clarifyingQuestions)}
            onChange={(event) => update("clarifyingQuestions", textToList(event.target.value))}
          />
        </FieldWrap>

        <FieldWrap
          id="aiOfferText"
          label="Profesjonalna treść oferty"
          hint="Tekst wprowadzający przeznaczony dla klienta. Możesz go dowolnie zmienić."
        >
          <Textarea
            id="aiOfferText"
            rows={9}
            value={analysis.professionalOfferText}
            onChange={(event) => update("professionalOfferText", event.target.value)}
          />
        </FieldWrap>
      </div>
    </section>
  );
}

export function OfferForm({
  initialValues,
  savingMode,
  onSave,
  primaryLabel = "Utwórz ofertę",
}: OfferFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<OfferAiAnalysis | null>(
    initialValues?.aiAnalysis ?? null,
  );
  const saving = savingMode !== null;

  function setField(name: keyof CollectedValues, value: string, onlyWhenEmpty = false) {
    const form = formRef.current;
    if (!form || !value) return;
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    if (onlyWhenEmpty && field.value.trim()) return;
    field.value = value;
  }

  async function handleAnalyze() {
    const form = formRef.current;
    if (!form || analyzing || saving) return;
    const values = collect(form);

    if (values.problem.length < 30) {
      setErrors((current) => ({
        ...current,
        problem: "Wklej pełniejsze zapytanie klienta — minimum 30 znaków.",
      }));
      form.querySelector<HTMLElement>("#problem")?.focus();
      toast.error("AI potrzebuje pełniejszej wiadomości klienta.");
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeClientInquiry({
        inquiry: values.problem,
        clientName: values.client,
        clientEmail: values.clientEmail,
        industry: values.industry,
      });

      setAiAnalysis(analysis);
      setField("client", analysis.clientName, true);
      setField("clientEmail", analysis.clientEmail, true);
      setField("industry", analysis.industry, true);
      setField("service", analysis.proposedSolution, true);
      setField("scope", listToText(analysis.scopeItems), true);
      setField("deliveryTime", analysis.suggestedDeliveryTime, true);
      setErrors((current) => ({ ...current, problem: "" }));
      toast.success("AI przeanalizowało zapytanie i uzupełniło puste pola.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się uruchomić analizy AI.");
    } finally {
      setAnalyzing(false);
    }
  }

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

    if (status === "ready" && aiAnalysis?.clarifyingQuestions.length) {
      toast.warning(
        `Oferta zawiera ${aiAnalysis.clarifyingQuestions.length} pytań do doprecyzowania. Sprawdź je przed wysłaniem klientowi.`,
      );
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
        aiAnalysis,
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
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
      <div className="rounded-xl border border-primary/20 bg-accent/55 p-4 sm:flex sm:items-start sm:gap-4">
        <span className="mb-3 grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground sm:mb-0">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">Wklej wiadomość klienta i uruchom analizę AI</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            AI przygotuje podsumowanie, cel, rozwiązanie, zakres, rezultaty, wyłączenia, pytania,
            sugerowany termin i treść oferty. Nie ustala ceny i nie zapisuje niczego bez Twojej decyzji.
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
              Zachowaj oryginalną wiadomość. AI utworzy osobne, edytowalne podsumowanie.
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
            hint="AI spróbuje ją wykryć z wiadomości, ale możesz podać ją ręcznie."
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
            label="Oryginalna wiadomość lub opis potrzeby klienta *"
            hint="Nie usuwaj ważnych szczegółów. Maksymalnie 12 000 znaków."
            error={errors.problem}
          >
            <Textarea
              id="problem"
              name="problem"
              rows={8}
              maxLength={12_000}
              defaultValue={initialValues?.problem ?? ""}
              placeholder="Dzień dobry, prowadzimy piekarnię i potrzebujemy strony, przez którą klienci będą mogli składać zamówienia…"
              aria-invalid={!!errors.problem}
              aria-describedby={
                ["problem-hint", errors.problem ? "problem-error" : ""].filter(Boolean).join(" ")
              }
            />
          </FieldWrap>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-secondary/35 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium">Analiza zapytania przez AI</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Istniejące ręcznie wpisane pola nie zostaną nadpisane. Limit MVP: 10 analiz na godzinę.
            </p>
          </div>
          <Button
            type="button"
            className="mt-3 w-full sm:mt-0 sm:w-auto"
            onClick={handleAnalyze}
            disabled={analyzing || saving}
          >
            {analyzing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {analyzing ? "Analizowanie…" : aiAnalysis ? "Analizuj ponownie" : "Analizuj przez AI"}
          </Button>
        </div>
      </section>

      {aiAnalysis && (
        <AiAnalysisEditor
          analysis={aiAnalysis}
          onChange={setAiAnalysis}
          onRemove={() => setAiAnalysis(null)}
        />
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            2
          </span>
          <div>
            <h2 className="text-lg font-semibold">Rozwiązanie i zakres</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AI uzupełnia puste pola, ale zakres musi zostać zweryfikowany przez wykonawcę.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <FieldWrap
            id="service"
            label="Proponowane rozwiązanie / nazwa projektu"
            hint="Nazwij efekt, np. „Strona sprzedażowa z rezerwacją online”."
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
            label="Zakres prac"
            hint="Każdy element wpisz w osobnej linii."
            error={errors.scope}
          >
            <Textarea
              id="scope"
              name="scope"
              rows={8}
              defaultValue={initialValues?.scope ?? ""}
              placeholder={"Projekt struktury strony\nProjekt interfejsu\nWdrożenie podstron\nFormularz zamówień\nKonfiguracja analityki"}
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
              Cena pozostaje całkowicie pod Twoją kontrolą. AI proponuje wyłącznie orientacyjny termin.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldWrap
              id="price"
              label="Cena całkowita (PLN)"
              hint="AI celowo nie uzupełnia ceny."
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
              hint="Traktuj sugestię AI jako punkt startowy, nie zobowiązanie."
              error={errors.deliveryTime}
            >
              <Input
                id="deliveryTime"
                name="deliveryTime"
                defaultValue={initialValues?.deliveryTime ?? ""}
                placeholder="4–6 tygodni od akceptacji zakresu"
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
            hint="Wpisz zaliczkę, liczbę rund poprawek, materiały po stronie klienta i zasady wsparcia."
          >
            <Textarea
              id="notes"
              name="notes"
              rows={6}
              defaultValue={initialValues?.notes ?? ""}
              placeholder={"50% zaliczki przed rozpoczęciem prac.\nCena obejmuje 2 rundy poprawek.\nKlient dostarcza teksty i zdjęcia."}
              aria-describedby="notes-hint"
            />
          </FieldWrap>
        </div>
      </section>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground sm:mb-0">
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          Szkic wymaga klienta i wiadomości. Gotowa oferta wymaga zakresu, ceny i terminu.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={handleDraft} disabled={saving || analyzing}>
            {savingMode === "draft" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {savingMode === "draft" ? "Zapisywanie…" : "Zapisz szkic"}
          </Button>
          <Button type="submit" disabled={saving || analyzing}>
            {savingMode === "ready" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {savingMode === "ready" ? "Zapisywanie…" : primaryLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
