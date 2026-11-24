// Game covers (2:3). Catalog games show their official cover art (public/covers,
// downloaded by tools/covers.mjs) with a thin orbit overlay. Games added by
// hand, or art that fails to load, get a drawn cover: two colours and one of
// five compositions picked from the title's hash, set with the title in large
// type. Same title → same cover, every time.
// Both kinds have two layers (art and foreground) that move a little
// differently on hover (see .cover in app.css).
import { useState } from "react";
import { coverPlan } from "../lib/gameColor.js";
import { COVER_SOURCES } from "../data/covers.js";
import { useI18n } from "../i18n/useI18n.js";
import { Mark } from "./Logo.jsx";

const coverUrl = (id) => (id && COVER_SOURCES[id] ? `${import.meta.env.BASE_URL}covers/${id}.jpg` : "");

// Five compositions in a 200 × 300 box. "a" = main colour, "b" = second colour.
const COMPOSITIONS = [
  // eclipse: a large disc leaving the top-right corner, a thin ring around it
  (r) => <><circle cx={150 + (r % 30)} cy={70} r={110} className="b" /><circle cx={150 + (r % 30)} cy={70} r={132} className="line" /></>,
  // orbit: concentric ellipses around the middle
  (r) => <>{[0, 1, 2, 3].map((i) => <ellipse key={i} cx={100} cy={120} rx={150 - i * 30} ry={70 - i * 12} transform={`rotate(${-20 + (r % 25)} 100 120)`} className="line" />)}<circle cx={100 + (r % 40) - 20} cy={120} r={26} className="b" /></>,
  // arch: a tall arch rising from the bottom
  (r) => <><path d={`M${30 + (r % 20)} 300V170a${70 - (r % 20)} ${70 - (r % 20)} 0 0 1 ${140 - (r % 40)} 0V300z`} className="b" /><path d="M0 150Q100 90 200 150" className="line" /></>,
  // split: a soft curve cutting the cover into two colours
  (r) => <><path d={`M0 ${110 + (r % 50)}C70 ${60 + (r % 40)} 130 ${200 - (r % 40)} 200 ${140 + (r % 30)}V300H0z`} className="b" /><circle cx={160} cy={60} r={14} className="b" /></>,
  // stack: three pills of different lengths
  (r) => <>{[0, 1, 2].map((i) => <rect key={i} x={-20} y={40 + i * 46} width={120 + ((r >> i) % 4) * 30} height={32} rx={16} className={i === 1 ? "line-fill" : "b"} />)}</>,
];

export function GameCover({ game, size = "md", className = "" }) {
  const { t } = useI18n();
  const [broken, setBroken] = useState(false);
  const art = broken ? "" : coverUrl(game.catalogId || game.id);
  if (art) {
    return (
      <div className={`cover cover-official cover-${size} ${className}`} aria-hidden="true">
        <img className="cover-layer cover-bg" src={art} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
        <svg className="cover-layer cover-fg cover-orbit" viewBox="0 0 200 300" preserveAspectRatio="none">
          <ellipse cx="100" cy="300" rx="160" ry="70" />
          <ellipse cx="100" cy="300" rx="120" ry="48" />
        </svg>
      </div>
    );
  }
  const { a, b, comp: n, seed } = coverPlan(game.title, COMPOSITIONS.length);
  const comp = COMPOSITIONS[n](seed);
  const words = game.title.length > 18 ? "is-long" : game.title.length < 8 ? "is-short" : "";
  return (
    <div className={`cover cover-drawn cover-${size} ${className}`} style={{ "--ca": `var(--c${a + 1})`, "--cb": `var(--c${b + 1})` }} aria-hidden="true">
      <svg className="cover-layer cover-bg" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">{comp}</svg>
      <div className="cover-layer cover-fg">
        <span className="cover-meta">
          <span>{game.genre ? t("genre." + game.genre) : t("genre.other")}</span>
          <span className="num">{t("platformShort." + (game.platform || "pc"))}</span>
        </span>
        <span className={`cover-title ${words}`}>{game.title}</span>
        <Mark size={size === "lg" ? 16 : 12} className="cover-mark" />
      </div>
    </div>
  );
}
