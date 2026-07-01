import { Plus } from "lucide-react";
import { CATEGORIES, DAY_LABELS, PlannerEvent } from "../types";
import { fmtDate, sameDay } from "../date";

interface Props {
  grid: { date: Date; inMonth: boolean }[];
  eventsByDate: Record<string, PlannerEvent[]>;
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onAdd: (d: Date) => void;
}

export default function MonthView({ grid, eventsByDate, selectedDate, onSelect, onAdd }: Props) {
  const todayStr = fmtDate(new Date());
  return (
    <div className="month-view">
      <div className="weekday-row">
        {DAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="month-grid">
        {grid.map(({ date, inMonth }) => {
          const key = fmtDate(date);
          const dayEvents = eventsByDate[key] || [];
          const isToday = key === todayStr;
          const isSelected = sameDay(date, selectedDate);
          return (
            <div
              key={key}
              className={`day-cell ${inMonth ? "" : "out"} ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(date)}
            >
              <div className="day-cell-head">
                <span className={`day-num ${isToday ? "today" : ""}`}>{date.getDate()}</span>
                <button
                  className="quick-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(date);
                  }}
                  aria-label="Adaugă eveniment"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="day-events">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className="event-chip"
                    style={{ ["--c" as string]: CATEGORIES[ev.category]?.color }}
                  >
                    {ev.startTime && <span className="chip-time">{ev.startTime}</span>}
                    <span className="chip-label">{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="more-label">+{dayEvents.length - 3} mai multe</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
