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
import { offersStore, toneLabels, type OfferTone } from "@/data/offers";

export const Route = createFileRoute("/offers/new")({
  head: () => ({
    meta: [
      { title: "Nowa oferta — AI Oferta" },
      { name: "description", content: "Wypełnij formularz i przygotuj ofertę dla klienta." },
      { property: "og:title", content: "Nowa oferta — AI Oferta" },
      { property: "og:description", content: "Formularz tworzenia oferty w AI Oferta." },
    ],
  }),
  component: NewOffer,
});

type Errors = Record<string, string>;

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
  children: React.ReactNode;
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

const tones: OfferTone[] = ["formalny", "partnerski", "sprzedazowy"];
const toneHints: Record<OfferTone, string> = {
  formalny: "Dla instytucji, kancelarii i klientów korporacyjnych.",
  partnerski: "Swobodny, ale rzeczowy — dla małych firm i stałych klientów.",
  sprzedazowy: "Podkreśla korzyści i zachęca do szybkiej decyzji.",
};

function NewOffer() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [tone, setTone] = useState<OfferTone>("partnerski");

  function collect(form: HTMLFormElement) {
    const d = new FormData(form);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    return {
      client: get("client"),
      industry: get("industry"),
      problem: get("problem"),
      service: get("service"),
      scope: get("scope"),
      price: get("price"),
      deadline: get("deadline"),
      notes: get("notes"),
    };
  }

  function validate(v: ReturnType<typeof collect>) {
    const e: Errors = {};
    if (!v.client) e.client = "Podaj nazwę klienta.";
    if (!v.industry) e.industry = "Podaj branżę klienta.";
    if (!v.problem) e.problem = "Opisz problem klienta.";
    if (!v.service) e.service = "Podaj proponowaną usługę.";
    if (!v.scope) e.scope = "Opisz zakres prac.";
    if (!v.price) e.price = "Podaj cenę.";
    else if (Number.isNaN(Number(v.price)) || Number(v.price) <= 0)
      e.price = "Cena musi być liczbą większą od zera.";
    if (!v.deadline) e.deadline = "Podaj termin realizacji.";
    return e;
  }

  function save(form: HTMLFormElement, status: "szkic" | "gotowa") {
    const v = collect(form);
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Uzupełnij wymagane pola formularza.");
      return null;
    }
    return offersStore.add({ ...v, price: Number(v.price), tone, status });
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const created = save(ev.currentTarget, "gotowa");
    if (!created) return;
    toast.success("Oferta została utworzona.");
    navigate({ to: "/offers/$id", params: { id: created.id } });
  }

  function onSaveDraft(ev: React.MouseEvent<HTMLButtonElement>) {
    const form = ev.currentTarget.form;
    if (!form) return;
    const created = save(form, "szkic");
    if (!created) return;
    toast.success("Szkic oferty został zapisany.");
    navigate({ to: "/offers" });
  }

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
        Im więcej konkretów podasz, tym bardziej dopasowany będzie gotowy dokument. Pola oznaczone
        gwiazdką są wymagane.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Klient</h2>
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
            <FieldWrap
              id="industry"
              label="Branża klienta *"
              hint="Np. gastronomia, usługi prawne, e-commerce."
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
              label="Problem klienta *"
              hint="Czego klientowi brakuje i co chce osiągnąć."
              error={errors.problem}
            >
              <Textarea
                id="problem"
                name="problem"
                rows={4}
                placeholder="Klienci nie znajdują firmy w wyszukiwarce…"
                aria-invalid={!!errors.problem}
                aria-describedby={
                  ["problem-hint", errors.problem ? "problem-error" : ""].filter(Boolean).join(" ")
                }
              />
            </FieldWrap>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Zakres współpracy</h2>
          <div className="mt-5 space-y-5">
            <FieldWrap id="service" label="Proponowana usługa *" error={errors.service}>
              <Input
                id="service"
                name="service"
                placeholder="Strona internetowa z zamówieniami"
                aria-invalid={!!errors.service}
                aria-describedby={errors.service ? "service-error" : undefined}
              />
            </FieldWrap>
            <FieldWrap
              id="scope"
              label="Zakres prac *"
              hint="Wypisz najważniejsze elementy, np. projekt, wdrożenie, szkolenie."
              error={errors.scope}
            >
              <Textarea
                id="scope"
                name="scope"
                rows={4}
                placeholder="Projekt graficzny, wdrożenie, formularz zamówień…"
                aria-invalid={!!errors.scope}
                aria-describedby={
                  ["scope-hint", errors.scope ? "scope-error" : ""].filter(Boolean).join(" ")
                }
              />
            </FieldWrap>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldWrap id="price" label="Cena (PLN) *" error={errors.price}>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  inputMode="numeric"
                  placeholder="8400"
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? "price-error" : undefined}
                />
              </FieldWrap>
              <FieldWrap
                id="deadline"
                label="Termin realizacji *"
                hint="Np. 6 tygodni lub do 30 września."
                error={errors.deadline}
              >
                <Input
                  id="deadline"
                  name="deadline"
                  placeholder="6 tygodni"
                  aria-invalid={!!errors.deadline}
                  aria-describedby={
                    ["deadline-hint", errors.deadline ? "deadline-error" : ""].filter(Boolean).join(" ")
                  }
                />
              </FieldWrap>
            </div>
            <FieldWrap
              id="notes"
              label="Dodatkowe informacje"
              hint="Ustalenia, ograniczenia budżetowe, materiały od klienta."
            >
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Klient dysponuje własnymi zdjęciami produktów."
                aria-describedby="notes-hint"
              />
            </FieldWrap>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Ton oferty</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Wpływa na styl języka w gotowym dokumencie.
          </p>
          <RadioGroup
            value={tone}
            onValueChange={(v) => setTone(v as OfferTone)}
            className="mt-5 grid gap-3 sm:grid-cols-3"
          >
            {tones.map((t) => (
              <Label
                key={t}
                htmlFor={`ton-${t}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <RadioGroupItem id={`ton-${t}`} value={t} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block font-medium">{toneLabels[t]}</span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {toneHints[t]}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onSaveDraft}>
            Zapisz szkic
          </Button>
          <Button type="submit">Utwórz ofertę</Button>
        </div>
      </form>
    </AppLayout>
  );
}
