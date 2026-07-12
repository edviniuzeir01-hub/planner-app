import { useState } from "react";
import { Check } from "lucide-react";
import { THEMES, getTheme, setTheme } from "../theme";
import { Lang, T, setLang } from "../i18n";

interface Props {
  t: T;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export default function ThemePicker({ t, lang, onLangChange }: Props) {
  const [current, setCurrent] = useState(getTheme());

  const pick = (id: string) => {
    setTheme(id);
    setCurrent(id);
  };

  const chooseLang = (l: Lang) => {
    setLang(l);
    onLangChange(l);
  };

  return (
    <div className="theme-picker">
      <h2>{t.color}</h2>
      <div className="theme-swatches">
        {THEMES.map((th) => (
          <button
            key={th.id}
            className={`theme-swatch ${current === th.id ? "active" : ""}`}
            style={{ background: th.bg }}
            onClick={() => pick(th.id)}
            title={th.label}
            aria-label={th.label}
          >
            {current === th.id ? (
              <Check size={14} className="swatch-check" style={{ color: th.accent }} />
            ) : (
              <span className="swatch-dot" style={{ background: th.accent }} />
            )}
          </button>
        ))}
      </div>

      <h2 className="lang-head">{t.language}</h2>
      <div className="seg-group">
        <button
          className={`seg ${lang === "ro" ? "active" : ""}`}
          onClick={() => chooseLang("ro")}
        >
          Română
        </button>
        <button
          className={`seg ${lang === "en" ? "active" : ""}`}
          onClick={() => chooseLang("en")}
        >
          English
        </button>
      </div>
    </div>
  );
}
