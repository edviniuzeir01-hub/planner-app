import { useState } from "react";
import { X, Trash2, Check, Repeat, Flag, Bell, Clock } from "lucide-react";
import { Category, EventDraft, Priority, Recurrence, REMINDER_PRESETS } from "../types";
import { T } from "../i18n";

interface Props {
  draft: EventDraft;
  categories: Category[];
  t: T;
  setDraft: (d: EventDraft) => void;
  onSave: () => void;
  onDelete: (() => void) | null;
  onClose: () => void;
}

export default function EventModal({ draft, categories, t, setDraft, onSave, onDelete, onClose }: Props) {
  const isPreset =
    draft.reminderMinutes === null || REMINDER_PRESETS.includes(draft.reminderMinutes);
  const [customMode, setCustomMode] = useState(!isPreset);

  const set = <K extends keyof EventDraft>(field: K, value: EventDraft[K]) =>
    setDraft({ ...draft, [field]: value });

  const reminderLabel = (m: number) => {
    if (m === 0) return t.reminderNone;
    if (m >= 1440) {
      const d = m / 1440;
      return `${d} ${d === 1 ? (t.locale === "ro-RO" ? "zi" : "day") : t.days} ${t.before}`;
    }
    if (m >= 60) {
      const h = m / 60;
      return `${h} ${h === 1 ? t.hour : t.hours} ${t.before}`;
    }
    return `${m} ${t.minutes} ${t.before}`;
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{draft.id ? t.editEvent : t.newEvent}</h3>
          <button onClick={onClose} aria-label={t.cancel}>
            <X size={18} />
          </button>
        </div>

        <label className="field">
          <span>{t.title}</span>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t.titlePlaceholder}
          />
        </label>

        {/* toată ziua */}
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={draft.allDay}
            onChange={(e) => set("allDay", e.target.checked)}
          />
          <Clock size={13} />
          <span>{t.allDay}</span>
        </label>

        <div className="field-row">
          <label className="field">
            <span>{t.date}</span>
            <input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
          </label>
          {!draft.allDay && (
            <>
              <label className="field">
                <span>{t.startTime}</span>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.endTime}</span>
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                />
              </label>
            </>
          )}
        </div>

        {/* categorie */}
        <div className="field">
          <span>{t.category}</span>
          <div className="cat-select">
            {categories.length === 0 && <p className="cat-empty">{t.noCategories}</p>}
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`cat-option ${draft.category === cat.id ? "active" : ""}`}
                style={{ ["--c" as string]: cat.color }}
                onClick={() => set("category", cat.id)}
              >
                <span className="chip-dot" /> {cat.label}
                {draft.category === cat.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>

        {/* prioritate */}
        <div className="field">
          <span>
            <Flag size={11} /> {t.priority}
          </span>
          <div className="seg-group">
            {(
              [
                ["low", t.priorityLow],
                ["normal", t.priorityNormal],
                ["high", t.priorityHigh],
              ] as [Priority, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`seg ${draft.priority === val ? "active" : ""} prio-${val}`}
                onClick={() => set("priority", val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* recurență */}
        <div className="field-row">
          <label className="field">
            <span>
              <Repeat size={11} /> {t.repeat}
            </span>
            <select
              value={draft.recurrence}
              onChange={(e) => set("recurrence", e.target.value as Recurrence)}
            >
              <option value="none">{t.repeatNone}</option>
              <option value="daily">{t.repeatDaily}</option>
              <option value="weekly">{t.repeatWeekly}</option>
              <option value="monthly">{t.repeatMonthly}</option>
            </select>
          </label>
          {draft.recurrence !== "none" && (
            <label className="field">
              <span>{t.repeatUntil}</span>
              <input
                type="date"
                value={draft.recurrenceEnd}
                onChange={(e) => set("recurrenceEnd", e.target.value)}
              />
            </label>
          )}
        </div>

        {/* reminder */}
        <div className="field">
          <span>
            <Bell size={11} /> {t.reminder}
          </span>
          {!customMode ? (
            <select
              value={draft.reminderMinutes === null ? "" : String(draft.reminderMinutes)}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustomMode(true);
                  set("reminderMinutes", 10);
                } else {
                  set("reminderMinutes", e.target.value ? Number(e.target.value) : null);
                }
              }}
            >
              <option value="">{t.reminderNone}</option>
              {REMINDER_PRESETS.filter((m) => m > 0).map((m) => (
                <option key={m} value={m}>
                  {reminderLabel(m)}
                </option>
              ))}
              <option value="custom">{t.reminderCustom}</option>
            </select>
          ) : (
            <div className="custom-reminder">
              <input
                type="number"
                min={1}
                max={20160}
                value={draft.reminderMinutes ?? 10}
                onChange={(e) => set("reminderMinutes", Math.max(1, Number(e.target.value)))}
              />
              <span className="unit">{t.minutes}</span>
              <button
                type="button"
                className="btn-ghost small"
                onClick={() => {
                  setCustomMode(false);
                  set("reminderMinutes", 15);
                }}
              >
                {t.cancel}
              </button>
            </div>
          )}
        </div>

        <label className="field">
          <span>{t.notes}</span>
          <textarea
            rows={2}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={t.notesPlaceholder}
          />
        </label>

        <div className="modal-actions">
          {onDelete && (
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={14} /> {t.delete}
            </button>
          )}
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>
            {t.cancel}
          </button>
          <button className="btn-primary" onClick={onSave}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
