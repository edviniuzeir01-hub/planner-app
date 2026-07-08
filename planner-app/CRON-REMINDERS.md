# Remindere de încredere chiar și când serverul doarme

Pe planul gratuit Render serverul adoarme după 15 min de inactivitate, iar cât doarme
nu verifică reminderele. Soluția: un **cron extern** (gratuit) apelează serverul la
fiecare 5 minute. Apelul trezește serverul ȘI trimite reminderele scadente.

## 1. Setează un secret pe Render

În Render → serviciul tău → **Environment** → adaugă o variabilă:

| Key           | Value                                  |
|---------------|----------------------------------------|
| `CRON_SECRET` | un șir lung și aleatoriu (ex. `k7f9x2mQ8vL3pR1wZ`) |

Salvezi (declanșează un redeploy). Inventează tu secretul — orice combinație lungă
de litere și cifre. Îl folosești la pasul următor.

## 2. Creează cron-ul pe cron-job.org

1. Intră pe https://cron-job.org și fă-ți cont gratuit.
2. **Create cronjob.**
3. **Title:** Planner reminders
4. **URL:**
   ```
   https://planner-app-vjbw.onrender.com/api/run-reminders?key=SECRETUL_TAU
   ```
   (înlocuiește `SECRETUL_TAU` cu valoarea din `CRON_SECRET`; înlocuiește domeniul
   cu al tău dacă diferă)
5. **Schedule:** every 5 minutes (la fiecare 5 minute).
6. **Save.**

Gata. La fiecare 5 minute cron-ul apelează serverul; dacă dormea, se trezește și
trimite notificările scadente. Telefoanele le primesc chiar cu aplicația/telefonul
închise.

## Ce înseamnă asta în practică
- Reminderele pleacă cu o precizie de ~5 minute (intervalul cron-ului). Pentru un
  planner e perfect ok. Pentru mai precis, pune cron-ul la 1 minut.
- Efect secundar: apelul la 5 min ține serverul aproape mereu treaz, deci consumă
  din cele 750 h/lună gratuite. Cu un singur serviciu, intri lejer în limită.
- Poți verifica manual că merge deschizând în browser URL-ul cu `?key=...`:
  ar trebui să vezi `{"ok":true,"sent":N}`.

## Test rapid
1. Creează un eveniment peste ~6 minute, cu reminder „cu 5 minute înainte".
2. Închide aplicația / blochează telefonul.
3. La următorul tick de cron după momentul reminderului, ar trebui să primești
   notificarea, fără să fi deschis nimic.
