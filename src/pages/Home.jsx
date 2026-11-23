// Home: greeting, start a session, four key numbers, the weekly goal, the last
// 14 days, the most played game this week, recent sessions, latest clips and
// my place on this week's leaderboard.
import { useMemo, useState } from "react";
import { ArrowRight, Clapperboard } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { href } from "../lib/router.js";
import { addDays, fromKey } from "../lib/dates.js";
import * as S from "../lib/stats.js";
import { StartSession, SessionList } from "../components/Sessions.jsx";
import { ClipCard, ClipPlayer, ClipForm } from "../components/Clips.jsx";
import { BarChart } from "../components/Charts.jsx";
import { GameCover } from "../components/GameCover.jsx";
import { GoalRing, Stat, SessionTrace, EmptyState } from "../components/ui.jsx";
import { Modal } from "../components/Modal.jsx";

export function GoalSummary({ data, today, compact }) {
  const { t, duration } = useI18n();
  const g = S.goalProgress(data.sessions, data.goal, today);
  const line =
    g.mode === "limit"
      ? g.state === "over" ? t("goal.limitOver", { time: duration(g.played - g.target) }) : t("goal.limitLeft", { time: duration(g.left) })
      : g.state === "done" ? t("goal.reachDone") : t("goal.reachLeft", { time: duration(g.left), day: duration(g.perDay) });
  return (
    <div className={`goal ${compact ? "goal-compact" : ""}`}>
      <GoalRing ratio={g.ratio} state={g.state} size={compact ? 96 : 120}>
        <span className="ring-num num">{Math.round(g.ratio * 100)}%</span>
      </GoalRing>
      <div className="goal-text">
        <p className="eyebrow">{t(g.mode === "limit" ? "goal.limitTitle" : "goal.reachTitle")}</p>
        <p className="goal-main"><span className="num">{duration(g.played)}</span> <span className="muted">/ {duration(g.target)}</span></p>
        <p className={`goal-line goal-${g.state}`}>{line}</p>
        <a href={href("profile", "", { focus: "goal" })} className="goal-edit">{t("goal.change")}</a>
      </div>
    </div>
  );
}

export function HomePage() {
  const { t, duration, formatNumber, formatDate } = useI18n();
  const { me, data, players } = useDb();
  const today = useToday();
  const [open, setOpen] = useState(null);
  const [editClip, setEditClip] = useState(null);

  const week = S.periodRange("week", today);
  const weekSessions = S.inRange(data.sessions, week);
  const total = weekSessions.reduce((a, s) => a + s.minutes, 0);
  const trend = S.weekSoFarTrend(data.sessions, today);
  const streak = S.streaks(data.sessions, today);
  const days = S.dailySeries(data.sessions, [addDays(today, -13), today]).map((d) => ({
    key: d.date, minutes: d.minutes, label: formatDate(fromKey(d.date), { weekday: "narrow" }), hint: formatDate(fromKey(d.date), { day: "numeric", month: "short" }),
  }));
  const top = S.byGame(weekSessions)[0];
  const topGame = top && data.games.find((g) => g.id === top.game);
  const rank = useMemo(() => {
    const rows = S.leaderboard(players(), { period: "week", metric: "time", today });
    const i = rows.findIndex((r) => r.username === me.username);
    return { rank: i >= 0 ? rows[i].rank : null, of: rows.length };
  }, [players, me.username, today, data]);
  const hour = new Date().getHours();
  const greet = hour < 5 ? "home.night" : hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : "home.evening";
  const gameTitle = (id) => data.games.find((g) => g.id === id)?.title || "";
  const pct = trend == null ? null : Math.round(trend * 100);

  return (
    <div className="container home">
      <section className="home-hero">
        <div>
          <p className="eyebrow num">{formatDate(fromKey(today), { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 tabIndex={-1}>{t(greet, { name: me.name })}</h1>
          <p className="lede muted">{weekSessions.length ? t("home.weekLine", { count: weekSessions.length, time: duration(total) }) : t("home.weekEmpty")}</p>
        </div>
        <StartSession />
      </section>

      <dl className="stat-row">
        <Stat label={t("home.thisWeek")} value={duration(total, { short: true })} sub={pct == null ? t("home.noCompare") : t(pct >= 0 ? "home.upVs" : "home.downVs", { pct: formatNumber(Math.abs(pct)) })} />
        <Stat label={t("home.sessions")} value={formatNumber(weekSessions.length)} sub={t("home.sessionsSub", { count: new Set(weekSessions.map((s) => s.date)).size })} />
        <Stat label={t("home.streak")} value={t("home.days", { count: streak.current })} sub={t("home.best", { count: streak.longest })} />
        <Stat label={t("home.rank")} value={rank.rank ? `#${rank.rank}` : "—"} sub={rank.rank ? <a href={href("leaderboard")}>{t("home.rankOf", { count: rank.of })}</a> : t("home.rankNone")} />
      </dl>

      <div className="home-grid">
        <section className="home-activity" aria-labelledby="actTitle">
          <div className="section-head">
            <h2 id="actTitle">{t("home.last14")}</h2>
            <a className="more-link" href={href("stats")}>{t("home.allStats")} <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <figure role="img" aria-label={t("home.chartSummary", { time: duration(days.reduce((a, d) => a + d.minutes, 0)), count: days.filter((d) => d.minutes).length })}>
            <BarChart data={days} height={150} highlightKey={today} />
          </figure>
        </section>
        <section className="home-goal" aria-labelledby="goalTitle">
          <h2 id="goalTitle" className="visually-hidden">{t("goal.title")}</h2>
          <GoalSummary data={data} today={today} />
        </section>
      </div>

      <div className="home-grid home-grid-2">
        <section aria-labelledby="topTitle" className="home-top">
          <h2 id="topTitle">{t("home.topGame")}</h2>
          {topGame ? (
            <a className="top-game" href={href("game", topGame.id)}>
              <GameCover game={topGame} size="sm" />
              <span className="top-game-text">
                <span className="top-game-title">{topGame.title}</span>
                <span className="num top-game-time">{duration(top.minutes)}</span>
                <span className="muted">{t("home.topShare", { pct: formatNumber(Math.round(top.share * 100)), count: top.count })}</span>
                <SessionTrace sessions={weekSessions.filter((s) => s.game === topGame.id)} />
              </span>
            </a>
          ) : <p className="muted">{t("home.noTop")}</p>}
        </section>
        <section aria-labelledby="recentTitle" className="home-recent">
          <div className="section-head">
            <h2 id="recentTitle">{t("home.recent")}</h2>
            <a className="more-link" href={href("log")}>{t("home.allSessions")} <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          {data.sessions.length ? <SessionList sessions={data.sessions} games={data.games} limit={5} editable={false} /> : <p className="muted">{t("log.empty")}</p>}
        </section>
      </div>

      <section aria-labelledby="clipsTitle" className="home-clips">
        <div className="section-head">
          <h2 id="clipsTitle">{t("home.latestClips")}</h2>
          <a className="more-link" href={href("clips")}>{t("home.allClips")} <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        {data.clips.length ? (
          <div className="clip-grid clip-grid-3">
            {[...data.clips].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((c) => (
              <ClipCard key={c.id} clip={c} owner={me} gameTitle={gameTitle(c.game)} onOpen={() => setOpen(c)} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Clapperboard} title={t("clips.emptyMine")} text={t("clips.emptyMineText")}>
            <a className="btn btn-secondary" href={href("clips", "", { add: "1" })}>{t("clips.add")}</a>
          </EmptyState>
        )}
      </section>

      {open && <ClipPlayer clip={open} owner={me} gameTitle={gameTitle(open.game)} onClose={() => setOpen(null)} onEdit={() => { setEditClip(open); setOpen(null); }} />}
      <Modal open={!!editClip} onClose={() => setEditClip(null)} titleId="editClipT" title={t("clips.editTitle")}>
        {editClip && <ClipForm initial={editClip} games={data.games} onDone={() => setEditClip(null)} />}
      </Modal>
    </div>
  );
}
