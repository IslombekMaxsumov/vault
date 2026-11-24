// Stats for a period: headline numbers, time per day (or week), time per game,
// weekday pattern, time of day and a 12-week heat map. Every chart has a table.
import { ChartColumn } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { setQuery } from "../lib/router.js";
import { fromKey } from "../lib/dates.js";
import * as S from "../lib/stats.js";
import { assignColors } from "../lib/gameColor.js";
import { Segmented, EmptyState, CountDuration } from "../components/ui.jsx";
import { ChartBlock, DataTable, BarChart, OrbitChart, HBars, HeatMap, PeriodCompare } from "../components/Charts.jsx";
import { addDays } from "../lib/dates.js";

const PERIODS = ["7d", "30d", "90d", "all"];

export function StatsPage({ route }) {
  const { t, duration, formatNumber, formatDate, shortDate, axisDate } = useI18n();
  const { data } = useDb();
  const today = useToday();
  const period = PERIODS.includes(route.query.get("period")) ? route.query.get("period") : "30d";
  const range = S.periodRange(period, today, data.sessions);
  const list = S.inRange(data.sessions, range);
  const sum = S.summary(list);
  const streak = S.streaks(data.sessions, today);
  const change = period === "all" ? null : S.trend(data.sessions, range);
  const gameTitle = (id) => data.games.find((g) => g.id === id)?.title || t("log.unknownGame");

  const spanDays = Math.round((fromKey(range[1]) - fromKey(range[0])) / 864e5) + 1;
  const weekly = spanDays > 45;
  const series = (weekly ? S.weeklySeries(list, range) : S.dailySeries(list, range)).map((d) => ({
    key: d.date, minutes: d.minutes,
    label: weekly ? axisDate(d.date) : spanDays <= 7 ? formatDate(fromKey(d.date), { weekday: "short" }) : String(fromKey(d.date).getDate()),
    hint: weekly ? t("stats.weekOf", { date: shortDate(d.date) }) : formatDate(fromKey(d.date), { weekday: "short", day: "numeric", month: "short" }),
  }));

  const games = S.byGame(list);
  const topN = games.slice(0, 7);
  const rest = games.slice(7);
  const colors = assignColors(topN.map((g) => gameTitle(g.game)));
  const share = topN.map((g, i) => ({ key: g.game, label: gameTitle(g.game), minutes: g.minutes, share: g.share, color: colors[i] }));
  if (rest.length) share.push({ key: "rest", label: t("stats.otherGames", { count: rest.length }), minutes: rest.reduce((a, g) => a + g.minutes, 0), share: rest.reduce((a, g) => a + g.share, 0), color: "var(--line-strong)" });

  const wdNames = [1, 2, 3, 4, 5, 6, 0].map((d) => formatDate(new Date(2026, 10, 22 + d, 12), { weekday: "short" }));
  const wdLong = [1, 2, 3, 4, 5, 6, 0].map((d) => formatDate(new Date(2026, 10, 22 + d, 12), { weekday: "long" }));
  const weekday = S.byWeekday(list, range).map((m, i) => ({ key: "w" + i, label: wdNames[i], long: wdLong[i], minutes: Math.round(m) }));
  const tod = S.byTimeOfDay(list);
  const todRows = ["morning", "afternoon", "evening", "night"].map((k) => ({ key: k, label: t("tod." + k), minutes: tod[k] }));
  const heat = S.heatWeeks(data.sessions, today, 12);
  const pct = change == null ? null : Math.round(change * 100);
  // the same-length period just before, for the comparison bars
  const before = period === "all" ? null : (() => { const len = spanDays; const r = [addDays(range[0], -len), addDays(range[0], -1)]; return S.inRange(data.sessions, r).reduce((a, x) => a + x.minutes, 0); })();
  const bestDay = weekday.reduce((m, d) => (d.minutes > m.minutes ? d : m), weekday[0]);

  return (
    <div className="container stats-page">
      <div className="page-head">
        <div>
          <h1 tabIndex={-1}>{t("nav.stats")}</h1>
          <p className="muted num">{shortDate(range[0])} – {shortDate(range[1])}</p>
        </div>
        <Segmented label={t("stats.period")} value={period} onChange={(v) => setQuery({ period: v === "30d" ? "" : v })} options={PERIODS.map((p) => ({ value: p, label: t("period." + p) }))} />
      </div>

      {!list.length ? (
        <EmptyState icon={ChartColumn} title={t("stats.empty")} text={t("stats.emptyText")} />
      ) : (
        <>
          <section className="stats-head" aria-label={t("stats.total")}>
            <div className="stats-lead">
              <p className="stats-lead-label">{t("stats.total")}</p>
              <p className="stats-lead-num num"><CountDuration minutes={sum.total} short /></p>
              <p className="stats-lead-sub">{pct == null ? t("stats.daysPlayed", { count: sum.days, of: spanDays }) : t(pct >= 0 ? "stats.upVs" : "stats.downVs", { pct: formatNumber(Math.abs(pct)) })}</p>
            </div>
            {before != null && (
              <PeriodCompare now={sum.total} before={before} labelNow={t("stats.thisPeriod")} labelBefore={t("stats.prevPeriod")} />
            )}
            <dl className="facts facts-wide">
              <div><dt>{t("home.sessions")}</dt><dd className="num">{formatNumber(sum.count)}</dd><dd className="facts-sub">{t("stats.daysPlayed", { count: sum.days, of: spanDays })}</dd></div>
              <div><dt>{t("game.avg")}</dt><dd className="num">{duration(sum.avgSession)}</dd><dd className="facts-sub">{t("stats.perDay", { time: duration(sum.avgDay) })}</dd></div>
              <div><dt>{t("stats.longest")}</dt><dd className="num">{sum.longest ? duration(sum.longest.minutes) : "—"}</dd><dd className="facts-sub">{sum.longest ? `${gameTitle(sum.longest.game)} · ${shortDate(sum.longest.date)}` : ""}</dd></div>
              <div><dt>{t("home.streak")}</dt><dd className="num">{t("home.days", { count: streak.current })}</dd><dd className="facts-sub">{t("home.best", { count: streak.longest })}</dd></div>
            </dl>
          </section>

          <ChartBlock className="chart-main" title={t(weekly ? "stats.perWeek" : "stats.perDay2")}
            summary={t("stats.seriesSummary", { time: duration(sum.total), count: sum.days })}
            table={<DataTable head={[t(weekly ? "stats.week" : "stats.day"), t("stats.time")]} rows={series.map((d) => [d.hint, duration(d.minutes)])} />}>
            <BarChart data={series} height={200} highlightKey={weekly ? null : today} />
          </ChartBlock>

          <div className="stats-grid">
            <ChartBlock className="chart-orbit" title={t("stats.byGame")} summary={share.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(", ")}
              table={<DataTable head={[t("log.game"), t("stats.time"), t("stats.sessions"), "%"]} rows={games.map((g) => [gameTitle(g.game), duration(g.minutes), formatNumber(g.count), formatNumber(Math.round(g.share * 100))])} />}>
              <OrbitChart items={share} center={<><span className="num orbit-total">{duration(sum.total, { short: true })}</span><span>{t("stats.games", { count: games.length })}</span></>} />
            </ChartBlock>

            <ChartBlock title={t("stats.weekday")} summary={t("stats.weekdaySummary", { day: bestDay.long, time: duration(bestDay.minutes) })}
              table={<DataTable head={[t("stats.day"), t("stats.avgTime")]} rows={weekday.map((d) => [d.long, duration(d.minutes)])} />}>
              <HBars rows={weekday} />
              <p className="chart-note muted">{t("stats.weekdayNote")}</p>
            </ChartBlock>

            <ChartBlock title={t("stats.tod")} summary={todRows.map((r) => `${r.label}: ${duration(r.minutes)}`).join(", ")}
              table={<DataTable head={[t("stats.todCol"), t("stats.time")]} rows={todRows.map((r) => [r.label, duration(r.minutes)])} />}>
              <HBars rows={todRows} />
              {tod.unknown > 0 && <p className="chart-note muted">{t("stats.noStart", { time: duration(tod.unknown) })}</p>}
            </ChartBlock>

            <ChartBlock className="chart-heat" title={t("stats.heat")} summary={t("stats.heatSummary", { count: heat.flat().filter((d) => d.minutes > 0).length })}
              table={<DataTable head={[t("stats.week"), ...wdNames]} rows={heat.map((col) => [shortDate(col[0].date), ...col.map((d) => (d.minutes == null ? "" : d.minutes ? duration(d.minutes) : "0"))])} />}>
              <HeatMap weeks={heat} weekdayNames={wdNames} />
              <p className="chart-note muted">{t("stats.heatNote", { from: shortDate(heat[0][0].date), to: shortDate(today) })}</p>
            </ChartBlock>
          </div>
        </>
      )}
    </div>
  );
}
