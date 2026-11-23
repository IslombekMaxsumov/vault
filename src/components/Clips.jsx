// Clip card (16:9 thumbnail or a drawn placeholder), the player dialog (the
// video only loads after Play is pressed) and the add/edit clip form.
import { useState } from "react";
import { Heart, Play, ExternalLink, Copy, Pencil, Trash2, Link2 } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import * as db from "../lib/db.js";
import { parseClipUrl, embedUrl, PLATFORM_NAMES } from "../lib/clips.js";
import { gameColor, hashString } from "../lib/gameColor.js";
import { Field, Avatar } from "./ui.jsx";
import { GameSelect } from "./Sessions.jsx";
import { Mark } from "./Logo.jsx";
import { Modal } from "./Modal.jsx";
import { useToast } from "./useToast.js";

// Thumbnail with a fallback: a placeholder in the game's colour with its title.
export function ClipThumb({ clip, gameTitle }) {
  const p = parseClipUrl(clip.url);
  const [broken, setBroken] = useState(false);
  const title = gameTitle || clip.title || "VAULT";
  if (p?.thumb && !broken) {
    return (
      <div className="thumb">
        <img src={p.thumb} alt="" loading="lazy" onError={() => setBroken(true)} />
      </div>
    );
  }
  const h = hashString(clip.url);
  return (
    <div className="thumb thumb-ph" style={{ "--cover": gameColor(title) }}>
      <svg className="thumb-art" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={18 + i * 9} y={70 - ((h >> i) % 5) * 9 - 14} width="3" height={((h >> i) % 5) * 9 + 14} />)}
      </svg>
      <span className="thumb-title">{title}</span>
      <Mark size={12} className="thumb-mark" />
    </div>
  );
}

export function ClipCard({ clip, owner, gameTitle, onOpen }) {
  const { t, shortDate } = useI18n();
  const { me } = useDb();
  const p = parseClipUrl(clip.url);
  const liked = clip.likedBy?.includes(me?.username);
  const [pop, setPop] = useState(false);
  const like = () => { db.toggleLike(owner.username, clip.id); setPop(true); setTimeout(() => setPop(false), 260); };
  return (
    <article className="clip-card">
      <button type="button" className="clip-open" onClick={onOpen} aria-label={t("clips.open", { title: clip.title || gameTitle || PLATFORM_NAMES[p?.platform] })}>
        <ClipThumb clip={clip} gameTitle={gameTitle} />
        <span className="clip-badge">{PLATFORM_NAMES[p?.platform || "link"]}</span>
        <span className="clip-play" aria-hidden="true">{p?.embeddable ? <Play size={18} fill="currentColor" /> : <ExternalLink size={16} />}</span>
      </button>
      <div className="clip-info">
      <div className="clip-meta">
        <h3 className="clip-title">{clip.title || t("clips.untitled")}</h3>
        <p className="clip-sub">
          {gameTitle && <span>{gameTitle}</span>}
          <span className="num">{shortDate(clip.date)}</span>
          {owner && owner.username !== me?.username && <span className="clip-owner"><Avatar user={owner} size={16} />{owner.name}</span>}
        </p>
      </div>
      <button type="button" className={`like ${liked ? "is-on" : ""} ${pop ? "pop" : ""}`} aria-pressed={liked} onClick={like} aria-label={t(liked ? "clips.unlike" : "clips.like", { title: clip.title || "" })}>
        <Heart size={16} aria-hidden="true" fill={liked ? "currentColor" : "none"} />
        <span className="num">{db.likeCount(clip)}</span>
      </button>
      </div>
    </article>
  );
}

export function ClipPlayer({ clip, owner, gameTitle, onClose, onEdit }) {
  const { t } = useI18n();
  const { me } = useDb();
  const toast = useToast();
  const [playing, setPlaying] = useState(false);
  if (!clip) return null;
  const p = parseClipUrl(clip.url);
  const mine = owner?.username === me?.username;
  const copy = async () => {
    try { await navigator.clipboard.writeText(clip.url); toast(t("clips.copied")); } catch { toast(t("clips.copyFail")); }
  };
  const remove = () => {
    const snap = db.removeClip(clip.id);
    onClose();
    toast(t("clips.removed"), { label: t("undo"), run: () => db.restoreClip(snap) });
  };
  return (
    <Modal open onClose={onClose} titleId="clipTitle" title={clip.title || t("clips.untitled")} className="modal-wide clip-modal">
      <div className="player">
        {playing && p?.platform === "file" ? (
          <video src={clip.url} controls autoPlay playsInline />
        ) : playing && p?.embeddable ? (
          <iframe src={embedUrl(clip, window.location.hostname || "localhost")} title={clip.title || t("clips.player")} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <div className="player-cover">
            <ClipThumb clip={clip} gameTitle={gameTitle} />
            {p?.embeddable ? (
              <button type="button" className="btn btn-primary player-play" onClick={() => setPlaying(true)}><Play size={18} fill="currentColor" aria-hidden="true" />{t("clips.play")}</button>
            ) : (
              <a className="btn btn-primary player-play" href={clip.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />{t("clips.openOn", { site: PLATFORM_NAMES[p?.platform || "link"] })}</a>
            )}
          </div>
        )}
      </div>
      {p?.embeddable && !playing && <p className="field-hint">{t("clips.loadNote", { site: PLATFORM_NAMES[p.platform] })}</p>}
      <div className="player-info">
        <p className="clip-sub">{gameTitle && <span>{gameTitle}</span>}{owner && <span className="clip-owner"><Avatar user={owner} size={18} />{owner.name}</span>}{clip.tags?.map((tag) => <span key={tag} className="tag">#{tag}</span>)}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={copy}><Copy size={15} aria-hidden="true" />{t("clips.copy")}</button>
          <a className="btn btn-ghost btn-sm" href={clip.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true" />{t("clips.original")}</a>
          {mine && <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}><Pencil size={15} aria-hidden="true" />{t("edit")}</button>}
          {mine && <button type="button" className="btn btn-danger btn-sm" onClick={remove}><Trash2 size={15} aria-hidden="true" />{t("delete")}</button>}
        </div>
      </div>
    </Modal>
  );
}

// Add or edit a clip. The link is read as you type and the site is shown.
export function ClipForm({ initial, games, onDone, fixedGame }) {
  const { t } = useI18n();
  const toast = useToast();
  useToday();
  const [f, setF] = useState(() => ({ url: initial?.url || "", title: initial?.title || "", game: initial?.game || fixedGame || "", tags: (initial?.tags || []).join(", ") }));
  const [errors, setErrors] = useState({});
  const p = parseClipUrl(f.url);
  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.url.trim()) errs.url = "err.urlEmpty";
    else if (!p) errs.url = "err.url";
    if (f.title.trim().length > 80) errs.title = "err.titleLong";
    setErrors(errs);
    if (Object.keys(errs).length) return document.getElementById("cf-" + Object.keys(errs)[0])?.focus();
    const tags = f.tags.split(/[,#\s]+/).map((s) => s.trim().toLowerCase().slice(0, 20)).filter(Boolean);
    const payload = { url: p.url, title: f.title.trim(), game: f.game, tags: [...new Set(tags)].slice(0, 5) };
    if (initial) { db.updateClip(initial.id, payload); toast(t("clips.saved")); }
    else { db.addClip(payload); toast(t("clips.added")); }
    onDone?.();
  };
  return (
    <form className="clip-form" onSubmit={submit} noValidate>
      <Field id="cf-url" label={t("clips.link")} hint={t("clips.linkHint")} error={errors.url}>
        {(a) => <input {...a} className="input" type="url" inputMode="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://youtu.be/…" autoComplete="off" spellCheck="false" />}
      </Field>
      {p && (
        <div className="clip-detect">
          <Link2 size={16} aria-hidden="true" />
          <span>{p.embeddable ? t("clips.detected", { site: PLATFORM_NAMES[p.platform] }) : t("clips.detectedLink", { site: PLATFORM_NAMES[p.platform] })}</span>
          {p.thumb && <img src={p.thumb} alt="" className="clip-detect-thumb" />}
        </div>
      )}
      <Field id="cf-title" label={t("clips.title")} hint={t("log.optional")} error={errors.title}>
        {(a) => <input {...a} className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={90} />}
      </Field>
      {!fixedGame && (
        <Field id="cf-game" label={t("log.game")} hint={t("log.optional")}>
          {(a) => <GameSelect {...a} games={games} value={f.game} onChange={(v) => setF({ ...f, game: v })} />}
        </Field>
      )}
      <Field id="cf-tags" label={t("clips.tags")} hint={t("clips.tagsHint")}>
        {(a) => <input {...a} className="input" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} autoComplete="off" />}
      </Field>
      <div className="form-actions"><button type="submit" className="btn btn-primary">{initial ? t("save") : t("clips.add")}</button></div>
    </form>
  );
}
