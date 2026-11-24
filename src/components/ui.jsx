// Shared pieces in the Living Archive style: avatar, stars, status, segmented
// control (with a sliding indicator), field, empty state, Session Trace, goal
// ring (draws itself), orbit lines, count-up numbers.
import { useId } from "react";
import { useI18n } from "../i18n/useI18n.js";
import { useCountUp, useDrawn, useIndicator } from "../hooks/useMotion.js";

export function Avatar({ user, size = 32 }) {
  const initial = (user?.name || user?.username || "?").trim().charAt(0).toUpperCase();
  return (
    <span className="avatar" style={{ "--av": user?.color || "#5f6b7a", width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {initial}
    </span>
  );
}

// Rating as five small marks (not stars in boxes): filled = rated.
export function Stars({ value }) {
  const { t } = useI18n();
  if (!value) return <span className="rating rating-none">{t("rating.none")}</span>;
  return (
    <span className="rating" role="img" aria-label={t("rating.label", { n: value })}>
      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= value ? "is-on" : ""} />)}
    </span>
  );
}

// Rating input: five radio buttons styled as marks of rising height.
export function StarInput({ value, onChange }) {
  const { t } = useI18n();
  const name = useId();
  return (
    <fieldset className="rate-input">
      <legend className="field-label">{t("game.rating")}</legend>
      <div className="rate-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`rate-opt ${n <= value ? "is-on" : ""}`} style={{ "--n": n }}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="visually-hidden" />
            <span aria-hidden="true" />
            <span className="visually-hidden">{t("rating.label", { n })}</span>
          </label>
        ))}
        <span className="rate-num num" aria-hidden="true">{value ? `${value}/5` : ""}</span>
        {value > 0 && <button type="button" className="link-btn rate-clear" onClick={() => onChange(0)}>{t("rating.clear")}</button>}
      </div>
    </fieldset>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  return <span className={`status status-${status}`}>{t("status." + status)}</span>;
}

// Segmented control with a sliding indicator: options [{ value, label }]
export function Segmented({ label, value, options, onChange, className = "" }) {
  const ref = useIndicator('[aria-pressed="true"]', [value, options.map((o) => o.label).join()]);
  return (
    <div ref={ref} className={`seg ${className}`} role="group" aria-label={label}>
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

// Thin elliptical orbit lines: the archive's recurring motif.
export function Orbits({ className = "", count = 4 }) {
  return (
    <svg className={`orbits ${className}`} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, i) => (
        <ellipse key={i} cx="200" cy="200" rx={190 - i * 34} ry={120 - i * 18} transform={`rotate(${-18 + i * 9} 200 200)`} />
      ))}
      <circle className="orbit-dot" cx="372" cy="150" r="5" />
    </svg>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true">
        <Orbits count={3} />
        {Icon && <Icon size={26} className="empty-icon" />}
      </div>
      <div className="empty-text">
        <h3>{title}</h3>
        {text && <p className="muted">{text}</p>}
        {children && <div className="empty-actions">{children}</div>}
      </div>
    </div>
  );
}

// The signature: one coral vertical mark per session, height by length.
export function SessionTrace({ sessions, max = 24, label }) {
  const list = sessions.slice(-max);
  const top = Math.max(60, ...list.map((s) => s.minutes));
  return (
    <span className="trace" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"}>
      {list.map((s, i) => <i key={s.id} style={{ height: `${Math.max(18, (s.minutes / top) * 100)}%`, "--i": i }} />)}
    </span>
  );
}

// Goal ring: the arc draws itself from zero. Over the target (limit mode) the
// overflow is drawn in the danger colour on an inner track.
export function GoalRing({ ratio, state, size = 112, children }) {
  const drawn = useDrawn();
  const r = 44, c = 2 * Math.PI * r;
  const main = drawn ? Math.min(1, ratio) : 0, over = drawn ? Math.max(0, Math.min(1, ratio - 1)) : 0;
  return (
    <div className={`ring ring-${state}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle cx="50" cy="50" r={r} className="ring-fill" strokeDasharray={`${main * c} ${c}`} transform="rotate(-90 50 50)" />
        {ratio > 1 && <circle cx="50" cy="50" r={r - 9} className="ring-over" strokeDasharray={`${over * 2 * Math.PI * (r - 9)} ${c}`} transform="rotate(-90 50 50)" />}
      </svg>
      <div className="ring-text">{children}</div>
    </div>
  );
}

// A duration that counts up to its value (minutes → "12 h 40 min").
export function CountDuration({ minutes, short }) {
  const { duration } = useI18n();
  const v = useCountUp(minutes);
  return <>{duration(v, { short })}</>;
}
export function CountNumber({ value, format }) {
  const v = useCountUp(value);
  return <>{format ? format(Math.round(v)) : Math.round(v)}</>;
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
