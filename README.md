# AI Oferta / Oferta Pro

Funkcjonalne MVP aplikacji dla freelancerów i małych firm. Użytkownik może utworzyć własne konto, zapisać zapytanie klienta, przygotować wycenę i zakres oferty oraz śledzić status sprzedaży.

## Co działa

- rejestracja i logowanie przez Supabase Auth,
- trwała sesja po odświeżeniu strony,
- odseparowane dane każdego użytkownika przez Row Level Security,
- zapisywanie szkiców i gotowych ofert,
- dashboard liczony z prawdziwych danych,
- historia, wyszukiwarka i filtry statusów,
- podgląd oferty,
- statusy: szkic, gotowa, wysłana, zaakceptowana, odrzucona i archiwalna,
- usuwanie własnych ofert.

Na tym etapie aplikacja nie generuje treści przez AI, nie wysyła e-maili i nie obsługuje płatności. Obecne MVP porządkuje proces ofertowania i przygotowuje fundament pod kolejne integracje.

## Przepływ użytkownika

1. Użytkownik tworzy konto i loguje się.
2. Dodaje zapytanie klienta: klient, e-mail, problem i proponowana usługa.
3. Uzupełnia zakres, cenę, termin realizacji i ton oferty.
4. Zapisuje niekompletny szkic albo tworzy gotową ofertę.
5. Przegląda ofertę i oznacza ją jako wysłaną.
6. Po decyzji klienta oznacza ją jako zaakceptowaną albo odrzuconą.

## Konfiguracja Supabase

### 1. Uruchom migrację

Otwórz projekt Supabase, przejdź do **SQL Editor**, utwórz nowe zapytanie i uruchom zawartość pliku:

```text
supabase/migrations/20260730234000_initial_schema.sql
```

Migracja tworzy:

- `profiles`,
- `leads`,
- `offers`,
- triggery profilu i `updated_at`,
- indeksy,
- ograniczenia statusów i ceny,
- kompletne polityki RLS.

### 2. Ustaw adresy Auth

W Supabase przejdź do **Authentication → URL Configuration**.

Ustaw:

```text
Site URL: https://incandescent-cupcake-5346be.netlify.app
```

Dodaj ten sam adres do **Redirect URLs**, najlepiej również z wariantem:

```text
https://incandescent-cupcake-5346be.netlify.app/**
```

Jeżeli aplikacja dostanie własną domenę, trzeba dodać ją w tym samym miejscu.

### 3. Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local` podczas pracy lokalnej:

```sh
cp .env.example .env.local
```

Uzupełnij:

```text
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Używaj wyłącznie klucza `publishable`/`anon`. Nigdy nie dodawaj `service_role` ani `sb_secret_` do frontendu.

## Konfiguracja Netlify

W **Site configuration → Environment variables** ustaw:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Po zmianie zmiennych uruchom nowy deploy. Build powinien publikować katalog `dist`.

## Development

```sh
bun install
bun run dev
```

Build produkcyjny:

```sh
bun run build
```

## Stos technologiczny

- React 19,
- TypeScript,
- TanStack Router i TanStack Query,
- Tailwind CSS i shadcn/ui,
- Supabase Auth + PostgreSQL + RLS,
- Netlify.

## Kolejny etap produktu

Dopiero po przetestowaniu obecnego procesu z prawdziwymi freelancerami warto dodać:

1. reguły automatycznej wyceny,
2. generowanie treści oferty przez backendową funkcję AI,
3. wysyłanie oferty e-mailem,
4. przypomnienia o follow-upie.

Nie należy dodawać tych funkcji, dopóki rejestracja, zapis ofert i bezpieczeństwo RLS nie działają stabilnie.
