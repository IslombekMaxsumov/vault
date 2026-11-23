// Log: the timer, the log-by-hand form, and every session grouped by day with
// day totals, filtered by game and period (kept in the address).
import { useEffect, useRef } from "react";
import { Timer } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { setQuery } from "../lib/router.js";
import * as S from "../lib/stats.js";
import { StartSession, SessionForm, SessionList, GameSelect } from "../components/Sessions.jsx";
import { Segmented, EmptyState } from "../components/ui.jsx";

const PERIODS = ["7d", "30d", "90d", "all"];

export function LogPage({ route }) {
  const { t, duration } = useI18n();
  const { data } = useDb();
  const today = useToday();
  const formRef = useRef(null);
  const game = data.games.some((g) => g.id === route.query.get("game")) ? route.query.get("game") : "";
  const period = PERIODS.includes(route.query.get("period")) ? route.query.get("period") : "30d";
  const update = (patch) => setQuery({ game, period: period === "30d" ? "" : period, ...patch });
  useEffect(() => {
    if (route.query.get("add") === "1") formRef.current?.querySelector("select, input")?.focus();
  }, []); // eslint-disable-line

  const range = S.periodRange(period, today, data.sessions);
  const list = S.inRange(data.sessions, range).filter((s) => !game || s.game === game);
  const total = list.reduce((a, s) => a + s.minutes, 0);

  return (
    <div className="container log-page">
      <div className="page-head">
        <h1 tabIndex={-1}>{t("nav.log")}</h1>
      </div>
      <div className="log-cols">
        <div className="log-side">
          <StartSession />
          <section className="log-form" aria-labelledby="byHand" ref={formRef}>
            <h2 id="byHand">{t("log.byHand")}</h2>
            <SessionForm games={data.games} />
          </section>
        </div>
        <section className="log-list" aria-labelledby="allSessions">
          <div className="section-head">
            <h2 id="allSessions">{t("log.sessions")}</h2>
            <p className="muted num">{t("log.summary", { count: list.length, time: duration(total) })}</p>
          </div>
          <div className="log-filters">
            <Segmented label={t("stats.period")} value={period} onChange={(v) => update({ period: v === "30d" ? "" : v })} options={PERIODS.map((p) => ({ value: p, label: t("period." + p) }))} />
            <label className="mini-field"><span>{t("log.game")}</span>
              <GameSelect games={data.games} value={game} onChange={(v) => update({ game: v })} emptyLabel={t("lb.allGames")} />
            </label>
          </div>
          {list.length ? (
            <SessionList sessions={list} games={data.games} />
          ) : (
            <EmptyState icon={Timer} title={data.sessions.length ? t("log.noneHere") : t("log.empty")} text={data.sessions.length ? t("log.noneHereText") : t("log.emptyText")} />
          )}
        </section>
      </div>
    </div>
  );
}
