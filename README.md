# Oferta Pro

Aplikacja SaaS dla freelancerów i małych agencji, która porządkuje proces od zapytania klienta do gotowej oferty PDF.

## Aktualne funkcje

- rejestracja i logowanie przez Supabase Auth,
- potwierdzanie adresu e-mail i ponowne wysyłanie linku aktywacyjnego,
- wykrywanie próby rejestracji zajętego adresu e-mail,
- odzyskiwanie hasła przez bezpieczny link e-mail,
- odseparowane dane użytkowników przez Row Level Security,
- dane wykonawcy: freelancer, firma lub agencja,
- tworzenie i edycja ofert,
- szkice oraz statusy procesu sprzedaży,
- analiza zapytania klienta przez AI,
- zapis ustrukturyzowanej analizy razem z ofertą,
- generowanie i pobieranie PDF,
- obsługa zapisu PDF na urządzeniach mobilnych.

## Architektura

```text
React + TanStack Start
        ↓
Vercel
        ↓
Supabase Auth + PostgreSQL + RLS
        ↓
OpenAI Responses API przez endpoint serwerowy
```

Klucz OpenAI jest odczytywany wyłącznie po stronie serwera. Nie może być umieszczany w zmiennych zaczynających się od `VITE_` ani w kodzie frontendowym.

## Konfiguracja środowiska

Lokalny plik `.env.local`:

```text
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_MODEL` jest opcjonalny. Domyślnie aplikacja korzysta z `gpt-5-mini`.

W Vercel zmienne należy dodać w:

```text
Project Settings → Environment Variables
```

## Konfiguracja Supabase Auth

W `Authentication → URL Configuration` ustaw:

```text
Site URL: https://oferta-pro-cyan.vercel.app
```

Dodaj do `Redirect URLs`:

```text
https://oferta-pro-cyan.vercel.app/**
```

Przepływy uwierzytelniania korzystają z adresów:

```text
/auth/confirm
/reset-password
```

W produkcji należy skonfigurować własny SMTP w Supabase, aby zwiększyć niezawodność dostarczania wiadomości aktywacyjnych i resetujących hasło.

## Migracje Supabase

Uruchamiaj pliki z katalogu:

```text
supabase/migrations
```

Najważniejsze obiekty:

- `profiles`,
- `leads`,
- `offers`,
- `ai_generations`,
- polityki RLS,
- triggery profilu i pól `updated_at`.

## Uruchomienie lokalne

```sh
npm install
npm run dev
```

Build produkcyjny:

```sh
npm run build
```

## Hosting

Produkcja działa na Vercel:

```text
https://oferta-pro-cyan.vercel.app
```

## Stos technologiczny

- React 19,
- TypeScript,
- TanStack Start, Router i Query,
- Vite,
- Nitro,
- Tailwind CSS,
- Supabase Auth + PostgreSQL + RLS,
- OpenAI Responses API,
- Vercel.
