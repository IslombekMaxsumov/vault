// Session pieces used on Home, Log and the game page: the start-a-session
// control, the session form (log by hand / edit), session rows grouped by day.
import { useMemo, useState } from "react";
import { Play, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb, useElapsed, clock } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import * as db from "../lib/db.js";
import { checkSession, parseDuration } from "../lib/stats.js";
import { href } from "../lib/router.js";
import { Field } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import { useToast } from "./useToast.js";
import { gameColor } from "../lib/gameColor.js";

// Games for a <select>: "playing" first, then the rest A–Z.
export function sortedForPicking(games) {
  const order = { playing: 0, backlog: 1, done: 2, dropped: 3 };
  return [...games].sort((a, b) => order[a.status] - order[b.status] || a.title.localeCompare(b.title));
}

export function GameSelect({ games, value, onChange, emptyLabel, ...rest }) {
  const { t } = useI18n();
  const list = sortedForPicking(games);
  return (
    <select {...rest} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{emptyLabel || t("log.chooseGame")}</option>
      {list.map((g) => <option key={g.id} value={g.id}>{g.title}{g.status !== "playing" ? ` · ${t("status." + g.status)}` : ""}</option>)}
    </select>
  );
}

// Big "start a session" block, or the running timer when one is on.
export function StartSession({ fixedGame }) {
  const { t, duration } = useI18n();
  const { data } = useDb();
  const toast = useToast();
  const [game, setGame] = useState(fixedGame || "");
  const [err, setErr] = useState("");
  const sec = useElapsed(data.timer?.startedAt);
  if (data.timer) {
    const g = data.games.find((x) => x.id === data.timer.game);
    const stop = () => {
      const s = db.stopTimer();
      if (s?.tooShort) return toast(t("timer.tooShort"));
      if (s) toast(t("timer.logged", { time: duration(s.minutes), game: g?.title || "" }), { label: t("undo"), run: () => db.removeSession(s.id) });
    };
    return (
      <div className="start start-running" style={{ "--game": gameColor(g?.title || "") }}>
        <p className="start-label">{t("timer.running")}</p>
        <p className="start-game">{g?.title}</p>
        <p className="start-clock num" role="timer" aria-label={t("timer.elapsed")}>{clock(sec)}</p>
        <div className="start-actions">
          <button type="button" className="btn btn-primary" onClick={stop}>{t("timer.stopLog")}</button>
          <button type="button" className="btn btn-ghost" onClick={() => { db.cancelTimer(); toast(t("timer.cancelled")); }}>{t("timer.cancel")}</button>
        </div>
        <p className="field-hint">{t("timer.keepsRunning")}</p>
      </div>
    );
  }
  if (!data.games.length) {
    return (
      <div className="start">
        <p className="start-label">{t("timer.title")}</p>
        <p className="muted">{t("timer.noGames")}</p>
        <a className="btn btn-primary" href={href("library", "", { add: "1" })}>{t("lib.add")}</a>
      </div>
    );
  }
  const start = (e) => {
    e.preventDefault();
    const id = fixedGame || game;
    if (!id) return setErr("err.game");
    db.startTimer(id);
    setErr("");
  };
  return (
    <form className="start" onSubmit={start} noValidate>
      <p className="start-label" id="startLabel">{t("timer.title")}</p>
      <div className="start-row">
        {!fixedGame && (
          <Field id="startGame" label={t("log.game")} error={err} className="start-field">
            {(a) => <GameSelect {...a} games={data.games} value={game} onChange={(v) => { setGame(v); setErr(""); }} />}
          </Field>
        )}
        <button type="submit" className="btn btn-primary start-btn"><Play size={16} fill="currentColor" aria-hidden="true" />{t("timer.start")}</button>
      </div>
      <p className="field-hint">{t("timer.hint")} <a href={href("log", "", { add: "1" })}>{t("timer.byHand")}</a></p>
    </form>
  );
}

// The log-by-hand form, also used to edit a session.
export function SessionForm({ initial, games, onDone, submitLabel, fixedGame }) {
  const { t, duration } = useI18n();
  const today = useToday();
  const { data } = useDb();
  const toast = useToast();
  const [f, setF] = useState(() => ({
    game: initial?.game || fixedGame || "", date: initial?.date || today, start: initial?.start || "",
    // shown as h:mm ("2:15"), the same way people type it
    duration: initial ? `${Math.floor(initial.minutes / 60)}:${String(initial.minutes % 60).padStart(2, "0")}` : "", note: initial?.note || "",
  }));
  const [errors, setErrors] = useState({});
  const minutes = parseDuration(f.duration);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value ?? e });
  const submit = (e) => {
    e.preventDefault();
    const others = data.sessions.filter((s) => s.id !== initial?.id);
    const errs = checkSession({ game: f.game, date: f.date, minutes, start: f.start }, others, today);
    setErrors(errs);
    const first = ["game", "date", "start", "minutes"].find((k) => errs[k]);
    if (first) return document.getElementById("sf-" + first)?.focus();
    const payload = { game: f.game, date: f.date, start: f.start, minutes, note: f.note };
    if (initial) {
      db.updateSession(initial.id, payload);
      toast(t("log.saved"));
    } else {
      const s = db.addSession(payload);
      toast(t("log.added", { time: duration(minutes), game: games.find((g) => g.id === f.game)?.title || "" }), { label: t("undo"), run: () => db.removeSession(s.id) });
      setF({ ...f, duration: "", note: "", start: "" });
    }
    onDone?.();
  };
  return (
    <form className="session-form" onSubmit={submit} noValidate>
      {!fixedGame && (
        <Field id="sf-game" label={t("log.game")} error={errors.game}>
          {(a) => <GameSelect {...a} games={games} value={f.game} onChange={(v) => setF({ ...f, game: v })} />}
        </Field>
      )}
      <div className="form-row">
        <Field id="sf-date" label={t("log.date")} error={errors.date}>
          {(a) => <input {...a} type="date" className="input" value={f.date} max={today} onChange={set("date")} />}
        </Field>
        <Field id="sf-start" label={t("log.startTime")} hint={t("log.optional")} error={errors.start}>
          {(a) => <input {...a} type="time" className="input" value={f.start} onChange={set("start")} />}
        </Field>
      </div>
      <Field id="sf-minutes" label={t("log.duration")} hint={Number.isFinite(minutes) && minutes > 0 ? t("log.reads", { time: duration(minutes) }) : t("log.durationHint")} error={errors.minutes}>
        {(a) => <input {...a} className="input num" inputMode="text" value={f.duration} onChange={set("duration")} placeholder="1:30" autoComplete="off" />}
      </Field>
      <Field id="sf-note" label={t("log.note")} hint={t("log.optional")}>
        {(a) => <input {...a} className="input" value={f.note} onChange={set("note")} maxLength={140} />}
      </Field>
      <div className="form-actions"><button type="submit" className="btn btn-primary">{submitLabel || t("log.add")}</button></div>
    </form>
  );
}

// Sessions grouped by day, newest first, with day totals.
export function SessionList({ sessions, games, editable = true, showGame = true, limit }) {
  const { t, duration, dayLabel } = useI18n();
  const today = useToday();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const groups = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || (b.start || "").localeCompare(a.start || ""));
    const cut = limit ? sorted.slice(0, limit) : sorted;
    const map = new Map();
    for (const s of cut) (map.get(s.date) || map.set(s.date, []).get(s.date)).push(s);
    return [...map.entries()];
  }, [sessions, limit]);
  const byId = (id) => games.find((g) => g.id === id);
  const remove = (s) => {
    const snap = db.removeSession(s.id);
    toast(t("log.removed"), { label: t("undo"), run: () => db.restoreSession(snap) });
  };
  return (
    <>
      {/* a timeline: one vertical line, a node per session sized by its length */}
      <ol className="timeline">
        {groups.map(([date, list]) => (
          <li key={date} className="tl-day">
            <div className="tl-head">
              <h3>{dayLabel(date, today)}</h3>
              <span className="tl-total num">{duration(list.reduce((a, s) => a + s.minutes, 0))}</span>
            </div>
            <ul className="tl-items">
              {list.map((s) => {
                const g = byId(s.game);
                return (
                  <li key={s.id} className={`tl-item ${db.isFresh(s.id) ? "is-fresh" : ""}`} style={{ "--game": gameColor(g?.title || ""), "--node": `${Math.round(8 + Math.min(14, s.minutes / 15))}px` }}>
                    <span className="tl-time num">{s.start || "·"}</span>
                    <span className="tl-node" aria-hidden="true" />
                    <span className="tl-body">
                      {showGame && (g ? <a href={href("game", g.id)} className="tl-game">{g.title}</a> : <span className="tl-game">{t("log.unknownGame")}</span>)}
                      {s.note && <span className="tl-note">{s.note}</span>}
                      {!showGame && !s.note && <span className="tl-note">{t("log.noNote")}</span>}
                    </span>
                    <span className="tl-dur num">{duration(s.minutes)}</span>
                    {editable && (
                      <span className="tl-actions">
                        <button type="button" className="icon-btn icon-btn-sm" aria-label={t("log.editOne", { game: g?.title || "" })} onClick={() => setEditing(s)}><Pencil size={15} aria-hidden="true" /></button>
                        <button type="button" className="icon-btn icon-btn-sm" aria-label={t("log.removeOne", { game: g?.title || "" })} onClick={() => remove(s)}><Trash2 size={15} aria-hidden="true" /></button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <Modal open={!!editing} onClose={() => setEditing(null)} titleId="editSession" title={t("log.editTitle")}>
        {editing && <SessionForm initial={editing} games={games} submitLabel={t("save")} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
