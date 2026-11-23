// Demo content: the checker's account (login "qwerty", password "123") and a
// few demo players so the leaderboard and the community clips aren't empty.
// Everything is generated from a fixed seed relative to "today", so the stats
// always look alive; seeded items carry demo: true (see db.js, which slides
// them forward when the site is opened on a later day).
// Clip links are official trailers on YouTube (checked with YouTube oEmbed).
import { addDays } from "../lib/dates.js";

export const DEMO_LOGIN = { username: "qwerty", password: "123" };

// Small seeded random generator (mulberry32): same seed → same demo data.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];
function weighted(r, items) {
  const total = items.reduce((a, i) => a + i.w, 0);
  let x = r() * total;
  for (const i of items) if ((x -= i.w) < 0) return i;
  return items[items.length - 1];
}
const pad = (n) => String(n).padStart(2, "0");

/* Each profile: games (catalog id, title, genre, platform, status, rating, weight),
   how often they play, how long, and when. */
const PROFILES = [
  {
    username: "qwerty", name: "Qwerty", color: "#2f6fdf", demo: true, seed: 9, playChance: 0.78, minRange: [25, 150], hours: [17, 23],
    goal: { minutes: 12 * 60, mode: "limit" },
    games: [
      { catalogId: "cs2", title: "Counter-Strike 2", genre: "shooter", platform: "pc", status: "playing", rating: 4, w: 6, fav: true },
      { catalogId: "eldenring", title: "Elden Ring", genre: "rpg", platform: "ps", status: "playing", rating: 5, w: 4 },
      { catalogId: "valorant", title: "Valorant", genre: "shooter", platform: "pc", status: "playing", rating: 3, w: 2 },
      { catalogId: "minecraft", title: "Minecraft", genre: "sandbox", platform: "pc", status: "playing", rating: 4, w: 2 },
      { catalogId: "bg3", title: "Baldur's Gate 3", genre: "rpg", platform: "pc", status: "done", rating: 5, w: 1, until: 30 },
      { catalogId: "dota2", title: "Dota 2", genre: "moba", platform: "pc", status: "dropped", rating: 2, w: 1, until: 40 },
      { catalogId: "witcher3", title: "The Witcher 3: Wild Hunt", genre: "rpg", platform: "pc", status: "done", rating: 5, w: 0 },
      { catalogId: "hollowknight", title: "Hollow Knight", genre: "platformer", platform: "switch", status: "backlog", rating: 0, w: 0 },
      { catalogId: "rdr2", title: "Red Dead Redemption 2", genre: "action", platform: "ps", status: "backlog", rating: 0, w: 0 },
    ],
    clips: [
      { yt: "c80dVYcL69E", game: "cs2", title: "Counter-Strike 2 launch trailer", tags: ["trailer", "cs2"], ago: 2, likes: 14 },
      { yt: "E3Huy2cdih0", game: "eldenring", title: "Elden Ring gameplay reveal", tags: ["trailer", "souls"], ago: 6, likes: 23 },
      { yt: "K_03kFqWfqs", game: "eldenring", title: "Elden Ring story trailer", tags: ["story"], ago: 11, likes: 9 },
      { yt: "MmB9b5njVbA", game: "minecraft", title: "Minecraft official trailer", tags: ["trailer"], ago: 18, likes: 5 },
      { yt: "1T22wNvoNiU", game: "bg3", title: "Baldur's Gate 3 launch trailer", tags: ["rpg", "trailer"], ago: 33, likes: 31 },
    ],
  },
  { username: "aziz_gg", name: "Aziz", color: "#d64545", seed: 21, playChance: 0.85, minRange: [40, 200], hours: [18, 24],
    games: [
      { catalogId: "cs2", title: "Counter-Strike 2", genre: "shooter", platform: "pc", status: "playing", rating: 5, w: 8 },
      { catalogId: "dota2", title: "Dota 2", genre: "moba", platform: "pc", status: "playing", rating: 4, w: 3 },
    ],
    clips: [{ yt: "-cSFPIwMEq4", game: "dota2", title: "Dota 2 Gamescom trailer", tags: ["dota"], ago: 3, likes: 12 }] },
  { username: "kamila", name: "Kamila", color: "#1f9d74", seed: 34, playChance: 0.55, minRange: [30, 120], hours: [19, 23],
    games: [
      { catalogId: "minecraft", title: "Minecraft", genre: "sandbox", platform: "pc", status: "playing", rating: 5, w: 5 },
      { catalogId: "stardew", title: "Stardew Valley", genre: "sim", platform: "switch", status: "playing", rating: 5, w: 4 },
      { catalogId: "hollowknight", title: "Hollow Knight", genre: "platformer", platform: "switch", status: "done", rating: 4, w: 1 },
    ],
    clips: [{ yt: "UAO2urG23S4", game: "hollowknight", title: "Hollow Knight release trailer", tags: ["indie"], ago: 9, likes: 18 }] },
  { username: "timur_x", name: "Timur", color: "#c27c0e", seed: 47, playChance: 0.7, minRange: [30, 160], hours: [15, 22],
    games: [
      { catalogId: "eafc", title: "EA Sports FC 25", genre: "sports", platform: "ps", status: "playing", rating: 4, w: 6 },
      { catalogId: "gtav", title: "Grand Theft Auto V", genre: "action", platform: "ps", status: "playing", rating: 4, w: 3 },
    ],
    clips: [{ yt: "QkkoHAzjnUs", game: "gtav", title: "GTA V trailer", tags: ["classic"], ago: 14, likes: 20 }] },
  { username: "sasha_k", name: "Sasha", color: "#8a4fd6", seed: 58, playChance: 0.6, minRange: [45, 180], hours: [20, 24],
    games: [
      { catalogId: "eldenring", title: "Elden Ring", genre: "rpg", platform: "pc", status: "playing", rating: 5, w: 5 },
      { catalogId: "witcher3", title: "The Witcher 3: Wild Hunt", genre: "rpg", platform: "pc", status: "done", rating: 5, w: 2 },
      { catalogId: "valorant", title: "Valorant", genre: "shooter", platform: "pc", status: "playing", rating: 3, w: 2 },
    ],
    clips: [{ yt: "c0i88t0Kacs", game: "witcher3", title: "The Witcher 3: Killing Monsters", tags: ["cinematic"], ago: 21, likes: 27 }] },
  { username: "dilnoza", name: "Dilnoza", color: "#d0517f", seed: 63, playChance: 0.45, minRange: [20, 90], hours: [12, 22],
    games: [
      { catalogId: "mlbb", title: "Mobile Legends: Bang Bang", genre: "moba", platform: "mobile", status: "playing", rating: 4, w: 5 },
      { catalogId: "genshin", title: "Genshin Impact", genre: "rpg", platform: "mobile", status: "playing", rating: 4, w: 3 },
    ],
    clips: [] },
  { username: "bekzod_pro", name: "Bekzod", color: "#21808f", seed: 77, playChance: 0.9, minRange: [60, 240], hours: [16, 24],
    games: [
      { catalogId: "pubgm", title: "PUBG Mobile", genre: "battle", platform: "mobile", status: "playing", rating: 5, w: 6 },
      { catalogId: "valorant", title: "Valorant", genre: "shooter", platform: "pc", status: "playing", rating: 4, w: 3 },
      { catalogId: "rdr2", title: "Red Dead Redemption 2", genre: "action", platform: "ps", status: "done", rating: 5, w: 1 },
    ],
    clips: [{ yt: "eaW0tYpxyp0", game: "rdr2", title: "Red Dead Redemption 2 trailer #3", tags: ["western"], ago: 26, likes: 15 }] },
  { username: "nightowl", name: "Nightowl", color: "#5f6b7a", seed: 88, playChance: 0.5, minRange: [60, 210], hours: [22, 27],
    games: [
      { catalogId: "bg3", title: "Baldur's Gate 3", genre: "rpg", platform: "pc", status: "playing", rating: 5, w: 4 },
      { catalogId: "civ6", title: "Sid Meier's Civilization VI", genre: "strategy", platform: "pc", status: "playing", rating: 4, w: 3 },
    ],
    clips: [{ yt: "e_E9W2vsRbQ", game: "valorant", title: "VALORANT launch cinematic", tags: ["cinematic"], ago: 7, likes: 11 }] },
];

const NOTES = ["Ranked with friends", "Finished a boss", "Short warm-up", "Tried a new build", "Played with my brother", "Late night run", "Daily quests", ""];

// Build one player's data for the 56 days up to today.
function buildPlayer(p, today) {
  const r = rng(p.seed);
  const games = p.games.map((g, i) => ({
    id: `${p.username}-g${i}`, catalogId: g.catalogId, title: g.title, genre: g.genre, platform: g.platform,
    status: g.status, rating: g.rating, fav: !!g.fav, notes: "", added: addDays(today, -70 + i * 3), demo: true,
  }));
  const sessions = [];
  const playable = p.games.map((g, i) => ({ ...g, id: games[i].id })).filter((g) => g.w > 0);
  for (let ago = 55; ago >= 0; ago--) {
    const date = addDays(today, -ago);
    const weekend = [0, 6].includes(new Date(date + "T12:00").getDay());
    if (r() > p.playChance + (weekend ? 0.1 : 0)) continue;
    const count = r() < 0.25 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const options = playable.filter((g) => !g.until || ago >= g.until - 25 && ago <= g.until + 20);
      const g = weighted(r, options.length ? options : playable);
      const [lo, hi] = p.minRange;
      let minutes = Math.round((lo + r() * (hi - lo)) * (weekend ? 1.3 : 1) / 5) * 5;
      let hour = Math.floor(p.hours[0] + r() * (p.hours[1] - p.hours[0])) % 24;
      if (k === 1) hour = Math.max(10, hour - 6);
      sessions.push({
        id: `${p.username}-s${ago}-${k}`, game: g.id, date, start: `${pad(hour)}:${pad(Math.floor(r() * 4) * 15)}`,
        minutes, note: r() < 0.3 ? pick(r, NOTES) : "", demo: true,
      });
    }
  }
  const clips = (p.clips || []).map((c, i) => ({
    id: `${p.username}-c${i}`, url: c.url || `https://www.youtube.com/watch?v=${c.yt}`, title: c.title,
    game: games.find((g) => g.catalogId === c.game)?.id || "", gameTitle: p.games.find((g) => g.catalogId === c.game)?.title || "",
    tags: c.tags, date: addDays(today, -c.ago), likes: c.likes, likedBy: [], demo: true,
  }));
  return { v: 1, games, sessions, clips, goal: p.goal || { minutes: 10 * 60, mode: "reach" }, timer: null, anchor: today };
}

export const DEMO_PROFILES = PROFILES.map(({ username, name, color, demo }) => ({ username, name, color, demo: !!demo }));
export function buildDemoData(today) {
  const out = {};
  for (const p of PROFILES) out[p.username] = buildPlayer(p, today);
  return out;
}
