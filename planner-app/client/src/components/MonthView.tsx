import { Plus, Repeat } from "lucide-react";
import { CatMap, catOf, Occurrence } from "../types";
import { fmtDate, sameDay } from "../date";
import { T } from "../i18n";

interface Props {
  grid: { date: Date; inMonth: boolean }[];
  byDate: Record<string, Occurrence[]>;
  catMap: CatMap;
  selectedDate: Date;
  t: T;
  onSelect: (d: Date) => void;
  onAdd: (d: Date) => void;
}

export default function MonthView({ grid, byDate, catMap, selectedDate, t, onSelect, onAdd }: Props) {
  const todayStr = fmtDate(new Date());
  return (
    <div className="month-view">
      <div className="weekday-row">
        {t.weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="month-grid">
        {grid.map(({ date, inMonth }) => {
          const key = fmtDate(date);
          const items = byDate[key] || [];
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
                  aria-label={t.addEvent}
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="day-events">
                {items.slice(0, 3).map((ev) => {
                  const cat = catOf(catMap, ev.category, t.noCategory);
                  return (
                    <div
                      key={ev.key}
                      className={`event-chip prio-${ev.priority}`}
                      style={{ ["--c" as string]: cat.color, background: cat.color + "26" }}
                    >
                      {!ev.allDay && ev.startTime && (
                        <span className="chip-time">{ev.startTime}</span>
                      )}
                      <span className="chip-label">{ev.title}</span>
                      {ev.recurrence !== "none" && <Repeat size={9} className="chip-rep" />}
                    </div>
                  );
                })}
                {items.length > 3 && (
                  <span className="more-label">
                    +{items.length - 3} {t.more}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
