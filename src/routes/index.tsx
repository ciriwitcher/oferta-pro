import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, FileCheck2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Oferta — twórz profesjonalne oferty w kilka minut" },
      {
        name: "description",
        content:
          "AI Oferta to narzędzie dla freelancerów i małych firm: szybkie tworzenie ofert, spójny profesjonalny wygląd i uporządkowana historia.",
      },
      { property: "og:title", content: "AI Oferta — twórz profesjonalne oferty w kilka minut" },
      {
        property: "og:description",
        content: "Oszczędzaj czas, wysyłaj oferty, które wyglądają profesjonalnie.",
      },
    ],
  }),
  component: Landing,
});

const benefits = [
  {
    icon: Clock,
    title: "Oszczędność czasu",
    text: "Zamiast pisać ofertę od zera, wypełniasz krótki formularz i dostajesz gotowy dokument.",
  },
  {
    icon: FileCheck2,
    title: "Profesjonalny wygląd",
    text: "Każda oferta ma spójną strukturę, czytelny układ i ton dopasowany do klienta.",
  },
  {
    icon: FolderKanban,
    title: "Uporządkowana historia",
    text: "Wszystkie oferty w jednym miejscu, ze statusem szkicu, gotowej i wysłanej.",
  },
];

const steps = [
  { n: "1", title: "Opisz klienta", text: "Podaj branżę, problem i usługę, którą proponujesz." },
  {
    n: "2",
    title: "Wybierz ton",
    text: "Formalny, partnerski lub sprzedażowy — zależnie od odbiorcy.",
  },
  { n: "3", title: "Wyślij ofertę", text: "Przejrzyj gotowy dokument i oznacz go jako wysłany." },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
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
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Dla freelancerów i małych firm
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Profesjonalne oferty dla klientów w kilka minut
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Wypełnij prosty formularz, a AI Oferta ułoży z niego uporządkowany dokument: problem
              klienta, zakres prac, harmonogram i cenę. Bez szablonów w edytorze tekstu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">
                  Wypróbuj
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#jak-to-dziala">Zobacz, jak to działa</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="funkcje" className="border-y border-border bg-card/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Dlaczego warto</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <li
                  key={b.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-card"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <b.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="jak-to-dziala" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Jak to działa</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border bg-card/60 py-16 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Przygotuj pierwszą ofertę już dziś</h2>
              <p className="mt-3 text-muted-foreground">
                Załóż konto i zobacz, jak wygląda gotowy dokument dla Twojego klienta.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/register">
                Wypróbuj
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
