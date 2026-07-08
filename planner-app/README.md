# Planner — aplicație reală (PWA + backend Node)

Calendar personal cu evenimente, ore și **remindere prin notificare push adevărată**.
Reminderele sunt trimise de server, deci ajung pe telefon **și când aplicația e închisă**.

- **client/** — React + TypeScript + Vite, PWA (service worker + manifest)
- **server/** — Node + Express + TypeScript, SQLite (better-sqlite3), Web Push (VAPID)

---

## 1. Ce îți trebuie
- Node.js 18+ (recomandat 20/22)
- Un browser modern. Push funcționează pe Chrome/Edge/Firefox (desktop + Android) și pe
  iOS 16.4+ **doar dacă aplicația e adăugată pe ecranul principal**.

## 2. Pornire rapidă (development)

### a) Serverul
```bash
cd server
npm install
npm run genkeys        # generează cheile VAPID
```
Copiază `.env.example` în `.env` și pune valorile afișate de `genkeys`:
```bash
cp .env.example .env
# completează VAPID_PUBLIC_KEY și VAPID_PRIVATE_KEY
```
Apoi pornește:
```bash
npm run dev            # http://localhost:4000
```

### b) Clientul (în alt terminal)
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```
Deschide `http://localhost:5173`. Apasă **„Activează notificări"**, apoi
**„Trimite notificare de test"** din bara laterală ca să confirmi că push-ul merge.

> În dev, cererile `/api` sunt proxate automat spre server (`:4000`) — vezi `client/vite.config.ts`.

## 3. Cum funcționează reminderele
1. Clientul înregistrează service worker-ul și se abonează la push (cu cheia VAPID).
2. Abonamentul e trimis la server (`/api/subscribe`) și salvat în SQLite.
3. La fiecare eveniment cu reminder, un scheduler pe server verifică la 30s dacă a venit
   momentul și trimite notificarea prin Web Push. Service worker-ul o afișează.

Pentru că trimiterea vine de la server, notificarea apare chiar dacă browserul/aplicația
sunt închise (cât timp serverul rulează și dispozitivul e online).

## 4. Producție + acces de pe telefon

### Build
```bash
cd client && npm run build     # generează client/dist
cd ../server && npm run build  # generează server/dist
```
Serverul servește automat build-ul clientului. Pornește:
```bash
cd server && npm start         # http://localhost:4000 (client + API la un loc)
```

### Ca să-l accesezi de pe telefon
Push-ul are nevoie de **HTTPS** (excepție: `localhost`). Două variante simple:

- **Rapid / testare:** rulează serverul local și expune-l cu un tunel, ex:
  ```bash
  npx localtunnel --port 4000
  # sau: ngrok http 4000
  ```
  Deschizi link-ul HTTPS pe telefon.

- **Permanent:** urcă serverul pe un VPS/PaaS (Render, Railway, Fly.io, un mic VPS cu
  Nginx + certbot). Setează variabilele VAPID din `.env` acolo.

Pe telefon: deschide site-ul → meniul browserului → **„Adaugă pe ecranul principal"**.
Aplicația se instalează ca PWA (iconiță proprie, fullscreen). Pe iOS acest pas e
obligatoriu pentru ca push-ul să funcționeze.

## 5. Structura pe scurt
```
server/src/
  index.ts      REST API (events CRUD, subscribe) + servește clientul
  db.ts         SQLite (tabele events, subscriptions)
  push.ts       trimitere Web Push, curăță abonamente moarte
  scheduler.ts  verifică reminderele scadente la 30s
  genkeys.ts    generează cheile VAPID
client/src/
  App.tsx       ecranul principal (luni/zi/agendă, filtre, căutare)
  api.ts        client HTTP
  push.ts       service worker + abonare push
  components/   MonthView, DayView, AgendaView, EventModal
  public/sw.js  service worker (push + notificări + cache offline)
```

## 6. Idei de extins
- Autentificare cu parolă sau Google (acum e cod privat per persoană).
- Evenimente recurente (zilnic/săptămânal).
- Sincronizare cu Google Calendar (import iCal).
- Categorii personalizabile din UI.

## Calendare separate per utilizator

Fiecare persoană care deschide aplicația primește automat un **cod privat** și
un **calendar propriu**. Evenimentele și notificările sunt legate de acel cod,
deci utilizatorii nu se văd și nu-și primesc notificările între ei.

- Codul se salvează local pe dispozitiv (nu trebuie login).
- Ca să deschizi **același** calendar pe alt dispozitiv (ex. laptop + telefon):
  în panoul „Calendarul meu" apeși copiere → primești un link de forma
  `.../#code=XXXX`. Îl deschizi pe al doilea dispozitiv și adoptă automat codul.
- „Introdu alt cod" îți permite să treci pe alt calendar (al tău, de pe alt device).
