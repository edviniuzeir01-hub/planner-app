# Bază de date permanentă (Neon Postgres) — datele nu se mai pierd

Aplicația folosește acum PostgreSQL în loc de SQLite. Cu o bază Neon (gratuită,
nu expiră), evenimentele, categoriile și abonamentele de notificări rămân salvate
permanent — indiferent de sleep, restart sau redeploy pe Render.

## 1. Creează baza pe Neon (~3 minute)

1. Intră pe https://neon.tech → **Sign up** (poți cu GitHub).
2. Creează un proiect nou (nume: `planner`, regiune: Europe/Frankfurt e ok).
3. După creare, Neon îți arată un **connection string** de forma:
   ```
   postgresql://user:parola@ep-ceva-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Copiază-l (buton de copy lângă el). Ăsta e tot ce-ți trebuie de la Neon.

## 2. Pune connection string-ul pe Render

Render → serviciul tău → **Environment** → adaugă:

| Key            | Value                                |
|----------------|--------------------------------------|
| `DATABASE_URL` | (connection string-ul copiat de la Neon) |

Salvezi → Render redeployează automat. La pornire, serverul creează singur
tabelele în Neon (vezi în Logs: `[db] tabele verificate/create`).

## 3. Gata

Din acest moment:
- Evenimentele și reminderele **nu se mai pierd niciodată** — nici la sleep,
  nici la redeploy, nici la git push.
- Abonamentele de notificări persistă și ele.
- Codurile utilizatorilor își regăsesc calendarul intact oricând.

## Pentru rulare locală (opțional)

Ca să rulezi serverul local, pune același `DATABASE_URL` în `server/.env`.
Local și producția vor folosi aceeași bază — sau creezi un al doilea proiect
Neon pentru test, ca să nu amesteci datele.

## Note despre planul gratuit Neon

- 0.5 GB stocare — enorm pentru un planner (zeci de mii de evenimente).
- Baza „adoarme" și ea după inactivitate, dar se trezește în ~1s la prima
  interogare — imperceptibil, și NU pierde date (spre deosebire de discul Render).
- Nu expiră după 30 de zile (spre deosebire de Postgres-ul gratuit de la Render).
