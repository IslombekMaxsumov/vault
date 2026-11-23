// Library: search, status chips, platform / genre / sort, a cover grid, and the
// "Add a game" dialog (search the built-in catalog or add any title by hand).
// Filters live in the address (#/library?status=playing&sort=played).
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Library as LibIcon, Heart } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { href, setQuery, navigate } from "../lib/router.js";
import { searchCatalog, GENRES, PLATFORMS } from "../data/catalog.js";
import * as db from "../lib/db.js";
import { byGame } from "../lib/stats.js";
import { GameCover } from "../components/GameCover.jsx";
import { Stars, StatusBadge, EmptyState, Field } from "../components/ui.jsx";
import { Modal } from "../components/Modal.jsx";
import { useToast } from "../components/useToast.js";

export const STATUSES = ["playing", "backlog", "done", "dropped"];
const SORTS = ["played", "most", "name", "rating", "added"];

export function AddGameDialog({ open, onClose }) {
  const { t } = useI18n();
  const { data } = useDb();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState(false);
  const [f, setF] = useState({ title: "", genre: "", platform: "pc", status: "playing" });
  const [err, setErr] = useState("");
  useEffect(() => { if (open) { setQ(""); setCustom(false); setErr(""); } }, [open]);
  const owned = data.games.map((g) => g.catalogId).filter(Boolean);
  const results = searchCatalog(q, { exclude: owned }).slice(0, 8);
  const add = (game) => {
    if (!game) return;
    toast(t("lib.added", { title: game.title }));
    onClose();
    navigate("game", game.id);
  };
  const addCustom = (e) => {
    e.preventDefault();
    const title = f.title.trim();
    if (title.length < 2) return setErr("err.gameTitle");
    if (data.games.some((g) => g.title.toLowerCase() === title.toLowerCase())) return setErr("err.gameExists");
    add(db.addGame({ ...f, title }));
  };
  return (
    <Modal open={open} onClose={onClose} titleId="addGameT" title={t("lib.addTitle")}>
      {!custom ? (
        <div className="add-game">
          <Field id="ag-q" label={t("lib.searchCatalog")}>
            {(a) => <input {...a} className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("lib.catalogPh")} autoComplete="off" autoFocus />}
          </Field>
          <ul className="catalog-list" aria-label={t("lib.results")}>
            {results.map((g) => (
              <li key={g.id}>
                <button type="button" className="catalog-item" onClick={() => add(db.addGame({ catalogId: g.id, platform: g.platforms[0] }))}>
                  <GameCover game={{ ...g, platform: g.platforms[0] }} size="xs" />
                  <span className="catalog-text">
                    <span className="catalog-title">{g.title}</span>
                    <span className="muted">{t("genre." + g.genre)} · {g.studio} · <span className="num">{g.year}</span></span>
                  </span>
                  <Plus size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!results.length && <p className="muted">{t("lib.noCatalog", { q })}</p>}
          <button type="button" className="btn btn-secondary" onClick={() => { setCustom(true); setF({ ...f, title: q }); }}>{t("lib.addOwn")}</button>
        </div>
      ) : (
        <form className="form-stack" onSubmit={addCustom} noValidate>
          <Field id="ag-title" label={t("lib.gameTitle")} error={err}>
            {(a) => <input {...a} className="input" value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErr(""); }} maxLength={60} autoFocus />}
          </Field>
          <div className="form-row">
            <Field id="ag-genre" label={t("lib.genre")}>
              {(a) => <select {...a} className="select" value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })}><option value="">{t("genre.other")}</option>{GENRES.map((g) => <option key={g} value={g}>{t("genre." + g)}</option>)}</select>}
            </Field>
            <Field id="ag-platform" label={t("lib.platform")}>
              {(a) => <select {...a} className="select" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{t("platform." + p)}</option>)}</select>}
            </Field>
          </div>
          <Field id="ag-status" label={t("lib.status")}>
            {(a) => <select {...a} className="select" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{t("status." + s)}</option>)}</select>}
          </Field>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setCustom(false)}>{t("back")}</button>
            <button type="submit" className="btn btn-primary">{t("lib.add")}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function LibraryPage({ route }) {
  const { t, duration, shortDate, formatNumber } = useI18n();
  const { data } = useDb();
  useToday();
  const q = route.query;
  const state = { q: q.get("q") || "", status: STATUSES.includes(q.get("status")) ? q.get("status") : "", platform: PLATFORMS.includes(q.get("platform")) ? q.get("platform") : "", genre: GENRES.includes(q.get("genre")) ? q.get("genre") : "", sort: SORTS.includes(q.get("sort")) ? q.get("sort") : "played" };
  const [search, setSearch] = useState(state.q);
  const update = (patch) => setQuery({ ...state, ...patch, sort: (patch.sort ?? state.sort) === "played" ? "" : patch.sort ?? state.sort });
  const [adding, setAdding] = useState(q.get("add") === "1");
  useEffect(() => { const id = setTimeout(() => { if (search !== state.q) update({ q: search }); }, 200); return () => clearTimeout(id); }, [search]); // eslint-disable-line

  const totals = useMemo(() => new Map(byGame(data.sessions).map((g) => [g.game, g])), [data.sessions]);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, data.games.filter((g) => g.status === s).length]));
  const norm = (s) => s.toLowerCase();
  let list = data.games.filter((g) =>
    (!state.status || g.status === state.status) && (!state.platform || g.platform === state.platform) && (!state.genre || g.genre === state.genre) &&
    (!state.q || norm(g.title).includes(norm(state.q))));
  const info = (g) => totals.get(g.id) || { minutes: 0, count: 0, last: "" };
  const sorters = {
    played: (a, b) => (info(b).last || "").localeCompare(info(a).last || "") || a.title.localeCompare(b.title),
    most: (a, b) => info(b).minutes - info(a).minutes,
    name: (a, b) => a.title.localeCompare(b.title),
    rating: (a, b) => b.rating - a.rating || a.title.localeCompare(b.title),
    added: (a, b) => (b.added || "").localeCompare(a.added || ""),
  };
  list = [...list].sort((a, b) => (b.fav - a.fav) * (state.sort === "played" ? 1 : 0) || sorters[state.sort](a, b));
  const filtered = state.q || state.status || state.platform || state.genre;

  return (
    <div className="container library">
      <div className="page-head">
        <div>
          <h1 tabIndex={-1}>{t("nav.library")}</h1>
          <p className="muted">{t("lib.count", { count: data.games.length })}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" />{t("lib.add")}</button>
      </div>

      {data.games.length > 0 && (
        <div className="filters">
          <div className="search-box">
            <Search size={16} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="libSearch">{t("lib.search")}</label>
            <input id="libSearch" className="input" type="search" placeholder={t("lib.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="chips" role="group" aria-label={t("lib.status")}>
            <button type="button" className="chip" aria-pressed={!state.status} onClick={() => update({ status: "" })}>{t("lib.all")} <span className="num">{data.games.length}</span></button>
            {STATUSES.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={state.status === s} onClick={() => update({ status: state.status === s ? "" : s })}>{t("status." + s)} <span className="num">{counts[s]}</span></button>
            ))}
          </div>
          <div className="filter-selects">
            <label className="mini-field"><span>{t("lib.platform")}</span>
              <select className="select" value={state.platform} onChange={(e) => update({ platform: e.target.value })}><option value="">{t("lib.any")}</option>{PLATFORMS.map((p) => <option key={p} value={p}>{t("platform." + p)}</option>)}</select>
            </label>
            <label className="mini-field"><span>{t("lib.genre")}</span>
              <select className="select" value={state.genre} onChange={(e) => update({ genre: e.target.value })}><option value="">{t("lib.any")}</option>{GENRES.map((g) => <option key={g} value={g}>{t("genre." + g)}</option>)}</select>
            </label>
            <label className="mini-field"><span>{t("lib.sort")}</span>
              <select className="select" value={state.sort} onChange={(e) => update({ sort: e.target.value })}>{SORTS.map((s) => <option key={s} value={s}>{t("lib.sort." + s)}</option>)}</select>
            </label>
          </div>
        </div>
      )}

      {data.games.length === 0 ? (
        <EmptyState icon={LibIcon} title={t("lib.emptyTitle")} text={t("lib.emptyText")}>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>{t("lib.add")}</button>
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon={Search} title={t("lib.noResults")} text={t("lib.noResultsText")}>
          <button type="button" className="btn btn-secondary" onClick={() => { setSearch(""); setQuery({}); }}>{t("lib.clear")}</button>
        </EmptyState>
      ) : (
        <>
          {filtered && <p className="result-count muted" role="status">{t("lib.showing", { count: list.length })}</p>}
          <ul className="cover-grid">
            {list.map((g) => {
              const i = info(g);
              return (
                <li key={g.id} className="game-card">
                  <a href={href("game", g.id)} className="game-link">
                    <GameCover game={g} />
                    <span className="game-name">{g.title}</span>
                  </a>
                  <div className="game-meta">
                    <StatusBadge status={g.status} />
                    {g.fav && <Heart size={13} aria-label={t("game.fav")} fill="currentColor" className="fav-mark" />}
                    <Stars value={g.rating} />
                  </div>
                  <p className="game-numbers">
                    <span className="num">{i.minutes ? duration(i.minutes, { short: true }) : t("lib.notPlayed")}</span>
                    {i.last && <span className="muted">{t("lib.last", { date: shortDate(i.last) })}</span>}
                    {i.count > 0 && <span className="muted visually-hidden">{formatNumber(i.count)}</span>}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <AddGameDialog open={adding} onClose={() => { setAdding(false); if (q.get("add")) update({}); }} />
    </div>
  );
}
