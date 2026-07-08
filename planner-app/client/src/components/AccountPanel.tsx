import { useState } from "react";
import { Copy, Check, KeyRound, RefreshCw, Eye, EyeOff } from "lucide-react";
import { getSpace, setSpace, shareLink } from "../space";

interface Props {
  onSwitched: () => void;
}

export default function AccountPanel({ onSwitched }: Props) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [switching, setSwitching] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [input, setInput] = useState("");
  const code = getSpace();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink());
      setCopied("link");
      setTimeout(() => setCopied(null), 2500);
    } catch {
      /* clipboard indisponibil */
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied("code");
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
      <h2>Calendarul meu</h2>
      <p className="account-note">
        Codul tău privat = cheia calendarului tău. <b>Salvează-l undeva sigur</b> (notițe,
        email către tine). Dacă telefonul șterge datele aplicației, cu acest cod îți
        recuperezi calendarul cu tot ce e în el.
      </p>

      <div className="account-code">
        <KeyRound size={13} />
        <span title={code} className={showFull ? "full-code" : ""}>
          {showFull ? code : `${code.slice(0, 8)}…${code.slice(-4)}`}
        </span>
        <button onClick={() => setShowFull((v) => !v)} aria-label={showFull ? "Ascunde codul" : "Arată codul complet"}>
          {showFull ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button onClick={copyCode} aria-label="Copiază codul">
          {copied === "code" ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      {copied === "code" && <p className="account-copied">Cod copiat — salvează-l undeva sigur.</p>}

      <button className="account-switch" onClick={copyLink}>
        <Copy size={12} /> {copied === "link" ? "Link copiat!" : "Copiază link pentru alt dispozitiv"}
      </button>

      {!switching ? (
        <button className="account-switch" onClick={() => setSwitching(true)}>
          <RefreshCw size={12} /> Recuperează cu un cod
        </button>
      ) : (
        <div className="account-switch-box">
          <input
            placeholder="lipește codul salvat aici"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="account-switch-actions">
            <button className="btn-ghost" onClick={() => setSwitching(false)}>
              Anulează
            </button>
            <button className="btn-primary" onClick={applyCode}>
              Folosește
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
