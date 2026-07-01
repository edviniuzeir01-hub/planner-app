import { Plus, ChevronLeft, ChevronRight, Clock, Bell } from "lucide-react";
import { CATEGORIES, PlannerEvent } from "../types";

interface Props {
  date: Date;
  events: PlannerEvent[];
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  onEdit: (ev: PlannerEvent) => void;
}

export default function DayView({ date, events, onPrev, onNext, onAdd, onEdit }: Props) {
  return (
    <div className="day-view">
      <div className="day-view-head">
        <button onClick={onPrev} aria-label="Ziua precedentă">
          <ChevronLeft size={18} />
        </button>
        <p className="day-view-date">
          {date.toLocaleDateString("ro-RO", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <button onClick={onNext} aria-label="Ziua următoare">
          <ChevronRight size={18} />
        </button>
      </div>

      {events.length === 0 && (
        <div className="empty-state">
          <p>Nicio activitate în această zi.</p>
          <button className="btn-primary" onClick={onAdd}>
            <Plus size={14} /> Adaugă eveniment
          </button>
        </div>
      )}

      <ul className="day-list">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="day-item"
            style={{ ["--c" as string]: CATEGORIES[ev.category]?.color }}
            onClick={() => onEdit(ev)}
          >
            <div className="day-item-time">
              <Clock size={13} />
              <span>
                {ev.startTime || "—"}
                {ev.endTime ? `–${ev.endTime}` : ""}
              </span>
            </div>
            <div className="day-item-body">
              <p className="day-item-title">{ev.title}</p>
              {ev.notes && <p className="day-item-notes">{ev.notes}</p>}
              <span className="day-item-cat">{CATEGORIES[ev.category]?.label}</span>
            </div>
            {ev.reminderMinutes ? <Bell size={14} className="bell-mini" /> : null}
          </li>
        ))}
      </ul>

      {events.length > 0 && (
        <button className="btn-primary add-more" onClick={onAdd}>
          <Plus size={14} /> Adaugă eveniment
        </button>
      )}
    </div>
  );
}
