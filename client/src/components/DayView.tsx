import { Plus, ChevronLeft, ChevronRight, Clock, Bell, Repeat } from "lucide-react";
import { CatMap, catOf, Occurrence } from "../types";
import { T } from "../i18n";

interface Props {
  date: Date;
  items: Occurrence[];
  catMap: CatMap;
  t: T;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  onEdit: (ev: Occurrence) => void;
}

export default function DayView({ date, items, catMap, t, onPrev, onNext, onAdd, onEdit }: Props) {
  return (
    <div className="day-view">
      <div className="day-view-head">
        <button onClick={onPrev} aria-label="←">
          <ChevronLeft size={18} />
        </button>
        <p className="day-view-date">
          {date.toLocaleDateString(t.locale, {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <button onClick={onNext} aria-label="→">
          <ChevronRight size={18} />
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <p>{t.noEventsToday}</p>
          <button className="btn-primary" onClick={onAdd}>
            <Plus size={14} /> {t.addEvent}
          </button>
        </div>
      )}

      <ul className="day-list">
        {items.map((ev) => {
          const cat = catOf(catMap, ev.category, t.noCategory);
          return (
            <li
              key={ev.key}
              className={`day-item prio-${ev.priority}`}
              style={{ ["--c" as string]: cat.color }}
              onClick={() => onEdit(ev)}
            >
              <div className="day-item-time">
                <Clock size={13} />
                <span>
                  {ev.allDay
                    ? t.allDayLabel
                    : `${ev.startTime || "—"}${ev.endTime ? `–${ev.endTime}` : ""}`}
                </span>
              </div>
              <div className="day-item-body">
                <p className="day-item-title">{ev.title}</p>
                {ev.notes && <p className="day-item-notes">{ev.notes}</p>}
                <span className="day-item-cat">
                  {cat.label}
                  {ev.recurrence !== "none" && (
                    <>
                      {" · "}
                      <Repeat size={10} />
                    </>
                  )}
                </span>
              </div>
              {ev.reminderMinutes !== null && <Bell size={14} className="bell-mini" />}
            </li>
          );
        })}
      </ul>

      {items.length > 0 && (
        <button className="btn-primary add-more" onClick={onAdd}>
          <Plus size={14} /> {t.addEvent}
        </button>
      )}
    </div>
  );
}
