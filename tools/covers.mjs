// Downloads official cover art for the built-in catalog into public/covers
// (400 x 600 JPEG, cropped to 2:3) and writes src/data/covers.js.
//   node tools/covers.mjs
// Sources: Steam library art (most games), Microsoft Store posters (games not
// on Steam), Wikipedia box art and Google Play icons for the rest.
// Art © its publishers; used here for a non-commercial course project.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const OUT = path.join(ROOT, "public", "covers");
const TMP = path.join(ROOT, "tools", ".tmp");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const steam = (id) => ({ url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`, source: "Steam" });
const STEAM = {
  cs2: 730, apex: 1172470, pubg: 578080, warzone: 1962663, dota2: 570, eldenring: 1245620, witcher3: 292030, bg3: 1086940,
  cyberpunk: 1091500, gtav: 271590, rdr2: 1174180, gow: 2322010, spiderman2: 2651280, eafc: 2669320, nba2k: 2878980,
  rocketleague: 252950, forza5: 1551360, civ6: 289070, aoe2: 813780, terraria: 105600, tekken8: 1778820, sf6: 1364780,
  hollowknight: 367520, celeste: 504230, stardew: 413150, eurotruck: 227300, overwatch2: 2357570,
};
// Microsoft Store product ids; the "Poster" image is 2:3 like Steam's.
const MS = { fortnite: "BT5P2X999VH2", valorant: "9N1NLJK9SKRN", roblox: "BQ1TN1T79V9K", lol: "9PB301R051CQ", genshin: "9N7TFFRRZCC9", minecraft: "9MVXMVT8ZKWC" };
const OTHER = {
  mk8: { url: "https://upload.wikimedia.org/wikipedia/en/b/b5/MarioKart8Boxart.jpg", source: "Wikipedia (box art)" },
  mlbb: { url: "https://play-lh.googleusercontent.com/r3VU-78TGaJWewvEll8oNl0SF-ESsOiS--jQkdcSOSblzu9fY0j3xWA49pIjsGXOfheldafcPQHV_eegp_Z-MQ=s0", source: "Google Play" },
  clash: { url: "https://play-lh.googleusercontent.com/z0rspJKftanEI7MA4WOdypbaaHfeKy4UjoawRGKf4Ys3v6LrrcleZWOfms7XK-J33Oqyfm3DlFd4Z_eKWafVFg=s0", source: "Google Play" },
  pubgm: { url: "https://play-lh.googleusercontent.com/Se7jR6A5R0Mk9ClaIguf46yi2K3k32JsqKb3gAtrktIh3JwnFfxrQRmG9GLvdMpbxbMrReUOxzDkStxGxNo-5Q=s0", source: "Google Play" },
};
const UA = { headers: { "User-Agent": "course-project-checker/1.0 (student project)" } };

async function msPoster(id) {
  const r = await (await fetch(`https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${id}&market=US&languages=en-US`)).json();
  const img = (r.Products?.[0]?.LocalizedProperties?.[0]?.Images || []).find((i) => i.ImagePurpose === "Poster");
  return img ? { url: "https:" + img.Uri + "?w=600", source: "Microsoft Store" } : null;
}

const jobs = { ...Object.fromEntries(Object.entries(STEAM).map(([k, v]) => [k, steam(v)])), ...OTHER };
for (const [k, id] of Object.entries(MS)) jobs[k] = await msPoster(id);

const done = {};
for (const [id, job] of Object.entries(jobs)) {
  if (!job) { console.log("no source:", id); continue; }
  const res = await fetch(job.url, UA);
  if (!res.ok) { console.log("failed:", id, res.status); continue; }
  const raw = path.join(TMP, id + ".img");
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(ROOT, "tools", "cover.ps1"), raw, path.join(OUT, id + ".jpg")]);
  done[id] = job.source;
  console.log("ok", id, job.source);
}
fs.rmSync(TMP, { recursive: true, force: true });

const out = `// Written by tools/covers.mjs: catalog games that have official cover art in public/covers.
// Art © its publishers (source per game below); used for a non-commercial course project.
export const COVER_SOURCES = ${JSON.stringify(done, null, 2)};
`;
fs.writeFileSync(path.join(ROOT, "src", "data", "covers.js"), out);
console.log(Object.keys(done).length, "covers");
