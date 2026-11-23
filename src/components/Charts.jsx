// Hand-drawn SVG charts. Each sits in a <ChartBlock> with a short text summary
// for screen readers and a "Table" switch that shows the same numbers as a table.
import { useId, useState } from "react";
import { useI18n } from "../i18n/useI18n.js";

export function ChartBlock({ title, summary, table, children, actions, className = "" }) {
  const { t } = useI18n();
  const [asTable, setAsTable] = useState(false);
  const id = useId();
  return (
    <section className={`chart-block ${className}`} aria-labelledby={id}>
      <div className="chart-head">
        <h2 id={id}>{title}</h2>
        <div className="chart-tools">
          {actions}
          {table && (
            <button type="button" className="link-btn chart-switch" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>
              {asTable ? t("chart.showChart") : t("chart.showTable")}
            </button>
          )}
        </div>
      </div>
      {asTable && table ? (
        <div className="table-wrap">{table}</div>
      ) : (
        <figure className="chart-fig" role="img" aria-label={summary}>{children}</figure>
      )}
    </section>
  );
}

// Simple table for ChartBlock: rows [[label, value], ...]
export function DataTable({ head, rows }) {
  return (
    <table className="data-table">
      <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j} className="num">{c}</td>))}</tr>)}</tbody>
    </table>
  );
}

// Nice round axis top in hours: 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, ...
function niceTop(maxMinutes) {
  const h = maxMinutes / 60;
  const steps = [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 30, 40, 50, 60, 80, 100, 150, 200];
  return (steps.find((s) => s >= h) || Math.ceil(h / 50) * 50) * 60;
}

// Vertical bars: data [{ key, label, minutes, hint? }]. Built from HTML boxes
// (not SVG text), so the labels stay readable at any width. Labels thin out
// when there are many bars.
export function BarChart({ data, height = 180, highlightKey }) {
  const { t, duration } = useI18n();
  const top = niceTop(Math.max(30, ...data.map((d) => d.minutes)));
  // long labels ("21 Sep") get fewer slots than day numbers, so they never overlap on phones
  const longLabels = Math.max(...data.map((d) => String(d.label).length)) > 3;
  const every = Math.ceil(data.length / (longLabels ? 6 : data.length > 20 ? 8 : 10));
  return (
    <div className="bars" style={{ "--h": height + "px", "--n": data.length }} aria-hidden="true">
      <div className="bars-axis">
        {[1, 0.5, 0].map((f) => <span key={f} style={{ bottom: `${f * 100}%` }}>{t("dur.axisH", { h: +((f * top) / 60).toFixed(1) })}</span>)}
      </div>
      <div className="bars-plot">
        {[1, 0.5, 0].map((f) => <i key={f} className="grid-line" style={{ bottom: `${f * 100}%` }} />)}
        {data.map((d, i) => (
          <div key={d.key} className={`bar-col ${d.key === highlightKey ? "is-today" : ""}`} title={`${d.hint || d.label}: ${duration(d.minutes)}`}>
            <span className="bar" style={{ height: `${(d.minutes / top) * 100}%`, "--i": i }} />
          </div>
        ))}
      </div>
      <div className="bars-labels">
        {data.map((d, i) => {
          const last = i === data.length - 1;
          // a regular label too close to the last one is skipped, so they never touch
          const show = last || (i % every === 0 && data.length - 1 - i >= every);
          return <span key={d.key}>{show ? d.label : ""}</span>;
        })}
      </div>
    </div>
  );
}

// Ring of shares with a legend: items [{ key, label, minutes, share, color }]
export function ShareRing({ items, center }) {
  const { duration, formatNumber } = useI18n();
  const r = 40, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="share">
      <div className="share-ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={r} className="ring-track" />
          {items.map((it) => {
            const len = it.share * c;
            const el = <circle key={it.key} cx="50" cy="50" r={r} className="share-seg" stroke={it.color} strokeDasharray={`${Math.max(0, len - 1)} ${c}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />;
            offset += len;
            return el;
          })}
        </svg>
        {center && <div className="share-center">{center}</div>}
      </div>
      <ol className="legend">
        {items.map((it) => (
          <li key={it.key}>
            <span className="legend-swatch" style={{ background: it.color }} aria-hidden="true" />
            <span className="legend-name">{it.label}</span>
            <span className="legend-val num">{duration(it.minutes, { short: true })}</span>
            <span className="legend-pct num muted">{formatNumber(Math.round(it.share * 100))}%</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Horizontal bars with labels: rows [{ key, label, minutes }]
export function HBars({ rows, unit = "duration" }) {
  const { duration } = useI18n();
  const top = Math.max(1, ...rows.map((r) => r.minutes));
  return (
    <ul className="hbars">
      {rows.map((r, i) => (
        <li key={r.key}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(r.minutes / top) * 100}%`, "--i": i }} /></span>
          <span className="hbar-val num">{unit === "duration" ? duration(r.minutes) : r.minutes}</span>
        </li>
      ))}
    </ul>
  );
}

// 12-week heat map: columns of 7 days. Five levels: none, then quartiles of the played days.
export function HeatMap({ weeks, weekdayNames }) {
  const { duration, dayLabel, t } = useI18n();
  const played = weeks.flat().filter((d) => d.minutes > 0).map((d) => d.minutes).sort((a, b) => a - b);
  const q = (p) => played[Math.min(played.length - 1, Math.floor(p * played.length))] || 0;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  const level = (m) => (m == null ? -1 : m === 0 ? 0 : m <= cuts[0] ? 1 : m <= cuts[1] ? 2 : m <= cuts[2] ? 3 : 4);
  const today = weeks.flat().filter((d) => d.minutes != null).pop()?.date;
  return (
    <div className="heat">
      <div className="heat-days" aria-hidden="true">{weekdayNames.map((n, i) => <span key={i}>{i % 2 === 0 ? n : ""}</span>)}</div>
      <div className="heat-grid">
        {weeks.map((col, w) => (
          <div className="heat-col" key={w}>
            {col.map((d) => {
              const lv = level(d.minutes);
              return <span key={d.date} className={`heat-cell lv-${lv}`} title={lv < 0 ? "" : `${dayLabel(d.date, today)}: ${d.minutes ? duration(d.minutes) : t("stats.noPlay")}`} />;
            })}
          </div>
        ))}
      </div>
      <div className="heat-key" aria-hidden="true">
        <span>{t("stats.less")}</span>
        {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`heat-cell lv-${l}`} />)}
        <span>{t("stats.more")}</span>
      </div>
    </div>
  );
}
