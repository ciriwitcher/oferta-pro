# Oferta Pro

Zbuduj responsywną aplikację webową o nazwie „AI Oferta” w języku polskim.

Cel produktu: aplikacja ma pomagać freelancerom i małym firmom generować profesjonalne oferty dla klientów. Na tym etapie zbuduj wyłącznie dopracowany frontend MVP. Nie integruj AI, Supabase, bazy danych, płatności ani zewnętrznych API. Dane mają być przykładowe i przechowywane lokalnie/mockowane.

Technologia i styl:
- TypeScript, React, Tailwind CSS oraz shadcn/ui.
- Nowoczesny, prosty, profesjonalny interfejs SaaS.
- Jasne tło, czytelna typografia, dużo przestrzeni, subtelne obramowania i delikatne cienie.
- Jeden spójny kolor akcentowy, bez przesadnych gradientów.
- Pełna responsywność: desktop, tablet i telefon.
- Wszystkie teksty interfejsu po polsku.
- Zadbaj o dostępność, poprawne etykiety formularzy, stany focus i sensowną hierarchię nagłówków.

Utwórz routing i następujące strony:

1. Landing page „/”
- Logo/nazwa „AI Oferta”.
- Prosty navbar z linkami: Funkcje, Jak to działa, Zaloguj się.
- Hero z nagłówkiem wyjaśniającym wartość produktu, krótkim opisem i głównym CTA „Wypróbuj”.
- CTA prowadzi do rejestracji.
- Sekcja z 3 korzyściami: oszczędność czasu, profesjonalny wygląd, uporządkowana historia ofert.
- Prosta sekcja „Jak to działa” w 3 krokach.
- Końcowe CTA.
- Bez niepotrzebnych sekcji marketingowych.

2. Logowanie „/login” i rejestracja „/register”
- Formularze w estetycznej karcie.
- Logowanie: e-mail, hasło, przycisk „Zaloguj się”.
- Rejestracja: imię lub nazwa firmy, e-mail, hasło, powtórzenie hasła, przycisk „Utwórz konto”.
- Linki między logowaniem i rejestracją.
- To tylko frontend: po zatwierdzeniu formularza przekieruj użytkownika do dashboardu.

3. Dashboard „/dashboard”
- Responsywny layout aplikacji z bocznym menu na desktopie i mobilną nawigacją.
- Nawigacja: Dashboard, Nowa oferta, Historia ofert, Wyloguj.
- Nagłówek powitalny.
- Główny przycisk „Utwórz nową ofertę”.
- Małe kafelki statystyk: wszystkie oferty, szkice, wysłane.
- Lista ostatnich ofert jako tabela na desktopie i karty na telefonie.
- Kolumny/dane: klient, usługa, cena, status, data, akcja „Zobacz”.
- Użyj 4–5 realistycznych przykładowych ofert.

4. Formularz tworzenia oferty „/offers/new”
- Czytelny, wielosekcyjny formularz, ale bez kreatora wieloetapowego.
- Pola:
  * nazwa klienta,
  * branża klienta,
  * problem klienta,
  * proponowana usługa,
  * zakres prac,
  * cena,
  * termin realizacji,
  * dodatkowe informacje,
  * ton oferty: formalny, partnerski lub sprzedażowy.
- Użyj odpowiednich inputów, textarea, select/radio i etykiet.
- Dodaj krótkie pomocnicze opisy tam, gdzie poprawiają zrozumienie.
- Przyciski: „Zapisz szkic” i główny „Utwórz ofertę”.
- Po wysłaniu formularza przejdź do widoku pojedynczej, przykładowo wygenerowanej oferty.
- Zaimplementuj podstawową walidację frontendową wymaganych pól i komunikaty błędów.

5. Historia ofert „/offers”
- Lista wszystkich zapisanych ofert.
- Wyszukiwarka po nazwie klienta lub usłudze.
- Prosty filtr statusu: Wszystkie, Szkic, Gotowa, Wysłana.
- Tabela na desktopie, karty na telefonie.
- Akcja „Zobacz ofertę”.
- Bez zaawansowanych filtrów i eksportów.

6. Widok pojedynczej oferty „/offers/:id”
- Profesjonalny podgląd dokumentu/oferty.
- Nagłówek z nazwą usługodawcy „Studio Nova” oraz numerem oferty.
- Dane klienta, data, termin ważności.
- Sekcje: Wprowadzenie, Zrozumienie problemu, Proponowane rozwiązanie, Zakres prac, Harmonogram, Cena, Warunki współpracy, Kolejne kroki.
- Użyj realistycznego tekstu przykładowego.
- Przyciski: „Edytuj”, „Oznacz jako wysłaną”, „Wróć do historii”.
- Nie dodawaj eksportu PDF ani wysyłki e-mail na tym etapie.

Wymagania funkcjonalne frontendu:
- Działające linki i routing pomiędzy wszystkimi stronami.
- Mockowane dane ofert w jednym, łatwym do późniejszego zastąpienia miejscu.
- Formularz może przechowywać dane w stanie lokalnym lub localStorage, aby demonstracja wyglądała wiarygodnie.
- Dodaj toast/potwierdzenie po zapisaniu szkicu i oznaczeniu oferty jako wysłanej.
- Stany hover, active, focus i disabled.
- Brak niedziałających przycisków; każda widoczna akcja powinna mieć sensowną reakcję.

Ograniczenia:
- Nie dodawaj integracji AI.
- Nie dodawaj prawdziwego uwierzytelniania.
- Nie dodawaj Supabase ani bazy danych.
- Nie dodawaj płatności, cennika, faktur, CRM, czatu, zespołów, ustawień konta ani innych funkcji spoza zakresu.
- Nie rozbudowuj produktu poza opisane MVP.

Na końcu sprawdź responsywność i spójność wszystkich ekranów oraz upewnij się, że projekt uruchamia się bez błędów.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/17cfad05-b039-496c-8a1e-92b182b5bb7f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
