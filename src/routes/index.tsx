import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, FileCheck2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Oferta — od zapytania klienta do gotowej oferty" },
      {
        name: "description",
        content:
          "AI Oferta pomaga freelancerom zapisywać zapytania klientów, przygotowywać wyceny i kontrolować status ofert.",
      },
      { property: "og:title", content: "AI Oferta — od zapytania klienta do gotowej oferty" },
      {
        property: "og:description",
        content: "Zapytania, zakresy, wyceny i statusy ofert w jednym uporządkowanym procesie.",
      },
    ],
  }),
  component: Landing,
});

const benefits = [
  {
    icon: FolderKanban,
    title: "Jedno miejsce na zapytania",
    text: "Zapisujesz klienta, jego problem i proponowaną usługę bez szukania informacji w wiadomościach i notatkach.",
  },
  {
    icon: Calculator,
    title: "Uporządkowana wycena",
    text: "Zakres, cena, termin i dodatkowe ustalenia są połączone z konkretnym klientem i ofertą.",
  },
  {
    icon: FileCheck2,
    title: "Kontrola procesu sprzedaży",
    text: "Widzisz, które oferty są szkicami, są gotowe, zostały wysłane, zaakceptowane albo odrzucone.",
  },
];

const steps = [
  {
    n: "1",
    title: "Zapisz zapytanie",
    text: "Dodaj klienta, jego problem oraz usługę, którą możesz zaproponować.",
  },
  {
    n: "2",
    title: "Przygotuj wycenę",
    text: "Uzupełnij zakres prac, cenę, termin realizacji i ważne ustalenia.",
  },
  {
    n: "3",
    title: "Kontroluj status",
    text: "Przeglądaj ofertę i oznaczaj ją jako wysłaną, zaakceptowaną lub odrzuconą.",
  },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo />
          </Link>
          <nav aria-label="Nawigacja główna" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#funkcje"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            >
              Funkcje
            </a>
            <a
              href="#jak-to-dziala"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            >
              Jak to działa
            </a>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Zaloguj się</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              MVP dla freelancerów usługowych
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Od zapytania klienta do gotowej oferty w jednym miejscu
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Zapisuj potrzeby klientów, przygotowuj zakres i wycenę oraz kontroluj, które oferty są
              gotowe, wysłane i zaakceptowane. Bez danych demonstracyjnych i bez mieszania ofert
              różnych użytkowników.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">
                  Załóż konto
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#jak-to-dziala">Zobacz proces</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="funkcje" className="border-y border-border bg-card/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Co porządkuje aplikacja</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-card"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <benefit.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{benefit.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="jak-to-dziala" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Jak to działa</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-3">
              {steps.map((step) => (
                <li key={step.n} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border bg-card/60 py-16 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Zapisz pierwszą prawdziwą ofertę</h2>
              <p className="mt-3 text-muted-foreground">
                Załóż konto. Twoje dane będą zapisane w Supabase i dostępne po ponownym zalogowaniu.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/register">
                Utwórz konto
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground sm:px-6">
          © 2026 AI Oferta
        </div>
      </footer>
    </div>
  );
}
