import { useState } from "react";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Category, SUGGESTED_COLORS } from "../types";
import { api } from "../api";

interface Props {
  categories: Category[];
  onChanged: () => void; // reîncarcă lista din App
}

export default function CategoryManager({ categories, onChanged }: Props) {
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

  const startEdit = (c: Category) => {
    setEditId(c.id);
    setEditLabel(c.label);
    setEditColor(c.color);
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
      <h2>Categorii</h2>

      <ul className="cat-list">
        {categories.map((c) =>
          editId === c.id ? (
            <li key={c.id} className="cat-edit-row">
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="color-input"
                aria-label="Culoare"
              />
              <input
                className="cat-name-input"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
              <button className="icon-btn ok" onClick={saveEdit} aria-label="Salvează">
                <Check size={14} />
              </button>
              <button className="icon-btn" onClick={() => setEditId(null)} aria-label="Anulează">
                <X size={14} />
              </button>
            </li>
          ) : (
            <li key={c.id} className="cat-row">
              <span className="cat-dot" style={{ background: c.color }} />
              <span className="cat-name">{c.label}</span>
              <button className="icon-btn" onClick={() => startEdit(c)} aria-label="Editează">
                <Pencil size={13} />
              </button>
              <button className="icon-btn danger" onClick={() => remove(c.id)} aria-label="Șterge">
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
              aria-label="Culoare"
            />
            <input
              className="cat-name-input"
              placeholder="nume categorie"
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
              Anulează
            </button>
            <button className="btn-primary" onClick={add}>
              Adaugă
            </button>
          </div>
        </div>
      ) : (
        <button className="cat-add-btn" onClick={() => setAdding(true)}>
          <Plus size={13} /> Categorie nouă
        </button>
      )}
    </div>
  );
}
