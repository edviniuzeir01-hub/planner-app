import { useState } from "react";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Category, SUGGESTED_COLORS } from "../types";
import { api } from "../api";
import { T } from "../i18n";

interface Props {
  categories: Category[];
  t: T;
  onChanged: () => void;
}

export default function CategoryManager({ categories, t, onChanged }: Props) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(SUGGESTED_COLORS[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");

  const add = async () => {
    if (!newLabel.trim()) return;
    await api.createCategory({ label: newLabel.trim(), color: newColor });
    setNewLabel("");
    setNewColor(SUGGESTED_COLORS[0]);
    setAdding(false);
    onChanged();
  };

  const saveEdit = async () => {
    if (!editId || !editLabel.trim()) return;
    await api.updateCategory(editId, { label: editLabel.trim(), color: editColor });
    setEditId(null);
    onChanged();
  };

  const remove = async (id: string) => {
    await api.deleteCategory(id);
    onChanged();
  };

  return (
    <div className="cat-manager">
      <h2>{t.categories}</h2>
      <ul className="cat-list">
        {categories.map((c) =>
          editId === c.id ? (
            <li key={c.id} className="cat-edit-row">
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="color-input"
              />
              <input
                className="cat-name-input"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
              <button className="icon-btn ok" onClick={saveEdit} aria-label={t.save}>
                <Check size={14} />
              </button>
              <button className="icon-btn" onClick={() => setEditId(null)} aria-label={t.cancel}>
                <X size={14} />
              </button>
            </li>
          ) : (
            <li key={c.id} className="cat-row">
              <span className="cat-dot" style={{ background: c.color }} />
              <span className="cat-name">{c.label}</span>
              <button
                className="icon-btn"
                onClick={() => {
                  setEditId(c.id);
                  setEditLabel(c.label);
                  setEditColor(c.color);
                }}
                aria-label="edit"
              >
                <Pencil size={13} />
              </button>
              <button className="icon-btn danger" onClick={() => remove(c.id)} aria-label={t.delete}>
                <Trash2 size={13} />
              </button>
            </li>
          )
        )}
      </ul>

      {adding ? (
        <div className="cat-add-box">
          <div className="cat-add-row">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="color-input"
            />
            <input
              className="cat-name-input"
              placeholder={t.categoryName}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              autoFocus
            />
          </div>
          <div className="cat-swatch-row">
            {SUGGESTED_COLORS.map((col) => (
              <button
                key={col}
                className={`mini-swatch ${newColor === col ? "on" : ""}`}
                style={{ background: col }}
                onClick={() => setNewColor(col)}
                aria-label={col}
              />
            ))}
          </div>
          <div className="cat-add-actions">
            <button className="btn-ghost" onClick={() => setAdding(false)}>
              {t.cancel}
            </button>
            <button className="btn-primary" onClick={add}>
              {t.add}
            </button>
          </div>
        </div>
      ) : (
        <button className="cat-add-btn" onClick={() => setAdding(true)}>
          <Plus size={13} /> {t.newCategory}
        </button>
      )}
    </div>
  );
}
