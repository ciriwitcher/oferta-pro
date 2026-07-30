/**
 * Jedyne miejsce z danymi ofert (mock + localStorage).
 * Docelowo wystarczy podmienić implementację na wywołania API.
 */

export type OfferStatus = "szkic" | "gotowa" | "wyslana";
export type OfferTone = "formalny" | "partnerski" | "sprzedazowy";

export type Offer = {
  id: string;
  client: string;
  industry: string;
  problem: string;
  service: string;
  scope: string;
  price: number;
  deadline: string;
  notes: string;
  tone: OfferTone;
  status: OfferStatus;
  createdAt: string; // ISO
  number: string;
};

export const statusLabels: Record<OfferStatus, string> = {
  szkic: "Szkic",
  gotowa: "Gotowa",
  wyslana: "Wysłana",
};

export const toneLabels: Record<OfferTone, string> = {
  formalny: "Formalny",
  partnerski: "Partnerski",
  sprzedazowy: "Sprzedażowy",
};

export const providerName = "Studio Nova";

const seedOffers: Offer[] = [
  {
    id: "1",
    number: "OF/2026/041",
    client: "Piekarnia Zbożowa",
    industry: "Gastronomia",
    problem:
      "Klienci nie znajdują piekarni w wyszukiwarce, a zamówienia firmowe przyjmowane są telefonicznie.",
    service: "Strona internetowa z zamówieniami",
    scope:
      "Projekt graficzny, wdrożenie strony, formularz zamówień hurtowych, podstawowa optymalizacja SEO.",
    price: 8400,
    deadline: "6 tygodni",
    notes: "Klient dysponuje własnymi zdjęciami produktów.",
    tone: "partnerski",
    status: "wyslana",
    createdAt: "2026-07-14",
  },
  {
    id: "2",
    number: "OF/2026/040",
    client: "Kancelaria Malinowski i Wspólnicy",
    industry: "Usługi prawne",
    problem: "Wizerunek kancelarii w internecie nie odpowiada jakości świadczonych usług.",
    service: "Identyfikacja wizualna i strona wizytówka",
    scope: "Logo, księga znaku, materiały firmowe, jednostronicowa witryna.",
    price: 12500,
    deadline: "8 tygodni",
    notes: "Wymagany formalny ton komunikacji.",
    tone: "formalny",
    status: "gotowa",
    createdAt: "2026-07-09",
  },
  {
    id: "3",
    number: "OF/2026/038",
    client: "FitZone Studio",
    industry: "Fitness",
    problem: "Brak stałego napływu nowych klientów po sezonie letnim.",
    service: "Kampania reklamowa w mediach społecznościowych",
    scope: "Strategia, 12 kreacji graficznych, prowadzenie kampanii przez 2 miesiące, raport.",
    price: 5600,
    deadline: "2 miesiące",
    notes: "Budżet mediowy po stronie klienta.",
    tone: "sprzedazowy",
    status: "szkic",
    createdAt: "2026-07-02",
  },
  {
    id: "4",
    number: "OF/2026/035",
    client: "TechParts Sp. z o.o.",
    industry: "Handel B2B",
    problem: "Ręczne przygotowywanie wycen zajmuje handlowcom kilka godzin dziennie.",
    service: "Aplikacja do wycen wewnętrznych",
    scope: "Analiza procesu, projekt interfejsu, wdrożenie aplikacji webowej, szkolenie zespołu.",
    price: 26000,
    deadline: "3 miesiące",
    notes: "Integracja z istniejącym systemem magazynowym w kolejnym etapie.",
    tone: "formalny",
    status: "wyslana",
    createdAt: "2026-06-24",
  },
  {
    id: "5",
    number: "OF/2026/031",
    client: "Pracownia Ceramiki Glina",
    industry: "Rękodzieło",
    problem: "Sprzedaż odbywa się wyłącznie na targach lokalnych.",
    service: "Sklep internetowy",
    scope: "Konfiguracja sklepu, wdrożenie płatności, migracja 40 produktów, instrukcja obsługi.",
    price: 7200,
    deadline: "5 tygodni",
    notes: "Klient prosi o szkolenie z dodawania produktów.",
    tone: "partnerski",
    status: "szkic",
    createdAt: "2026-06-11",
  },
];

const STORAGE_KEY = "ai-oferta:offers";

let offers: Offer[] = seedOffers;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) offers = JSON.parse(raw) as Offer[];
  } catch {
    // ignorujemy uszkodzone dane
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  } catch {
    // brak dostępu do localStorage – dane pozostają w pamięci
  }
  listeners.forEach((l) => l());
}

export const offersStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Offer[] {
    load();
    return offers;
  },
  getServerSnapshot(): Offer[] {
    return seedOffers;
  },
  get(id: string) {
    load();
    return offers.find((o) => o.id === id);
  },
  add(offer: Omit<Offer, "id" | "number" | "createdAt">): Offer {
    load();
    const next: Offer = {
      ...offer,
      id: String(Date.now()),
      number: `OF/2026/${String(42 + offers.length).padStart(3, "0")}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    offers = [next, ...offers];
    persist();
    return next;
  },
  setStatus(id: string, status: OfferStatus) {
    load();
    offers = offers.map((o) => (o.id === id ? { ...o, status } : o));
    persist();
  },
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(value));
}
