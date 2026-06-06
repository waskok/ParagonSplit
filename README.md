# ParagonSplit

Aplikacja webowa (PWA) do skanowania paragonów i sprawiedliwego dzielenia kosztów w grupach — współlokatorzy, znajomi, wspólne zakupy.

Zamiast ręcznie przepisywać pozycje z paragonu, wystarczy zrobić zdjęcie. System OCR rozpoznaje produkty, przypisuje je do członków grupy i automatycznie liczy, kto ile płaci.

---

## Funkcje

- **Skanowanie paragonów** — OCR przez Google Cloud Vision, parser pod polskie sklepy (Biedronka, Lidl, Rossmann i inne)
- **Grupy wydatków** — tworzenie grup, zaproszenia e-mail z akceptacją/odrzuceniem
- **Podział kosztów** — wiele osób na produkt, równy podział ceny; podsumowanie „kto ile płaci”
- **Edycja ręczna** — korekta pozycji OCR, dodawanie brakujących produktów
- **Mobile-first PWA** — instalacja na telefonie, tryb standalone, tunel HTTPS do testów na urządzeniu

---

## Stos technologiczny

| Warstwa | Technologie |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, PWA (vite-plugin-pwa) |
| Backend | Node.js, Express, TypeScript |
| Baza danych | PostgreSQL, Prisma ORM |
| OCR | Google Cloud Vision API |
| Auth | JWT, bcrypt |

---

## Architektura

```text
┌─────────────────┐     REST / JWT      ┌─────────────────┐
│  React PWA      │ ◄──────────────────► │  Express API    │
│  (Vite)         │                      │  (Node.js)      │
└─────────────────┘                      └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │  PostgreSQL     │
                                         │  (Prisma)       │
                                         └─────────────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │ Google Vision   │
                                         │ (OCR)           │
                                         └─────────────────┘
```

---

## Wymagania

- **Node.js** 18+
- **PostgreSQL** (lokalnie lub np. [Neon](https://neon.tech))
- **Klucz Google Cloud Vision API** — do skanowania paragonów

---

## Uruchomienie lokalne

### 1. Backend

```bash
cd backend
cp .env.example .env
# Uzupełnij DATABASE_URL, JWT_SECRET, GOOGLE_CLOUD_VISION_API_KEY

npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Serwer startuje domyślnie na `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL zostaw puste (proxy Vite) lub ustaw URL backendu

npm install
npm run dev
```

Aplikacja: `http://localhost:5173`

### 3. Test na telefonie (PWA)

**Tryb A — tunel HTTPS (zalecany, pełna PWA):**

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend w sieci LAN
cd frontend && npm run dev:phone

# Terminal 3 — tunel Cloudflare
cd frontend && npm run tunnel
```

Otwórz wygenerowany link `https://….trycloudflare.com` na telefonie i zainstaluj aplikację.

**Tryb B — bezpośrednio po IP w LAN:**

Ustaw w `frontend/.env` adres backendu (`VITE_API_URL=http://TWOJE_IP:4000`) i uruchom `npm run dev:phone`.

---

## Zmienne środowiskowe

### Backend (`backend/.env`)

| Zmienna | Opis |
|---------|------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Sekret JWT (min. 32 znaki na produkcji) |
| `GOOGLE_CLOUD_VISION_API_KEY` | Klucz API Google Vision |
| `OCR_MAX_TOTAL` | Limit skanów łącznie (domyślnie 500) |
| `OCR_MAX_PER_WINDOW` | Limit skanów w oknie czasowym (domyślnie 10) |
| `OCR_WINDOW_MINUTES` | Długość okna w minutach (domyślnie 10) |
| `CORS_ORIGINS` | Dozwolone originy (produkcja), np. `https://app.example.com` |
| `NODE_ENV` | `development` / `production` |

### Frontend (`frontend/.env`)

| Zmienna | Opis |
|---------|------|
| `VITE_API_URL` | URL backendu; puste = proxy Vite (`/api`) |

> **Uwaga:** Pliki `.env` nie trafiają do repozytorium. Sekrety ustaw wyłącznie lokalnie lub w panelu hostingu.

---

## Bezpieczeństwo

- Hasła hashowane (bcrypt), API chronione JWT
- Rate limiting na logowanie, rejestrację i skan OCR
- Zdjęcia paragonów serwowane tylko przez endpoint z autoryzacją (brak publicznego `/uploads`)
- CORS ograniczony na produkcji
- Skrypt weryfikacji przed pushem: `node scripts/check-no-secrets.mjs`

---

## Struktura projektu

```text
ParagonSplit/
├── backend/
│   ├── prisma/           # Schema i migracje bazy
│   ├── src/
│   │   ├── controllers/  # Logika API
│   │   ├── middlewares/  # Auth, rate limiting
│   │   ├── routes/       # Endpointy REST
│   │   ├── services/     # OCR, Vision API
│   │   └── utils/        # Parser paragonów, JWT
│   └── scripts/          # Testy parsera
├── frontend/
│   ├── src/
│   │   ├── components/   # UI (mobile-first)
│   │   ├── services/     # Klient API
│   │   └── views/        # Ekrany aplikacji
│   └── scripts/          # Tunel do testów na telefonie
└── scripts/
    └── check-no-secrets.mjs
```

---

## API (skrót)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/api/auth/register` | Rejestracja |
| `POST` | `/api/auth/login` | Logowanie |
| `GET` | `/api/groups` | Moje grupy |
| `POST` | `/api/groups/:id/invite` | Zaproszenie do grupy |
| `POST` | `/api/receipts/scan` | Skan paragonu (multipart) |
| `GET` | `/api/receipts/:id` | Szczegóły paragonu |
| `GET` | `/api/receipts/:id/image` | Zdjęcie paragonu (auth) |

Pełna lista endpointów w plikach `backend/src/routes/`.

---

## Autor

**waskok** — [GitHub](https://github.com/waskok/ParagonSplit)
