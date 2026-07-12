# Deploy pe Render — pas cu pas

Scopul: serverul rulează non-stop în cloud, ai un link HTTPS fix, aplicația merge
pe telefon și cu laptopul închis.

## Ce îți trebuie
- Cont GitHub
- Cont Render (gratuit) — te loghezi cu GitHub pe https://render.com

---

## Pasul 1 — Generează cheile VAPID (dacă nu le ai deja)

Pe laptop, în folderul `server`:
```powershell
npm run genkeys
```
Notează undeva cele două valori (`VAPID_PUBLIC_KEY` și `VAPID_PRIVATE_KEY`) —
le pui în Render la Pasul 4. Poți folosi aceleași chei ca local.

## Pasul 2 — Urcă proiectul pe GitHub

Din folderul rădăcină `planner-app`:
```powershell
git init
git add .
git commit -m "Planner app"
```
Creează un repository nou pe GitHub (ex. `planner-app`), apoi:
```powershell
git remote add origin https://github.com/UTILIZATORUL_TAU/planner-app.git
git branch -M main
git push -u origin main
```
> `.gitignore` exclude deja `node_modules`, `dist`, `.env` și `*.db` — bine, nu vrei
> să urci cheile sau baza de date.

## Pasul 3 — Creează serviciul pe Render

1. Pe Render: **New +** → **Web Service**.
2. Conectează repository-ul `planner-app` de pe GitHub.
3. Completează:
   - **Name:** planner (sau ce vrei — devine parte din URL)
   - **Region:** Frankfurt (cel mai aproape)
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

## Pasul 4 — Setează variabilele de mediu

Tot în ecranul de creare, la secțiunea **Environment Variables**, adaugă:

| Key                 | Value                              |
|---------------------|------------------------------------|
| `VAPID_PUBLIC_KEY`  | (valoarea de la genkeys)           |
| `VAPID_PRIVATE_KEY` | (valoarea de la genkeys)           |
| `VAPID_SUBJECT`     | `mailto:emailul_tau@example.com`   |

Nu seta `PORT` — Render îl setează automat.

Apasă **Create Web Service**. Render va rula build-ul (durează câteva minute prima
dată — compilează și `better-sqlite3`, e normal).

## Pasul 5 — Gata

Când build-ul se termină, Render îți dă un URL fix, de forma:
```
https://planner-xxxx.onrender.com
```
Deschide-l pe telefon → adaugă pe ecranul principal (Safari pe iPhone / Chrome pe
Android) → „Activează notificări" → „Trimite notificare de test".

Acum merge non-stop, fără laptop.

---

## De știut despre planul gratuit

- **Adoarme după ~15 min de inactivitate.** Prima accesare de după durează ~30–50s
  până pornește serverul înapoi. Pentru un planner personal e ok.
- **Discul e efemer.** La fiecare redeploy (când faci `git push` cu modificări) baza
  de date SQLite se resetează — pierzi evenimentele salvate. Pentru evenimente care
  rezistă la redeploy, ai două variante:
  1. **Disc persistent** (Render Disks) — necesită plan plătit; montezi un disc la
     `/data` și setezi variabila `DATA_DIR=/data`.
  2. **Bază de date externă** — ex. Postgres (Render oferă unul gratuit 90 de zile).
     Ar necesita rescrierea stratului de date; pot ajuta dacă vrei.

Pentru început, planul gratuit e suficient ca să-l ai mereu la tine.

## Actualizări ulterioare

Orice modificare o urci cu `git push` și Render redeployează automat.
Ține minte: redeploy = baza de date se resetează pe planul gratuit fără disc persistent.
