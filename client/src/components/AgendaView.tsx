import { Plus, Bell } from "lucide-react";
import { CatMap, catOf, PlannerEvent } from "../types";
import { fmtDate, parseDate } from "../date";

interface Props {
  eventsByDate: Record<string, PlannerEvent[]>;
  catMap: CatMap;
  onEdit: (ev: PlannerEvent) => void;
  onAdd: (d: Date) => void;
}

export default function AgendaView({ eventsByDate, catMap, onEdit, onAdd }: Props) {
  const dates = Object.keys(eventsByDate).sort();
  const todayStr = fmtDate(new Date());
  const future = dates.filter((d) => d >= todayStr);

  if (future.length === 0) {
    return (
      <div className="empty-state">
        <p>Niciun eveniment viitor programat.</p>
        <button className="btn-primary" onClick={() => onAdd(new Date())}>
          <Plus size={14} /> Adaugă eveniment
        </button>
      </div>
    );
  }

  return (
    <div className="agenda-view">
      {future.map((d) => (
        <div key={d} className="agenda-group">
          <p className="agenda-date">
            {parseDate(d).toLocaleDateString("ro-RO", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          <ul>
            {eventsByDate[d].map((ev) => {
              const cat = catOf(catMap, ev.category);
              return (
                <li
                  key={ev.id}
                  style={{ ["--c" as string]: cat.color }}
                  onClick={() => onEdit(ev)}
                >
                  <span className="agenda-time">{ev.startTime || "—"}</span>
                  <span className="agenda-title">{ev.title}</span>
                  <span className="agenda-cat-dot" style={{ background: cat.color }} />
                  {ev.reminderMinutes ? <Bell size={12} className="bell-mini" /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
