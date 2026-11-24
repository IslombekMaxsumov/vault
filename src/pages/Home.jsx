// Home: an editorial hero (greeting, this week's time as the one big number,
// a few smaller figures, the featured game's art with the goal ring and the
// start-session control overlapping it), a wide activity band, the session
// timeline next to the week's goal, and an editorial clip gallery.
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
import { GoalRing, EmptyState, CountDuration, Orbits, SessionTrace } from "../components/ui.jsx";
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
      <GoalRing ratio={g.ratio} state={g.state} size={compact ? 92 : 132}>
        <span className="ring-num num">{Math.round(g.ratio * 100)}%</span>
      </GoalRing>
      <div className="goal-text">
        <p className="goal-kind">{t(g.mode === "limit" ? "goal.limitTitle" : "goal.reachTitle")}</p>
        <p className="goal-main"><span className="num">{duration(g.played)}</span> <span className="goal-of num">/ {duration(g.target)}</span></p>
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
  const goal = S.goalProgress(data.sessions, data.goal, today);
  const days = S.dailySeries(data.sessions, [addDays(today, -13), today]).map((d) => ({
    key: d.date, minutes: d.minutes, label: formatDate(fromKey(d.date), { weekday: "narrow" }), hint: formatDate(fromKey(d.date), { day: "numeric", month: "short" }),
  }));
  const fortnight = days.reduce((a, d) => a + d.minutes, 0);
  // featured game: most played this week, otherwise the last one played
  const top = S.byGame(weekSessions)[0];
  const lastPlayed = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const featured = data.games.find((g) => g.id === (top?.game || lastPlayed?.game)) || data.games[0];
  const rank = useMemo(() => {
    const rows = S.leaderboard(players(), { period: "week", metric: "time", today });
    const i = rows.findIndex((r) => r.username === me.username);
    return { rank: i >= 0 ? rows[i].rank : null, of: rows.length };
  }, [players, me.username, today, data]); // eslint-disable-line
  const hour = new Date().getHours();
  const greet = hour < 5 ? "home.night" : hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : "home.evening";
  const gameTitle = (id) => data.games.find((g) => g.id === id)?.title || "";
  const pct = trend == null ? null : Math.round(trend * 100);
  const clips = [...data.clips].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <div className="home">
      <section className="hero container" aria-labelledby="heroTitle">
        <div className="hero-text">
          <p className="hero-date num">{formatDate(fromKey(today), { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 id="heroTitle" tabIndex={-1} className="display">{t(greet, { name: me.name })}</h1>
          <div className="hero-figure">
            <p className="hero-figure-label">{t("home.thisWeek")}</p>
            <p className="hero-figure-num num"><CountDuration minutes={total} short /></p>
            <p className="hero-figure-sub">{pct == null ? t("home.noCompare") : t(pct >= 0 ? "home.upVs" : "home.downVs", { pct: formatNumber(Math.abs(pct)) })}</p>
          </div>
          <ul className="hero-facts">
            <li><span className="num">{formatNumber(weekSessions.length)}</span> {t("home.factSessions", { count: weekSessions.length })}</li>
            <li><span className="num">{formatNumber(streak.current)}</span> {t("home.factStreak", { count: streak.current })}</li>
            <li>{rank.rank ? <a href={href("leaderboard")}><span className="num">#{rank.rank}</span> {t("home.factRank", { count: rank.of })}</a> : t("home.rankNone")}</li>
          </ul>
        </div>

        <div className="hero-stage">
          <div className="hero-blobs" aria-hidden="true">
            <svg viewBox="0 0 600 600"><path className="blob blob-a" d="M421 96c62 43 104 121 95 196-9 76-69 148-143 186-75 38-163 41-226 2-62-39-98-119-88-196 10-76 66-149 137-187 72-38 163-44 225-1z" /><path className="blob blob-b" d="M386 141c49 32 82 92 76 151-7 59-53 117-112 147s-129 33-177 2c-49-31-77-94-69-154 8-59 52-116 108-146 56-29 125-33 174 0z" /></svg>
            <Orbits className="hero-orbits" count={4} />
          </div>
          {featured ? (
            <a className="hero-art" href={href("game", featured.id)} aria-label={t("home.featuredLabel", { title: featured.title })}>
              <GameCover game={featured} size="lg" />
            </a>
          ) : <div className="hero-art hero-art-empty" aria-hidden="true" />}
          {featured && (
            <p className="hero-caption">
              <span className="hero-caption-label">{top ? t("home.topGame") : t("home.lastPlayed")}</span>
              <a href={href("game", featured.id)} className="hero-caption-title">{featured.title}</a>
              {top && <span className="num hero-caption-time">{duration(top.minutes)} · {formatNumber(Math.round(top.share * 100))}%</span>}
              {top && <SessionTrace sessions={weekSessions.filter((s) => s.game === featured.id)} />}
            </p>
          )}
          <div className="hero-goal" title={t("goal.title")}>
            <GoalRing ratio={goal.ratio} state={goal.state} size={84}>
              <span className="ring-num num">{Math.round(goal.ratio * 100)}%</span>
            </GoalRing>
          </div>
          <div className="hero-start"><StartSession /></div>
        </div>
      </section>

      <section className="band" aria-labelledby="actTitle">
        <div className="container band-inner">
          <div className="band-head">
            <h2 id="actTitle">{t("home.last14")}</h2>
            <p className="band-total"><span className="num">{duration(fortnight)}</span> <span className="muted">{t("home.inTotal")}</span></p>
            <a className="more-link" href={href("stats")}>{t("home.allStats")} <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <figure className="band-chart" role="img" aria-label={t("home.chartSummary", { time: duration(fortnight), count: days.filter((d) => d.minutes).length })}>
            <BarChart data={days} height={170} highlightKey={today} />
          </figure>
        </div>
      </section>

      <div className="container home-split">
        <section className="home-recent" aria-labelledby="recentTitle">
          <div className="section-head">
            <h2 id="recentTitle">{t("home.recent")}</h2>
            <a className="more-link" href={href("log")}>{t("home.allSessions")} <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          {data.sessions.length ? <SessionList sessions={data.sessions} games={data.games} limit={6} editable={false} /> : <p className="muted">{t("log.empty")}</p>}
        </section>
        <aside className="home-week" aria-labelledby="weekTitle">
          <h2 id="weekTitle">{t("goal.title")}</h2>
          <GoalSummary data={data} today={today} />
          <p className="home-week-note">{t("home.bestStreak", { count: streak.longest })}</p>
        </aside>
      </div>

      <section className="container home-clips" aria-labelledby="clipsTitle">
        <div className="section-head">
          <h2 id="clipsTitle" className="h-big">{t("home.latestClips")}</h2>
          <a className="more-link" href={href("clips")}>{t("home.allClips")} <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        {clips.length ? (
          <div className={`gallery gallery-${clips.length}`}>
            {clips.map((c) => <ClipCard key={c.id} clip={c} owner={me} gameTitle={gameTitle(c.game)} onOpen={() => setOpen(c)} />)}
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
