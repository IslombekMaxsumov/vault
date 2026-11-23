// Clips: My clips / Everyone, filters by game and site, sort by newest or most
// liked, the add dialog and the player. State lives in the address.
import { useMemo, useState } from "react";
import { Plus, Clapperboard, Search } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { setQuery } from "../lib/router.js";
import { parseClipUrl, PLATFORM_NAMES } from "../lib/clips.js";
import * as db from "../lib/db.js";
import { ClipCard, ClipPlayer, ClipForm } from "../components/Clips.jsx";
import { Segmented, EmptyState } from "../components/ui.jsx";
import { Modal } from "../components/Modal.jsx";

export function ClipsPage({ route }) {
  const { t } = useI18n();
  const { me, data, players, version } = useDb();
  const q = route.query;
  const tab = q.get("tab") === "all" ? "all" : "mine";
  const sort = q.get("sort") === "liked" ? "liked" : "new";
  const site = q.get("site") || "";
  const game = q.get("game") || "";
  const update = (patch) => setQuery({ tab: tab === "mine" ? "" : tab, sort: sort === "new" ? "" : sort, site, game, ...patch });
  const [adding, setAdding] = useState(q.get("add") === "1");
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);

  // Every clip with its owner and game title.
  const all = useMemo(() => {
    const out = [];
    for (const p of players()) {
      if (tab === "mine" && p.username !== me.username) continue;
      for (const c of p.clips) out.push({ clip: c, owner: p, gameTitle: p.games.find((g) => g.id === c.game)?.title || "" });
    }
    return out;
  }, [players, tab, me.username, version]); // eslint-disable-line

  const games = [...new Set(all.map((x) => x.gameTitle).filter(Boolean))].sort();
  const sites = [...new Set(all.map((x) => parseClipUrl(x.clip.url)?.platform).filter(Boolean))];
  let list = all.filter((x) => (!game || x.gameTitle === game) && (!site || parseClipUrl(x.clip.url)?.platform === site));
  list.sort(sort === "liked" ? (a, b) => db.likeCount(b.clip) - db.likeCount(a.clip) || b.clip.date.localeCompare(a.clip.date) : (a, b) => b.clip.date.localeCompare(a.clip.date));
  const current = open && all.find((x) => x.clip.id === open);

  return (
    <div className="container clips-page">
      <div className="page-head">
        <div>
          <h1 tabIndex={-1}>{t("nav.clips")}</h1>
          <p className="muted">{t("clips.intro")}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" />{t("clips.add")}</button>
      </div>
      <div className="filters filters-row">
        <Segmented label={t("clips.whose")} value={tab} onChange={(v) => update({ tab: v === "mine" ? "" : v, game: "", site: "" })} options={[{ value: "mine", label: t("clips.mine") }, { value: "all", label: t("clips.everyone") }]} />
        <div className="filter-selects">
          <label className="mini-field"><span>{t("log.game")}</span>
            <select className="select" value={game} onChange={(e) => update({ game: e.target.value })}><option value="">{t("lib.any")}</option>{games.map((g) => <option key={g} value={g}>{g}</option>)}</select>
          </label>
          <label className="mini-field"><span>{t("clips.site")}</span>
            <select className="select" value={site} onChange={(e) => update({ site: e.target.value })}><option value="">{t("lib.any")}</option>{sites.map((s) => <option key={s} value={s}>{PLATFORM_NAMES[s]}</option>)}</select>
          </label>
          <label className="mini-field"><span>{t("lib.sort")}</span>
            <select className="select" value={sort} onChange={(e) => update({ sort: e.target.value === "new" ? "" : e.target.value })}><option value="new">{t("clips.sortNew")}</option><option value="liked">{t("clips.sortLiked")}</option></select>
          </label>
        </div>
      </div>

      {list.length ? (
        <ul className="clip-grid">
          {list.map((x) => (
            <li key={x.owner.username + x.clip.id}><ClipCard clip={x.clip} owner={x.owner} gameTitle={x.gameTitle} onOpen={() => setOpen(x.clip.id)} /></li>
          ))}
        </ul>
      ) : all.length ? (
        <EmptyState icon={Search} title={t("lib.noResults")} text={t("clips.noMatch")}>
          <button type="button" className="btn btn-secondary" onClick={() => update({ game: "", site: "" })}>{t("lib.clear")}</button>
        </EmptyState>
      ) : (
        <EmptyState icon={Clapperboard} title={t("clips.emptyMine")} text={t("clips.emptyMineText")}>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>{t("clips.add")}</button>
        </EmptyState>
      )}

      <Modal open={adding} onClose={() => { setAdding(false); if (q.get("add")) update({}); }} titleId="addClipT" title={t("clips.addTitle")}>
        {adding && <ClipForm games={data.games} onDone={() => { setAdding(false); update({ tab: "" }); }} />}
      </Modal>
      {current && <ClipPlayer clip={current.clip} owner={current.owner} gameTitle={current.gameTitle} onClose={() => setOpen(null)} onEdit={() => { setEditing(current.clip); setOpen(null); }} />}
      <Modal open={!!editing} onClose={() => setEditing(null)} titleId="editClipT2" title={t("clips.editTitle")}>
        {editing && <ClipForm initial={editing} games={data.games} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
