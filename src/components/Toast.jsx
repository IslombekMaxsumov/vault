// One toast at a time, shown from anywhere with useToast():
//   const toast = useToast(); toast("Session logged", { label: "Undo", run: () => ... })
// The live region stays in the page so screen readers announce each message.
// The timer pauses while the toast is hovered or focused, so there's time to press Undo.
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { ToastContext } from "./useToast.js";

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, action) => setToast({ id: Date.now() + Math.random(), message, action }), []);
  const dismiss = useCallback(() => setToast(null), []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastView toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDismiss }) {
  const { t } = useI18n();
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  useEffect(() => setPaused(false), [toast?.id]);
  useEffect(() => {
    if (!toast || paused) return;
    timer.current = setTimeout(onDismiss, toast.action ? 6000 : 3200);
    return () => clearTimeout(timer.current);
  }, [toast, paused, onDismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="toast" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <span className="toast-text">{toast.message}</span>
          {toast.action && (
            <button type="button" className="toast-action" onClick={() => { onDismiss(); toast.action.run(); }}>{toast.action.label}</button>
          )}
          <button type="button" className="icon-btn icon-btn-sm" aria-label={t("toast.dismiss")} onClick={onDismiss}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
