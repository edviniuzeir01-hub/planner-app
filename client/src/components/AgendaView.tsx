import { Plus, Bell, Repeat } from "lucide-react";
import { CatMap, catOf, Occurrence } from "../types";
import { fmtDate, parseDate } from "../date";
import { T } from "../i18n";

interface Props {
  byDate: Record<string, Occurrence[]>;
  catMap: CatMap;
  t: T;
  onEdit: (ev: Occurrence) => void;
  onAdd: (d: Date) => void;
}

export default function AgendaView({ byDate, catMap, t, onEdit, onAdd }: Props) {
  const todayStr = fmtDate(new Date());
  const future = Object.keys(byDate).sort().filter((d) => d >= todayStr);

  if (future.length === 0) {
    return (
      <div className="empty-state">
        <p>{t.noUpcoming}</p>
        <button className="btn-primary" onClick={() => onAdd(new Date())}>
          <Plus size={14} /> {t.addEvent}
        </button>
      </div>
    );
  }

  return (
    <div className="agenda-view">
      {future.map((d) => (
        <div key={d} className="agenda-group">
          <p className="agenda-date">
            {parseDate(d).toLocaleDateString(t.locale, {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          <ul>
            {byDate[d].map((ev) => {
              const cat = catOf(catMap, ev.category, t.noCategory);
              return (
                <li
                  key={ev.key}
                  className={`prio-${ev.priority}`}
                  style={{ ["--c" as string]: cat.color }}
                  onClick={() => onEdit(ev)}
                >
                  <span className="agenda-time">
                    {ev.allDay ? "—" : ev.startTime || "—"}
                  </span>
                  <span className="agenda-title">{ev.title}</span>
                  {ev.recurrence !== "none" && <Repeat size={11} className="bell-mini" />}
                  <span className="agenda-cat-dot" style={{ background: cat.color }} />
                  {ev.reminderMinutes !== null && <Bell size={12} className="bell-mini" />}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
