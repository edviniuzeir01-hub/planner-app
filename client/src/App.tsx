import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Bell, BellOff, ChevronLeft, ChevronRight, Search,
  CalendarDays, ListChecks, CalendarClock,
} from "lucide-react";
import {
  CATEGORIES, CategoryKey, MONTH_NAMES, PlannerEvent, EventDraft,
} from "./types";
import { fmtDate, parseDate, getCalendarGrid, minutesUntil, humanCountdown } from "./date";
import { api } from "./api";
import { enablePush, currentPermission, PushState } from "./push";
import MonthView from "./components/MonthView";
import DayView from "./components/DayView";
import AgendaView from "./components/AgendaView";
import EventModal from "./components/EventModal";
import AccountPanel from "./components/AccountPanel";

type ViewMode = "month" | "day" | "agenda";

export default function App() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [search, setSearch] = useState("");
  const [activeCats, setActiveCats] = useState<CategoryKey[]>(
    Object.keys(CATEGORIES) as CategoryKey[]
  );
  const [pushState, setPushState] = useState<PushState>(currentPermission());
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- load ---- */
  const reload = useCallback(async () => {
    try {
      const [list, cfg] = await Promise.all([api.listEvents(), api.getConfig()]);
      setEvents(list);
      setVapidKey(cfg.vapidPublicKey);
      if (!cfg.pushEnabled) setPushState("no-keys");
    } catch (e) {
      setError("Nu mă pot conecta la server. Verifică dacă rulează pe :4000.");
    }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 60000); // resincronizează evenimentele
    return () => clearInterval(id);
  }, [reload]);

  /* ---- push ---- */
  const handleEnablePush = async () => {
    const state = await enablePush(vapidKey);
    setPushState(state);
  };

  /* ---- CRUD ---- */
  const openAdd = (date: Date) => {
    setDraft({
      id: null,
      title: "",
      date: fmtDate(date),
      startTime: "09:00",
      endTime: "",
      category: "curs",
      notes: "",
      reminderMinutes: 15,
    });
  };

  const openEdit = (ev: PlannerEvent) => {
    setDraft({ ...ev });
  };

  const saveDraft = async () => {
    if (!draft || !draft.title.trim() || !draft.date) return;
    const payload = {
      title: draft.title,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      category: draft.category,
      notes: draft.notes,
      reminderMinutes: draft.reminderMinutes,
    };
    try {
      if (draft.id) {
        const updated = await api.updateEvent(draft.id, payload);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await api.createEvent(payload);
        setEvents((prev) => [...prev, created]);
      }
      setDraft(null);
    } catch (e) {
      setError("Salvarea a eșuat. Verifică serverul.");
    }
  };

  const deleteDraft = async () => {
    if (!draft?.id) return;
    try {
      await api.deleteEvent(draft.id);
      setEvents((prev) => prev.filter((e) => e.id !== draft.id));
      setDraft(null);
    } catch (e) {
      setError("Ștergerea a eșuat.");
    }
  };

  /* ---- derived ---- */
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (!activeCats.includes(e.category)) return false;
      if (q && !`${e.title} ${e.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, activeCats, search]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, PlannerEvent[]> = {};
    filteredEvents.forEach((e) => {
      (map[e.date] = map[e.date] || []).push(e);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    );
    return map;
  }, [filteredEvents]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((e) => new Date(`${e.date}T${e.startTime || "00:00"}:00`) >= now)
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.startTime || "00:00"}:00`).getTime() -
          new Date(`${b.date}T${b.startTime || "00:00"}:00`).getTime()
      )
      .slice(0, 6);
  }, [filteredEvents]);

  const grid = useMemo(
    () => getCalendarGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const toggleCat = (key: CategoryKey) =>
    setActiveCats((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );

  const goToday = () => {
    const t = new Date();
    setCursor(t);
    setSelectedDate(t);
  };

  const changeMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const pushLabel =
    pushState === "granted"
      ? "Notificări active"
      : pushState === "denied"
      ? "Notificări blocate"
      : pushState === "unsupported"
      ? "Indisponibile pe acest dispozitiv"
      : pushState === "no-keys"
      ? "Configurează cheile VAPID"
      : "Activează notificări";

  return (
    <div className="planner">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <h1>Planner</h1>
            <p>organizează-ți timpul, cu reminder</p>
          </div>
        </div>

        <div className="view-tabs" role="tablist" aria-label="Vizualizare">
          <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>
            <CalendarDays size={15} /> Lună
          </button>
          <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
            <CalendarClock size={15} /> Zi
          </button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => setView("agenda")}>
            <ListChecks size={15} /> Agendă
          </button>
        </div>

        <button
          className="btn-notif"
          onClick={handleEnablePush}
          disabled={pushState === "granted" || pushState === "unsupported"}
        >
          {pushState === "granted" ? <Bell size={15} /> : <BellOff size={15} />}
          {pushLabel}
        </button>
      </header>

      {error && <div className="banner-error">{error}</div>}

      <div className="layout">
        <main className="content">
          <div className="controls">
            <div className="month-nav">
              <button onClick={() => changeMonth(-1)} aria-label="Luna precedentă">
                <ChevronLeft size={18} />
              </button>
              <span className="month-label">
                {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
              </span>
              <button onClick={() => changeMonth(1)} aria-label="Luna următoare">
                <ChevronRight size={18} />
              </button>
              <button className="today-btn" onClick={goToday}>
                Azi
              </button>
            </div>

            <div className="search-box">
              <Search size={14} />
              <input
                placeholder="Caută evenimente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="cat-filters">
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
              <button
                key={key}
                className={`chip ${activeCats.includes(key) ? "on" : "off"}`}
                style={{ ["--c" as string]: CATEGORIES[key].color }}
                onClick={() => toggleCat(key)}
              >
                <span className="chip-dot" />
                {CATEGORIES[key].label}
              </button>
            ))}
          </div>

          {view === "month" && (
            <MonthView
              grid={grid}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setView("day");
              }}
              onAdd={openAdd}
            />
          )}

          {view === "day" && (
            <DayView
              date={selectedDate}
              events={eventsByDate[fmtDate(selectedDate)] || []}
              onPrev={() =>
                setSelectedDate((d) => {
                  const n = new Date(d);
                  n.setDate(n.getDate() - 1);
                  return n;
                })
              }
              onNext={() =>
                setSelectedDate((d) => {
                  const n = new Date(d);
                  n.setDate(n.getDate() + 1);
                  return n;
                })
              }
              onAdd={() => openAdd(selectedDate)}
              onEdit={openEdit}
            />
          )}

          {view === "agenda" && (
            <AgendaView eventsByDate={eventsByDate} onEdit={openEdit} onAdd={openAdd} />
          )}
        </main>

        <aside className="sidebar">
          <h2>Următoarele evenimente</h2>
          {upcoming.length === 0 && (
            <p className="empty-note">Nimic programat. Adaugă un eveniment ca să apară aici.</p>
          )}
          <ul className="upcoming-list">
            {upcoming.map((ev) => {
              const mins = minutesUntil(ev.date, ev.startTime);
              return (
                <li key={ev.id} onClick={() => openEdit(ev)}>
                  <span className="dot" style={{ background: CATEGORIES[ev.category]?.color }} />
                  <div>
                    <p className="u-title">{ev.title}</p>
                    <p className="u-meta">
                      {parseDate(ev.date).toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "short",
                      })}
                      {ev.startTime ? ` · ${ev.startTime}` : ""} · {humanCountdown(mins)}
                    </p>
                  </div>
                  {ev.reminderMinutes ? <Bell size={13} className="bell-mini" /> : null}
                </li>
              );
            })}
          </ul>

          {pushState === "granted" && (
            <button className="btn-ghost test-btn" onClick={() => api.testPush()}>
              Trimite notificare de test
            </button>
          )}

          <AccountPanel onSwitched={reload} />

          <button className="fab-desktop" onClick={() => openAdd(selectedDate)}>
            <Plus size={16} /> Eveniment nou
          </button>
        </aside>
      </div>

      <button className="fab" onClick={() => openAdd(selectedDate)} aria-label="Adaugă eveniment">
        <Plus size={22} />
      </button>

      {draft && (
        <EventModal
          draft={draft}
          setDraft={setDraft}
          onSave={saveDraft}
          onDelete={draft.id ? deleteDraft : null}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  );
}
