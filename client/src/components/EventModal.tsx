import { X, Trash2, Pencil, Check } from "lucide-react";
import { Category, EventDraft, REMINDER_OPTIONS } from "../types";

interface Props {
  draft: EventDraft;
  categories: Category[];
  setDraft: (d: EventDraft) => void;
  onSave: () => void;
  onDelete: (() => void) | null;
  onClose: () => void;
}

export default function EventModal({ draft, categories, setDraft, onSave, onDelete, onClose }: Props) {
  const set =
    <K extends keyof EventDraft>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDraft({ ...draft, [field]: e.target.value } as EventDraft);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{draft.id ? "Editează eveniment" : "Eveniment nou"}</h3>
          <button onClick={onClose} aria-label="Închide">
            <X size={18} />
          </button>
        </div>

        <label className="field">
          <span>Titlu</span>
          <input autoFocus value={draft.title} onChange={set("title")} placeholder="ex: Laborator PDS" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Data</span>
            <input type="date" value={draft.date} onChange={set("date")} />
          </label>
          <label className="field">
            <span>Ora start</span>
            <input type="time" value={draft.startTime} onChange={set("startTime")} />
          </label>
          <label className="field">
            <span>Ora sfârșit</span>
            <input type="time" value={draft.endTime} onChange={set("endTime")} />
          </label>
        </div>

        <div className="field">
          <span>Categorie</span>
          <div className="cat-select">
            {categories.length === 0 && (
              <p className="cat-empty">Nicio categorie. Adaugă una din panoul „Categorii".</p>
            )}
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`cat-option ${draft.category === cat.id ? "active" : ""}`}
                style={{ ["--c" as string]: cat.color }}
                onClick={() => setDraft({ ...draft, category: cat.id })}
              >
                <span className="chip-dot" /> {cat.label}
                {draft.category === cat.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Reminder</span>
          <select
            value={draft.reminderMinutes === null ? "" : String(draft.reminderMinutes)}
            onChange={(e) =>
              setDraft({
                ...draft,
                reminderMinutes: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Notițe</span>
          <textarea rows={3} value={draft.notes} onChange={set("notes")} placeholder="Detalii, locație, link…" />
        </label>

        <div className="modal-actions">
          {onDelete && (
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={14} /> Șterge
            </button>
          )}
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>
            Anulează
          </button>
          <button className="btn-primary" onClick={onSave}>
            <Pencil size={14} /> Salvează
          </button>
        </div>
      </div>
    </div>
  );
}
