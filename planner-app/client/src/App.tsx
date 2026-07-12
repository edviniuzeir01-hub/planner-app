import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Bell, BellOff, ChevronLeft, ChevronRight, Search,
  CalendarDays, ListChecks, CalendarClock,
} from "lucide-react";
import { CatMap, catOf, Category, Occurrence, PlannerEvent, EventDraft } from "./types";
import { fmtDate, parseDate, getCalendarGrid, minutesUntil } from "./date";
import { expandAll } from "./recurrence";
import { api } from "./api";
import { enablePush, currentPermission, PushState } from "./push";
import { getLang, t as tr, Lang } from "./i18n";
import MonthView from "./components/MonthView";
import DayView from "./components/DayView";
import AgendaView from "./components/AgendaView";
import EventModal from "./components/EventModal";
import AccountPanel from "./components/AccountPanel";
import ThemePicker from "./components/ThemePicker";
import CategoryManager from "./components/CategoryManager";

type ViewMode = "month" | "day" | "agenda";

export default function App() {
  const [lang, setLang] = useState<Lang>(getLang());
  const t = tr(lang);

  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [search, setSearch] = useState("");
  const [activeCats, setActiveCats] = useState<string[] | null>(null);
  const [pushState, setPushState] = useState<PushState>(currentPermission());
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const catMap: CatMap = useMemo(() => {
    const m: CatMap = {};
    categories.forEach((c) => (m[c.id] = { label: c.label, color: c.color }));
    return m;
  }, [categories]);

  /* ---- load ---- */
  const reload = useCallback(async () => {
    try {
      const [list, cats, cfg] = await Promise.all([
        api.listEvents(),
        api.listCategories(),
        api.getConfig(),
      ]);
      setEvents(list);
      setCategories(cats);
      setVapidKey(cfg.vapidPublicKey);
      if (!cfg.pushEnabled) setPushState("no-keys");
      setError(null);
    } catch {
      setError(t.connectionError);
    }
  }, [t.connectionError]);

  const reloadCategories = useCallback(async () => {
    try {
      setCategories(await api.listCategories());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 60000);
    return () => clearInterval(id);
  }, [reload]);

  /* ---- push ---- */
  const handleEnablePush = async () => setPushState(await enablePush(vapidKey));

  /* ---- CRUD ---- */
  const firstCat = categories[0]?.id || "personal";

  const openAdd = (date: Date) =>
    setDraft({
      id: null,
      title: "",
      date: fmtDate(date),
      startTime: "09:00",
      endTime: "",
      category: firstCat,
      notes: "",
      reminderMinutes: 15,
      allDay: false,
      priority: "normal",
      recurrence: "none",
      recurrenceEnd: "",
    });

  // La editarea unei ocurențe edităm evenimentul-șablon.
  const openEdit = (occ: Occurrence) => {
    const base = events.find((e) => e.id === occ.id);
    if (base) setDraft({ ...base });
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
      allDay: draft.allDay,
      priority: draft.priority,
      recurrence: draft.recurrence,
      recurrenceEnd: draft.recurrenceEnd,
    };
    try {
      if (draft.id) {
        const up = await api.updateEvent(draft.id, payload);
        setEvents((p) => p.map((e) => (e.id === up.id ? up : e)));
      } else {
        const created = await api.createEvent(payload);
        setEvents((p) => [...p, created]);
      }
      setDraft(null);
    } catch {
      setError(t.saveError);
    }
  };

  const deleteDraft = async () => {
    if (!draft?.id) return;
    try {
      await api.deleteEvent(draft.id);
      setEvents((p) => p.filter((e) => e.id !== draft.id));
      setDraft(null);
    } catch {
      setError(t.deleteError);
    }
  };

  /* ---- derived: filtrare + extindere recurențe ---- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (activeCats && !activeCats.includes(e.category)) return false;
      if (q && !`${e.title} ${e.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, activeCats, search]);

  // Fereastră largă, ca să acopere luna afișată + agenda viitoare.
  const window_ = useMemo(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 13, 0);
    const today = new Date();
    return {
      from: fmtDate(from < today ? from : today),
      to: fmtDate(to),
    };
  }, [cursor]);

  const occurrences = useMemo(
    () => expandAll(filtered, window_.from, window_.to),
    [filtered, window_]
  );

  const byDate = useMemo(() => {
    const m: Record<string, Occurrence[]> = {};
    occurrences.forEach((o) => (m[o.occDate] = m[o.occDate] || []).push(o));
    Object.values(m).forEach((list) =>
      list.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return (a.startTime || "").localeCompare(b.startTime || "");
      })
    );
    return m;
  }, [occurrences]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return occurrences
      .filter((o) => new Date(`${o.occDate}T${o.allDay ? "23:59" : o.startTime || "00:00"}:00`) >= now)
      .sort(
        (a, b) =>
          new Date(`${a.occDate}T${a.startTime || "00:00"}:00`).getTime() -
          new Date(`${b.occDate}T${b.startTime || "00:00"}:00`).getTime()
      )
      .slice(0, 6);
  }, [occurrences]);

  const grid = useMemo(
    () => getCalendarGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const toggleCat = (id: string) =>
    setActiveCats((prev) => {
      const base = prev ?? categories.map((c) => c.id);
      return base.includes(id) ? base.filter((c) => c !== id) : [...base, id];
    });
  const isCatActive = (id: string) => !activeCats || activeCats.includes(id);

  const countdown = (mins: number) => {
    if (mins < 0) return t.past;
    if (mins < 60) return t.inTime(`${mins} min`);
    if (mins < 1440) return t.inTime(`${Math.round(mins / 60)} h`);
    return t.inTime(`${Math.round(mins / 1440)} ${t.days}`);
  };

  const pushLabel =
    pushState === "granted"
      ? t.notificationsOn
      : pushState === "denied"
      ? t.notificationsBlocked
      : pushState === "unsupported"
      ? t.notificationsUnavailable
      : pushState === "no-keys"
      ? t.notificationsSetup
      : t.enableNotifications;

  return (
    <div className="planner">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <h1>{t.appName}</h1>
            <p>{t.tagline}</p>
          </div>
        </div>

        <div className="view-tabs" role="tablist">
          <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>
            <CalendarDays size={15} /> {t.month}
          </button>
          <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
            <CalendarClock size={15} /> {t.day}
          </button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => setView("agenda")}>
            <ListChecks size={15} /> {t.agenda}
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
              <button
                onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="month-label">
                {t.months[cursor.getMonth()]} {cursor.getFullYear()}
              </span>
              <button
                onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="today-btn"
                onClick={() => {
                  const d = new Date();
                  setCursor(d);
                  setSelectedDate(d);
                }}
              >
                {t.today}
              </button>
            </div>

            <div className="search-box">
              <Search size={14} />
              <input
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="cat-filters">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`chip ${isCatActive(cat.id) ? "on" : "off"}`}
                style={{ ["--c" as string]: cat.color }}
                onClick={() => toggleCat(cat.id)}
              >
                <span className="chip-dot" />
                {cat.label}
              </button>
            ))}
          </div>

          {view === "month" && (
            <MonthView
              grid={grid}
              byDate={byDate}
              catMap={catMap}
              selectedDate={selectedDate}
              t={t}
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
              items={byDate[fmtDate(selectedDate)] || []}
              catMap={catMap}
              t={t}
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
            <AgendaView byDate={byDate} catMap={catMap} t={t} onEdit={openEdit} onAdd={openAdd} />
          )}
        </main>

        <aside className="sidebar">
          <h2>{t.upcoming}</h2>
          {upcoming.length === 0 && <p className="empty-note">{t.nothingPlanned}</p>}
          <ul className="upcoming-list">
            {upcoming.map((ev) => {
              const cat = catOf(catMap, ev.category, t.noCategory);
              const mins = minutesUntil(ev.occDate, ev.allDay ? "09:00" : ev.startTime);
              return (
                <li key={ev.key} onClick={() => openEdit(ev)}>
                  <span className="dot" style={{ background: cat.color }} />
                  <div>
                    <p className="u-title">{ev.title}</p>
                    <p className="u-meta">
                      {parseDate(ev.occDate).toLocaleDateString(t.locale, {
                        day: "2-digit",
                        month: "short",
                      })}
                      {ev.allDay ? "" : ev.startTime ? ` · ${ev.startTime}` : ""} ·{" "}
                      {countdown(mins)}
                    </p>
                  </div>
                  {ev.reminderMinutes !== null && <Bell size={13} className="bell-mini" />}
                </li>
              );
            })}
          </ul>

          {pushState === "granted" && (
            <button className="btn-ghost test-btn" onClick={() => api.testPush()}>
              {t.testNotification}
            </button>
          )}

          <CategoryManager categories={categories} t={t} onChanged={reloadCategories} />
          <AccountPanel t={t} onSwitched={reload} />
          <ThemePicker t={t} lang={lang} onLangChange={setLang} />

          <button className="fab-desktop" onClick={() => openAdd(selectedDate)}>
            <Plus size={16} /> {t.newEvent}
          </button>
        </aside>
      </div>

      <button className="fab" onClick={() => openAdd(selectedDate)} aria-label={t.addEvent}>
        <Plus size={22} />
      </button>

      {draft && (
        <EventModal
          draft={draft}
          categories={categories}
          t={t}
          setDraft={setDraft}
          onSave={saveDraft}
          onDelete={draft.id ? deleteDraft : null}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  );
}
