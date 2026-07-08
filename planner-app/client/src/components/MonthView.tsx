import { Plus } from "lucide-react";
import { CatMap, catOf, DAY_LABELS, PlannerEvent } from "../types";
import { fmtDate, sameDay } from "../date";

interface Props {
  grid: { date: Date; inMonth: boolean }[];
  eventsByDate: Record<string, PlannerEvent[]>;
  catMap: CatMap;
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onAdd: (d: Date) => void;
}

export default function MonthView({ grid, eventsByDate, catMap, selectedDate, onSelect, onAdd }: Props) {
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
                {dayEvents.slice(0, 3).map((ev) => {
                  const cat = catOf(catMap, ev.category);
                  return (
                    <div
                      key={ev.id}
                      className="event-chip"
                      style={{ ["--c" as string]: cat.color, background: cat.color + "22" }}
                    >
                      {ev.startTime && <span className="chip-time">{ev.startTime}</span>}
                      <span className="chip-label">{ev.title}</span>
                    </div>
                  );
                })}
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
