import { useState } from "react";
import { Check } from "lucide-react";
import { THEMES, getTheme, setTheme } from "../theme";

export default function ThemePicker() {
  const [current, setCurrent] = useState(getTheme());

  const pick = (id: string) => {
    setTheme(id);
    setCurrent(id);
  };

  return (
    <div className="theme-picker">
      <h2>Culoare</h2>
      <div className="theme-swatches">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`theme-swatch ${current === t.id ? "active" : ""}`}
            style={{ background: t.bg }}
            onClick={() => pick(t.id)}
            title={t.label}
            aria-label={t.label}
          >
            {current === t.id ? (
              <Check size={14} className="swatch-check" style={{ color: t.accent }} />
            ) : (
              <span className="swatch-dot" style={{ background: t.accent }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
