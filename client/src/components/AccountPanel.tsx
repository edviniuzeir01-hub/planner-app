import { useState } from "react";
import { Copy, Check, KeyRound, RefreshCw } from "lucide-react";
import { getSpace, setSpace, shareLink } from "../space";

interface Props {
  onSwitched: () => void;
}

export default function AccountPanel({ onSwitched }: Props) {
  const [copied, setCopied] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [input, setInput] = useState("");
  const code = getSpace();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        Codul tău privat. Copiază linkul ca să deschizi <b>același</b> calendar și pe alt
        dispozitiv (ex. telefon).
      </p>

      <div className="account-code">
        <KeyRound size={13} />
        <span title={code}>{code.slice(0, 8)}…{code.slice(-4)}</span>
        <button onClick={copy} aria-label="Copiază linkul">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      {copied && <p className="account-copied">Link copiat — trimite-l pe alt dispozitiv de-al tău.</p>}

      {!switching ? (
        <button className="account-switch" onClick={() => setSwitching(true)}>
          <RefreshCw size={12} /> Introdu alt cod
        </button>
      ) : (
        <div className="account-switch-box">
          <input
            placeholder="lipește codul aici"
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
