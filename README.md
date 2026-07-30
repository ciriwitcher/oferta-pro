# AI Oferta

Polska aplikacja do tworzenia i przechowywania ofert dla klientów. Frontend korzysta z React,
TanStack Start, Tailwind CSS i Supabase. Wdrożenie jest przygotowane dla Netlify.

Na tym etapie aplikacja nie zawiera integracji OpenAI, wysyłania e-maili, PDF, płatności ani
automatycznych follow-upów.

## Uruchomienie lokalne

Wymagany jest Node.js 22 i npm.

```sh
npm install
cp .env.example .env
npm run dev
```

W `.env` ustaw publiczne dane projektu:

```text
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-publiczny-klucz-anon
```

Nie dodawaj do frontendu klucza `service_role`.

## Konfiguracja Supabase

1. Otwórz Supabase → **SQL Editor**.
2. Wklej zawartość pliku
   `supabase/migrations/20260730190000_initial_backend.sql`.
3. Uruchom zapytanie tylko raz.
4. W **Authentication → URL Configuration** ustaw:
   - `Site URL`: adres produkcyjny Netlify,
   - `Redirect URLs`: `https://TWOJA-STRONA.netlify.app/auth/callback`,
   - podczas pracy lokalnej również `http://localhost:3000/auth/callback`.
5. W **Authentication → Providers → Email** pozostaw włączone potwierdzanie adresu e-mail.

Migracja tworzy tabele `profiles`, `leads` i `offers`, triggery profilu i dat aktualizacji oraz
osobne polityki RLS dla każdej dozwolonej operacji. Profil jest tworzony automatycznie po
rejestracji; frontend nie ma polityk do bezpośredniego dodawania ani usuwania profilu.

## Konfiguracja Netlify

W ustawieniach witryny Netlify dodaj zmienne środowiskowe:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Repozytorium zawiera `netlify.toml`. Build uruchamia `npm run build`, a statyczne pliki są
publikowane z `.output/public`. Adapter Netlify tworzy funkcję obsługującą SSR i routing aplikacji.

Po każdym merge do gałęzi `main` Netlify automatycznie zbuduje i opublikuje nową wersję.

## Sprawdzenie

```sh
npm run lint
npm run build
```
