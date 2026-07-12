import { useState } from "react";
import { Copy, Check, KeyRound, RefreshCw, Eye, EyeOff } from "lucide-react";
import { getSpace, setSpace, shareLink } from "../space";
import { T } from "../i18n";

interface Props {
  t: T;
  onSwitched: () => void;
}

export default function AccountPanel({ t, onSwitched }: Props) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [switching, setSwitching] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [input, setInput] = useState("");
  const code = getSpace();

  const copy = async (what: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(what === "link" ? shareLink() : code);
      setCopied(what);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      /* clipboard indisponibil */
    }
  };

  const applyCode = () => {
    const c = input.trim();
    if (c.length < 8) return;
    setSpace(c);
    setSwitching(false);
    setInput("");
    onSwitched();
  };

  return (
    <div className="account">
      <h2>{t.myCalendar}</h2>
      <p className="account-note">{t.codeNote}</p>

      <div className="account-code">
        <KeyRound size={13} />
        <span title={code} className={showFull ? "full-code" : ""}>
          {showFull ? code : `${code.slice(0, 8)}…${code.slice(-4)}`}
        </span>
        <button onClick={() => setShowFull((v) => !v)} aria-label="toggle">
          {showFull ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button onClick={() => copy("code")} aria-label={t.copyCode}>
          {copied === "code" ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      {copied === "code" && <p className="account-copied">{t.codeCopied}</p>}

      <button className="account-switch" onClick={() => copy("link")}>
        <Copy size={12} /> {copied === "link" ? t.linkCopied : t.copyLink}
      </button>

      {!switching ? (
        <button className="account-switch" onClick={() => setSwitching(true)}>
          <RefreshCw size={12} /> {t.recoverWithCode}
        </button>
      ) : (
        <div className="account-switch-box">
          <input
            placeholder={t.pasteCode}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="account-switch-actions">
            <button className="btn-ghost" onClick={() => setSwitching(false)}>
              {t.cancel}
            </button>
            <button className="btn-primary" onClick={applyCode}>
              {t.use}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
