# System Zarządzania Budżetem Domowym (ParagonSplit)

System kliencko-serwerowy przeznaczony do automatyzacji zarządzania kosztami w grupach oraz rozliczania wspólnych wydatków. Projekt jest w fazie aktywnego rozwoju. Obecna wersja implementuje kompletną warstwę uwierzytelniania, autoryzacji oraz zarządzania sesją użytkownika po stronie backendu i frontendu.

## Stos Technologiczny

*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS.
*   **Backend:** Node.js, Express.js, TypeScript.
*   **Baza danych i ORM:** PostgreSQL, Prisma ORM.
*   **Autoryzacja:** JSON Web Tokens (JWT), hashowanie haseł przy użyciu bcryptjs.

## Aktualny Status Projektu i Zaimplementowane Funkcje

### 1. Warstwa Serwerowa (Backend)
*   **Autoryzacja użytkowników:** Kompletne punkty końcowe (endpoints) dla rejestracji (`/api/auth/register`) oraz logowania (`/api/auth/login`).
*   **Bezpieczeństwo danych:** Implementacja hashowania haseł algorytmem bcryptjs przed zapisem do bazy danych oraz generowanie tokenów JWT zabezpieczonych kluczem kryptograficznym.
*   **Modelowanie relacji:** Architektura bazy danych oparta na modelach Prisma, uwzględniająca strukturę użytkowników oraz przygotowane relacje pod przyszłe moduły grupowe.

### 2. Warstwa Kliencka (Frontend)
*   **Zarządzanie stanem autoryzacji:** Integracja z API serwera, obsługa formularzy rejestracji i logowania z pełną walidacją pól oraz obsługą komunikatów o błędach.
*   **Persystencja sesji:** Zastosowanie mechanizmu localStorage do przechowywania tokenów JWT i podtrzymywania sesji użytkownika.

## Planowane Funkcjonalności (Roadmap)

*   **Integracja z Google Cloud Vision API:** Wdrożenie modułu OCR (Text Detection) zoptymalizowanego pod kątem analizy polskich paragonów fiskalnych i automatycznego mapowania pozycji na użytkowników.
*   **Moduł Grupowy:** Tworzenie grup rozliczeniowych dla współlokatorów lub znajomych, dodawanie wspólnych wydatków i automatyczne wyliczanie salda zadłużenia.
