// Small shared pieces: avatar, stars, badges, segmented control, field,
// empty state, Session Trace, goal ring, stat.
import { useId } from "react";
import { Star } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";

export function Avatar({ user, size = 32 }) {
  const initial = (user?.name || user?.username || "?").trim().charAt(0).toUpperCase();
  return (
    <span className="avatar" style={{ "--av": user?.color || "#5f6b7a", width: size, height: size, fontSize: size * 0.44 }} aria-hidden="true">
      {initial}
    </span>
  );
}

export function Stars({ value }) {
  const { t } = useI18n();
  if (!value) return <span className="stars muted">{t("rating.none")}</span>;
  return (
    <span className="stars" role="img" aria-label={t("rating.label", { n: value })}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} aria-hidden="true" className={n <= value ? "is-on" : ""} fill={n <= value ? "currentColor" : "none"} />)}
    </span>
  );
}

// Rating input: five radio buttons (keyboard: arrows), plus "no rating".
export function StarInput({ value, onChange }) {
  const { t } = useI18n();
  const name = useId();
  return (
    <fieldset className="star-input">
      <legend className="field-label">{t("game.rating")}</legend>
      <div className="star-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`star-opt ${n <= value ? "is-on" : ""}`}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="visually-hidden" />
            <Star size={22} aria-hidden="true" fill={n <= value ? "currentColor" : "none"} />
            <span className="visually-hidden">{t("rating.label", { n })}</span>
          </label>
        ))}
        {value > 0 && <button type="button" className="link-btn star-clear" onClick={() => onChange(0)}>{t("rating.clear")}</button>}
      </div>
    </fieldset>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  return <span className={`badge badge-${status}`}>{t("status." + status)}</span>;
}

// Segmented control: options [{ value, label }]
export function Segmented({ label, value, options, onChange, className = "" }) {
  return (
    <div className={`seg ${className}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

// A labelled field with hint and error, wired with aria attributes.
export function Field({ id, label, hint, error, children, className = "" }) {
  const { t } = useI18n();
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": error ? "true" : undefined, "aria-describedby": [hint && id + "-hint", error && id + "-err"].filter(Boolean).join(" ") || undefined })}
      {hint && <p className="field-hint" id={id + "-hint"}>{hint}</p>}
      <p className="field-error" id={id + "-err"}>{error ? t(error) : ""}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={28} aria-hidden="true" className="empty-icon" />}
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}

// The signature: one burnt-orange vertical mark per session, height by length.
export function SessionTrace({ sessions, max = 24, label }) {
  const list = sessions.slice(-max);
  const top = Math.max(60, ...list.map((s) => s.minutes));
  return (
    <span className="trace" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"}>
      {list.map((s) => <i key={s.id} style={{ height: `${Math.max(18, (s.minutes / top) * 100)}%` }} />)}
    </span>
  );
}

// Goal ring: SVG circle that fills to the share of the target. Over the
// target (limit mode) the overflow is drawn in the danger colour.
export function GoalRing({ ratio, state, size = 112, children }) {
  const r = 44, c = 2 * Math.PI * r;
  const main = Math.min(1, ratio), over = Math.max(0, Math.min(1, ratio - 1));
  return (
    <div className={`ring ring-${state}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle cx="50" cy="50" r={r} className="ring-fill" strokeDasharray={`${main * c} ${c}`} transform="rotate(-90 50 50)" />
        {over > 0 && <circle cx="50" cy="50" r={r} className="ring-over" strokeDasharray={`${over * c} ${c}`} transform="rotate(-90 50 50)" />}
      </svg>
      <div className="ring-text">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, className = "" }) {
  return (
    <div className={`stat ${className}`}>
      <dt className="stat-label">{label}</dt>
      <dd className="stat-value num">{value}</dd>
      {sub && <dd className="stat-sub">{sub}</dd>}
    </div>
  );
}
