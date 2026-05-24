# ParagonSplit


ParagonSplit to zaawansowany system mobilno-serwerowy przeznaczony do automatyzacji zarządzania domowym budżetem oraz bezkonfliktowego rozliczania kosztów grupowych[cite: 1, 2]. System dedykowany jest współlokatorom, studentom oraz grupom znajomych dzielącym wspólne wydatki[cite: 1, 2]. Dzięki zastosowaniu technologii OCR, aplikacja eliminuje konieczność ręcznego przepisywania rachunków, automatycznie mapując pozycje z paragonu na poszczególnych użytkowników[cite: 1, 2].

## 🛠️ Architektura i Stos Technologiczny

System opiera się na architekturze klient-serwer (Client-Server Architecture) zapewniającej skalowalność i separację warstw.

* **Frontend:** React Native (kompilowany natywnie do systemów Android oraz iOS)
* **Backend:** Node.js z frameworkiem Express.js (RESTful API)[cite: 1, 3]
* **Baza Danych:** Relacyjna baza PostgreSQL / MySQL (zarządzana przez ORM)[cite: 1, 3]
* **Silnik OCR:** Google Cloud Vision API (Text Detection zoptymalizowane pod polskie paragony fiskalne)[cite: 1, 3]

```text
├── backend/          # Kod źródłowy serwera Express.js, API, integracja OCR, migracje bazy danych
├── frontend/         # Kod źródłowy aplikacji mobilnej React Native (Android/iOS)
├── docs/             # Dokumentacja techniczna, schematy bazy danych i makiety UI
└── README.md         # Główny dokument informacyjny projektu
