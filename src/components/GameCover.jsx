// Game covers. Catalog games show their official cover art (public/covers,
// downloaded by tools/covers.mjs). Games added by hand, or art that fails to
// load, get a drawn cover: a 3:4 card in the game's colour with an abstract
// composition picked from the title's hash, the title set large, the genre,
// the platform and a small VAULT mark. Same title → same cover.
import { useState } from "react";
import { hashString, gameColor } from "../lib/gameColor.js";
import { COVER_SOURCES } from "../data/covers.js";
import { useI18n } from "../i18n/useI18n.js";
import { Mark } from "./Logo.jsx";

// Five compositions in a 30 × 40 box; all thin, flat shapes in the cover's ink.
const SHAPES = [
  (r) => <><circle cx={22} cy={10} r={6 + (r % 4)} /><path d={`M0 ${20 + (r % 5)}H30`} /></>,
  (r) => <><path d={`M4 4L${18 + (r % 8)} 4L${18 + (r % 8)} 18`} /><path d="M10 10L26 10L26 24" /></>,
  (r) => <>{[0, 1, 2, 3].map((i) => <path key={i} d={`M${6 + i * 5} ${22 - ((r >> i) % 4) * 3}V4`} />)}</>,
  (r) => <><path d={`M0 ${8 + (r % 6)}Q15 ${(r % 9)} 30 ${16 + (r % 5)}`} /><path d={`M0 ${16 + (r % 6)}Q15 ${8 + (r % 9)} 30 ${24 + (r % 5)}`} /></>,
  (r) => <><rect x={6 + (r % 6)} y={4} width={12} height={12} transform={`rotate(${(r % 4) * 10} 15 10)`} /><circle cx={8} cy={20} r={2.5} /></>,
];

const coverUrl = (id) => (id && COVER_SOURCES[id] ? `${import.meta.env.BASE_URL}covers/${id}.jpg` : "");

export function GameCover({ game, size = "md", className = "" }) {
  const { t } = useI18n();
  const [broken, setBroken] = useState(false);
  const art = broken ? "" : coverUrl(game.catalogId || game.id);
  if (art) {
    return (
      <div className={`cover cover-art-img cover-${size} ${className}`} style={{ "--cover": gameColor(game.title) }} aria-hidden="true">
        <img src={art} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
      </div>
    );
  }
  const h = hashString(game.title);
  const shape = SHAPES[h % SHAPES.length]((h >> 4) & 255);
  const long = game.title.length > 22;
  return (
    <div className={`cover cover-${size} ${className}`} style={{ "--cover": gameColor(game.title) }} aria-hidden="true">
      <svg className="cover-art" viewBox="0 0 30 40" preserveAspectRatio="xMidYMin slice">{shape}</svg>
      <div className="cover-top">
        <span className="cover-genre">{game.genre ? t("genre." + game.genre) : t("genre.other")}</span>
        <span className="cover-platform">{t("platformShort." + (game.platform || "pc"))}</span>
      </div>
      <span className={`cover-title ${long ? "is-long" : ""}`}>{game.title}</span>
      <Mark size={size === "lg" ? 16 : 12} className="cover-mark" />
    </div>
  );
}
