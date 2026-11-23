// One game: cover and title, editable status / rating / platform / notes,
// its numbers, time per week, the session history and its clips.
import { useEffect, useState } from "react";
import { Heart, Trash2, Plus, Clock, ChevronLeft } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { href, navigate } from "../lib/router.js";
import { addDays, fromKey } from "../lib/dates.js";
import { catalogById, PLATFORMS } from "../data/catalog.js";
import * as S from "../lib/stats.js";
import * as db from "../lib/db.js";
import { GameCover } from "../components/GameCover.jsx";
import { StarInput, Stat, SessionTrace, EmptyState, Field } from "../components/ui.jsx";
import { StartSession, SessionForm, SessionList } from "../components/Sessions.jsx";
import { ClipCard, ClipPlayer, ClipForm } from "../components/Clips.jsx";
import { BarChart, ChartBlock, DataTable } from "../components/Charts.jsx";
import { Modal } from "../components/Modal.jsx";
import { useToast } from "../components/useToast.js";
import { STATUSES } from "./Library.jsx";
import { NotFound } from "./NotFound.jsx";

export function GamePage({ route }) {
  const { t, duration, shortDate, axisDate } = useI18n();
  const { me, data } = useDb();
  const today = useToday();
  const toast = useToast();
  const game = data.games.find((g) => g.id === route.param);
  const [notes, setNotes] = useState(game?.notes || "");
  const [logOpen, setLogOpen] = useState(false);
  const [clipOpen, setClipOpen] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [editClip, setEditClip] = useState(null);
  useEffect(() => setNotes(game?.notes || ""), [game?.id]); // eslint-disable-line
  if (!game) return <NotFound what="game" />;

  const cat = game.catalogId ? catalogById(game.catalogId) : null;
  const sessions = data.sessions.filter((s) => s.game === game.id);
  const sum = S.summary(sessions);
  const streak = S.streaks(sessions, today);
  const last = sessions.reduce((m, s) => (s.date > m ? s.date : m), "");
  const weeks = S.weeklySeries(sessions, [addDays(S.weekStart(today), -7 * 11), today]).map((w) => ({ key: w.date, minutes: w.minutes, label: axisDate(w.date), hint: t("stats.weekOf", { date: shortDate(w.date) }) }));
  const clips = data.clips.filter((c) => c.game === game.id);
  const save = (patch) => db.updateGame(game.id, patch);
  const remove = () => {
    const snap = db.removeGame(game.id);
    navigate("library");
    toast(t("game.removed", { title: game.title }), { label: t("undo"), run: () => db.restoreGame(snap) });
  };
  const platforms = cat ? cat.platforms : PLATFORMS;

  return (
    <div className="container game-page">
      <a className="back-link" href={href("library")}><ChevronLeft size={16} aria-hidden="true" />{t("nav.library")}</a>
      <section className="game-hero">
        <GameCover game={game} size="lg" />
        <div className="game-hero-text">
          <p className="eyebrow">{[game.genre ? t("genre." + game.genre) : t("genre.other"), cat?.studio, cat?.year].filter(Boolean).join(" · ")}</p>
          <h1 tabIndex={-1}>{game.title}</h1>
          <SessionTrace sessions={[...sessions].sort((a, b) => a.date.localeCompare(b.date))} max={40} label={t("game.traceLabel", { count: sessions.length })} />
          <div className="game-controls">
            <Field id="g-status" label={t("lib.status")}>
              {(a) => <select {...a} className="select" value={game.status} onChange={(e) => save({ status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{t("status." + s)}</option>)}</select>}
            </Field>
            <Field id="g-platform" label={t("lib.platform")}>
              {(a) => <select {...a} className="select" value={game.platform} onChange={(e) => save({ platform: e.target.value })}>{platforms.map((p) => <option key={p} value={p}>{t("platform." + p)}</option>)}</select>}
            </Field>
            <StarInput value={game.rating} onChange={(n) => save({ rating: n })} />
            <button type="button" className={`btn btn-secondary fav-btn ${game.fav ? "is-on" : ""}`} aria-pressed={game.fav} onClick={() => save({ fav: !game.fav })}>
              <Heart size={16} aria-hidden="true" fill={game.fav ? "currentColor" : "none"} />{t("game.fav")}
            </button>
          </div>
        </div>
        <div className="game-start"><StartSession fixedGame={game.id} /></div>
      </section>

      <dl className="stat-row">
        <Stat label={t("game.total")} value={duration(sum.total, { short: true })} sub={t("game.sessions", { count: sum.count })} />
        <Stat label={t("game.avg")} value={sum.count ? duration(sum.avgSession) : "—"} sub={sum.longest ? t("game.longest", { time: duration(sum.longest.minutes) }) : ""} />
        <Stat label={t("game.last")} value={last ? shortDate(last) : "—"} sub={last ? t("game.daysAgo", { count: Math.round((fromKey(today) - fromKey(last)) / 864e5) }) : t("lib.notPlayed")} />
        <Stat label={t("game.streak")} value={t("home.days", { count: streak.current })} sub={t("home.best", { count: streak.longest })} />
      </dl>

      <ChartBlock title={t("game.perWeek")} summary={t("game.perWeekSummary", { time: duration(weeks.reduce((a, w) => a + w.minutes, 0)) })}
        table={<DataTable head={[t("stats.week"), t("stats.time")]} rows={weeks.map((w) => [w.hint, duration(w.minutes)])} />}>
        <BarChart data={weeks} height={140} />
      </ChartBlock>

      <div className="game-cols">
        <section aria-labelledby="gSessions">
          <div className="section-head">
            <h2 id="gSessions">{t("game.history")}</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLogOpen(true)}><Clock size={15} aria-hidden="true" />{t("game.logTime")}</button>
          </div>
          {sessions.length ? <SessionList sessions={sessions} games={data.games} showGame={false} /> : <p className="muted">{t("game.noSessions")}</p>}
        </section>
        <aside className="game-side">
          <section aria-labelledby="gNotes">
            <h2 id="gNotes">{t("game.notes")}</h2>
            <label className="visually-hidden" htmlFor="g-notes">{t("game.notes")}</label>
            <textarea id="g-notes" className="textarea" value={notes} maxLength={600} placeholder={t("game.notesPh")} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== game.notes) { save({ notes }); toast(t("game.notesSaved")); } }} />
          </section>
          <section aria-labelledby="gClips">
            <div className="section-head">
              <h2 id="gClips">{t("nav.clips")}</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setClipOpen(true)}><Plus size={15} aria-hidden="true" />{t("clips.add")}</button>
            </div>
            {clips.length ? (
              <div className="clip-grid clip-grid-side">
                {clips.map((c) => <ClipCard key={c.id} clip={c} owner={me} gameTitle={game.title} onOpen={() => setPlaying(c)} />)}
              </div>
            ) : <p className="muted">{t("game.noClips")}</p>}
          </section>
          <section className="danger-zone" aria-labelledby="gDanger">
            <h2 id="gDanger" className="visually-hidden">{t("game.remove")}</h2>
            <button type="button" className="btn btn-danger btn-sm" onClick={remove}><Trash2 size={15} aria-hidden="true" />{t("game.remove")}</button>
            <p className="field-hint">{t("game.removeHint", { count: sessions.length })}</p>
          </section>
        </aside>
      </div>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} titleId="gLogT" title={t("game.logTitle", { title: game.title })}>
        <SessionForm games={data.games} fixedGame={game.id} onDone={() => setLogOpen(false)} />
      </Modal>
      <Modal open={clipOpen} onClose={() => setClipOpen(false)} titleId="gClipT" title={t("clips.addTitle")}>
        {clipOpen && <ClipForm games={data.games} fixedGame={game.id} onDone={() => setClipOpen(false)} />}
      </Modal>
      {playing && <ClipPlayer clip={playing} owner={me} gameTitle={game.title} onClose={() => setPlaying(null)} onEdit={() => { setEditClip(playing); setPlaying(null); }} />}
      <Modal open={!!editClip} onClose={() => setEditClip(null)} titleId="gEditClip" title={t("clips.editTitle")}>
        {editClip && <ClipForm initial={editClip} games={data.games} onDone={() => setEditClip(null)} />}
      </Modal>
    </div>
  );
}
