// Leaderboard: every account in this browser plus the demo players, ranked by
// time, sessions, longest streak or games played, for a period and optionally
// one game. My row is highlighted, and pinned at the bottom when it's far down.
import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { setQuery } from "../lib/router.js";
import { leaderboard } from "../lib/stats.js";
import { CATALOG } from "../data/catalog.js";
import { Segmented, Avatar, EmptyState } from "../components/ui.jsx";

const PERIODS = ["week", "month", "all"];
const METRICS = ["time", "sessions", "streak", "games"];
const SHOW = 5; // top 5 first; "Show all" opens the rest

export function LeaderboardPage({ route }) {
  const { t, duration, formatNumber } = useI18n();
  const { me, players, version } = useDb();
  const today = useToday();
  const q = route.query;
  const period = PERIODS.includes(q.get("period")) ? q.get("period") : "week";
  const metric = METRICS.includes(q.get("by")) ? q.get("by") : "time";
  const game = CATALOG.some((g) => g.id === q.get("game")) ? q.get("game") : "";
  const update = (patch) => setQuery({ period: period === "week" ? "" : period, by: metric === "time" ? "" : metric, game, ...patch });

  const all = useMemo(() => players(), [players, version]); // eslint-disable-line
  const rows = leaderboard(all, { period, metric: game && metric === "games" ? "time" : metric, gameKey: game, today });
  // only games someone actually has
  const owned = new Set(all.flatMap((p) => p.games.map((g) => g.catalogId)).filter(Boolean));
  const gameOptions = CATALOG.filter((g) => owned.has(g.id)).sort((a, b) => a.title.localeCompare(b.title));
  const [showAll, setAll] = useState(false);
  useEffect(() => setAll(false), [period, metric, game]); // new filters start from the top 5 again
  const mineIndex = rows.findIndex((r) => r.username === me.username);
  const shown = showAll ? rows : rows.slice(0, SHOW);
  const fmt = (v) => (metric === "time" || (game && metric === "games") ? duration(v, { short: true }) : metric === "streak" ? t("home.days", { count: v }) : formatNumber(v));
  const metricLabel = t("lb.metric." + (game && metric === "games" ? "time" : metric));

  const Row = ({ r, pinned }) => (
    <tr className={`${r.username === me.username ? "is-me" : ""} ${r.rank <= 3 ? "top-" + r.rank : ""} ${pinned ? "is-pinned" : ""}`} aria-current={r.username === me.username ? "true" : undefined}>
      <td className="lb-rank num">{r.rank}</td>
      <th scope="row" className="lb-player">
        <Avatar user={r} size={30} />
        <span className="lb-name">{r.name}{r.username === me.username && <span className="lb-you">{t("lb.you")}</span>}</span>
      </th>
      <td className="lb-top">{r.top || "—"}</td>
      <td className="lb-value num">{fmt(r.value)}</td>
    </tr>
  );

  return (
    <div className="container lb-page">
      <div className="page-head">
        <div>
          <h1 tabIndex={-1}>{t("nav.leaderboard")}</h1>
          <p className="muted">{t("lb.intro")}</p>
        </div>
      </div>
      <div className="filters filters-row">
        <Segmented label={t("stats.period")} value={period} onChange={(v) => update({ period: v === "week" ? "" : v })} options={PERIODS.map((p) => ({ value: p, label: t("lb.period." + p) }))} />
        <div className="filter-selects">
          <label className="mini-field"><span>{t("lb.by")}</span>
            <select className="select" value={metric} onChange={(e) => update({ by: e.target.value === "time" ? "" : e.target.value })}>{METRICS.map((m) => <option key={m} value={m}>{t("lb.metric." + m)}</option>)}</select>
          </label>
          <label className="mini-field"><span>{t("log.game")}</span>
            <select className="select" value={game} onChange={(e) => update({ game: e.target.value })}><option value="">{t("lb.allGames")}</option>{gameOptions.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select>
          </label>
        </div>
      </div>

      {rows.length ? (
        <div className="table-wrap">
          <table className="lb-table">
            <caption className="visually-hidden">{t("lb.caption", { metric: metricLabel, period: t("lb.period." + period) })}</caption>
            <thead><tr><th scope="col">#</th><th scope="col">{t("lb.player")}</th><th scope="col" className="lb-top">{t("lb.mostPlayed")}</th><th scope="col" className="lb-value">{metricLabel}</th></tr></thead>
            <tbody>
              {shown.map((r) => <Row key={r.username} r={r} />)}
            </tbody>
            {!showAll && mineIndex >= SHOW && (
              <tbody className="lb-pinned">
                <tr className="lb-gap" aria-hidden="true"><td colSpan={4}>⋯</td></tr>
                <Row r={rows[mineIndex]} pinned />
              </tbody>
            )}
          </table>
        </div>
      ) : (
        <EmptyState icon={Trophy} title={t("lb.empty")} text={t("lb.emptyText")} />
      )}
      {rows.length > SHOW && (
        <button type="button" className="btn btn-secondary btn-sm lb-more" aria-expanded={showAll} onClick={() => setAll(!showAll)}>
          {showAll ? t("lb.showTop", { count: SHOW }) : t("lb.showAll", { count: rows.length })}
        </button>
      )}
      {mineIndex < 0 && rows.length > 0 && <p className="muted lb-note">{t("lb.notYou")}</p>}
      <p className="field-hint lb-note">{t("lb.localNote")}</p>
    </div>
  );
}
