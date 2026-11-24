// The app's data layer: accounts, the logged-in user, and each user's games,
// sessions, clips and goal, all in localStorage under "gamerhub:*".
//   gamerhub:users          { [username]: { username, name, color, salt, hash, created, demo, npc } }
//   gamerhub:session        the logged-in username ("" = nobody)
//   gamerhub:data:<user>    { v, games, sessions, clips, goal, timer, anchor }
// Components don't touch storage directly: they call the functions below and
// re-render through useDb() (hooks/useDb.js), which listens to emit().
import { storage } from "./storage.js";
import { makeUser, passwordMatches, checkSignUp, COLORS, sha256, randomSalt } from "./accounts.js";
import { buildDemoData, DEMO_PROFILES, DEMO_LOGIN } from "../data/demo.js";
import { addDays, fromKey, isValidKey, todayKey } from "./dates.js";
import { catalogById } from "../data/catalog.js";

/* ---------- change notification ---------- */
let version = 0;
const listeners = new Set();
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const getVersion = () => version;
function emit() { version++; listeners.forEach((fn) => fn()); }
// Another tab changed something: re-read.
if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (!e.key || e.key.startsWith("gamerhub:")) emit(); });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- reading (always defensive: storage can hold anything) ---------- */
export function users() {
  const u = storage.getJSON("users", {});
  return u && typeof u === "object" && !Array.isArray(u) ? u : {};
}
const saveUsers = (u) => storage.setJSON("users", u);

const isStr = (x) => typeof x === "string";
function clean(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  const games = (Array.isArray(d.games) ? d.games : []).filter((g) => g && isStr(g.id) && isStr(g.title) && g.title.trim());
  const ids = new Set(games.map((g) => g.id));
  return {
    v: 1,
    games: games.map((g) => ({ status: "playing", rating: 0, platform: "pc", genre: "", notes: "", fav: false, catalogId: null, ...g, rating: Math.max(0, Math.min(5, Number(g.rating) || 0)) })),
    sessions: (Array.isArray(d.sessions) ? d.sessions : []).filter((s) => s && isStr(s.id) && ids.has(s.game) && isValidKey(s.date) && Number.isFinite(s.minutes) && s.minutes > 0)
      .map((s) => ({ start: "", note: "", ...s })),
    clips: (Array.isArray(d.clips) ? d.clips : []).filter((c) => c && isStr(c.id) && isStr(c.url))
      .map((c) => ({ title: "", game: "", tags: [], likes: 0, likedBy: [], date: todayKey(), ...c, game: ids.has(c.game) ? c.game : "" })),
    goal: d.goal && Number.isFinite(d.goal.minutes) && d.goal.minutes > 0 ? { minutes: d.goal.minutes, mode: d.goal.mode === "limit" ? "limit" : "reach" } : { minutes: 10 * 60, mode: "reach" },
    timer: d.timer && ids.has(d.timer.game) && !Number.isNaN(Date.parse(d.timer.startedAt)) ? d.timer : null,
    anchor: isValidKey(d.anchor) ? d.anchor : todayKey(),
  };
}
export const dataOf = (username) => clean(storage.getJSON("data:" + username, null));
const saveData = (username, data) => storage.setJSON("data:" + username, data);

export function me() {
  const name = storage.get("session", "");
  const u = name && users()[name];
  return u && !u.npc ? u : null;
}
export const myData = () => (me() ? dataOf(me().username) : clean(null));

// Change the logged-in user's data with a function: update((d) => { d.games.push(...) })
function update(fn) {
  const u = me();
  if (!u) return;
  const d = dataOf(u.username);
  fn(d);
  saveData(u.username, d);
  emit();
}

/* ---------- demo seed ----------
   First visit: create the demo players. Later visits: move the demo items
   forward by the days that passed, so "this week" is never empty. */
export async function seed() {
  const today = todayKey();
  const all = users();
  if (!all[DEMO_LOGIN.username]) {
    const data = buildDemoData(today);
    for (const p of DEMO_PROFILES) {
      all[p.username] = await makeUser({
        ...p, password: p.demo ? DEMO_LOGIN.password : "", npc: !p.demo,
        created: new Date(Date.now() - 70 * 864e5).toISOString(),
      });
      saveData(p.username, data[p.username]);
    }
    saveUsers(all);
  } else {
    for (const p of DEMO_PROFILES) {
      if (!all[p.username]) continue;
      const d = dataOf(p.username);
      const shift = Math.round((fromKey(today) - fromKey(d.anchor)) / 864e5);
      if (shift <= 0) continue;
      for (const s of d.sessions) if (s.demo) s.date = addDays(s.date, shift);
      for (const c of d.clips) if (c.demo) c.date = addDays(c.date, shift);
      d.anchor = today;
      saveData(p.username, d);
    }
  }
  emit();
}

/* ---------- accounts ---------- */
export async function signUp(form) {
  const errors = checkSignUp(form, users());
  if (Object.keys(errors).length) return errors;
  const all = users();
  const username = form.username.trim().toLowerCase();
  all[username] = await makeUser({ username, name: form.name.trim().slice(0, 30), password: form.password, color: COLORS[Object.keys(all).length % COLORS.length] });
  saveUsers(all);
  saveData(username, clean(null));
  storage.set("session", username);
  emit();
  return {};
}

export async function logIn(username, password) {
  const u = users()[String(username || "").trim().toLowerCase()];
  if (!(await passwordMatches(u, password))) return "err.wrongLogin";
  storage.set("session", u.username);
  emit();
  return "";
}

export function logOut() {
  storage.set("session", "");
  emit();
}

export function updateProfile({ name, color }) {
  const u = me();
  if (!u) return;
  const all = users();
  if (isStr(name) && name.trim().length >= 2) all[u.username].name = name.trim().slice(0, 30);
  if (COLORS.includes(color)) all[u.username].color = color;
  saveUsers(all);
  emit();
}

export async function changePassword(oldPassword, newPassword) {
  const u = me();
  if (!u) return "err.wrongLogin";
  if (!(await passwordMatches(u, oldPassword))) return "err.oldPassword";
  if (String(newPassword).length < 6) return "err.password";
  const all = users();
  const salt = randomSalt();
  all[u.username] = { ...all[u.username], salt, hash: await sha256(salt + newPassword) };
  saveUsers(all);
  emit();
  return "";
}

export function deleteAccount() {
  const u = me();
  if (!u) return;
  const all = users();
  delete all[u.username];
  saveUsers(all);
  // take back this account's likes on other players' clips
  for (const name of Object.keys(all)) {
    const d = dataOf(name);
    if (d.clips.some((c) => c.likedBy.includes(u.username))) {
      d.clips.forEach((c) => { c.likedBy = c.likedBy.filter((x) => x !== u.username); });
      saveData(name, d);
    }
  }
  storage.set("data:" + u.username, "");
  try { localStorage.removeItem("gamerhub:data:" + u.username); } catch { /* ignore */ }
  storage.set("session", "");
  emit();
}

/* ---------- games ---------- */
export function addGame({ catalogId = null, title, genre = "", platform = "pc", status = "playing" }) {
  const c = catalogId ? catalogById(catalogId) : null;
  const game = {
    id: newId(), catalogId: c ? c.id : null, title: String(c ? c.title : title || "").trim().slice(0, 60),
    genre: c ? c.genre : genre, platform: c && !c.platforms.includes(platform) ? c.platforms[0] : platform,
    status, rating: 0, fav: false, notes: "", added: todayKey(),
  };
  if (!game.title) return null;
  update((d) => d.games.push(game));
  return game;
}
export function updateGame(id, patch) {
  update((d) => {
    const g = d.games.find((x) => x.id === id);
    if (g) Object.assign(g, patch, { id: g.id });
  });
}
// Removing a game also removes its sessions and unlinks its clips; returns
// everything needed to put it back (the Undo in the toast).
export function removeGame(id) {
  let snapshot = null;
  update((d) => {
    const i = d.games.findIndex((g) => g.id === id);
    if (i < 0) return;
    snapshot = { game: d.games[i], index: i, sessions: d.sessions.filter((s) => s.game === id), clips: d.clips.filter((c) => c.game === id).map((c) => c.id), timer: d.timer?.game === id ? d.timer : null };
    d.games.splice(i, 1);
    d.sessions = d.sessions.filter((s) => s.game !== id);
    d.clips.forEach((c) => { if (c.game === id) c.game = ""; });
    if (d.timer?.game === id) d.timer = null;
  });
  return snapshot;
}
export function restoreGame(snap) {
  if (!snap) return;
  update((d) => {
    d.games.splice(Math.min(snap.index, d.games.length), 0, snap.game);
    d.sessions.push(...snap.sessions);
    d.clips.forEach((c) => { if (snap.clips.includes(c.id)) c.game = snap.game.id; });
    if (snap.timer && !d.timer) d.timer = snap.timer;
  });
}

/* ---------- sessions ---------- */
// Sessions added in the last few seconds: the timeline gives them a short reveal.
const fresh = new Map();
export const isFresh = (id) => Date.now() - (fresh.get(id) || 0) < 4000;

export function addSession(s) {
  const session = { id: newId(), game: s.game, date: s.date, start: s.start || "", minutes: Math.round(s.minutes), note: String(s.note || "").trim().slice(0, 140) };
  fresh.set(session.id, Date.now());
  update((d) => {
    d.sessions.push(session);
    // playing a game you'd put aside moves it back to "playing"
    const g = d.games.find((x) => x.id === s.game);
    if (g && g.status === "backlog") g.status = "playing";
  });
  return session;
}
export function updateSession(id, patch) {
  update((d) => {
    const s = d.sessions.find((x) => x.id === id);
    if (s) Object.assign(s, patch, { id: s.id, minutes: Math.round(patch.minutes ?? s.minutes) });
  });
}
export function removeSession(id) {
  let snap = null;
  update((d) => {
    const i = d.sessions.findIndex((s) => s.id === id);
    if (i >= 0) snap = d.sessions.splice(i, 1)[0];
  });
  return snap;
}
export function restoreSession(s) {
  if (s) update((d) => d.sessions.push(s));
}

/* ---------- live timer ----------
   The start time is saved, so the timer survives reloads and closed tabs. */
export function startTimer(game) {
  update((d) => { d.timer = { game, startedAt: new Date().toISOString() }; });
}
export function cancelTimer() {
  update((d) => { d.timer = null; });
}
// Stops the timer and logs the session. Sessions under a minute are dropped.
// A session that started before midnight is logged on the day it started.
export function stopTimer() {
  const d = myData();
  if (!d.timer) return null;
  const started = new Date(d.timer.startedAt);
  const minutes = Math.min(16 * 60, Math.round((Date.now() - started) / 60000));
  const game = d.timer.game;
  cancelTimer();
  if (minutes < 1) return { tooShort: true };
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}`;
  return addSession({ game, date, start: `${pad(started.getHours())}:${pad(started.getMinutes())}`, minutes, note: "" });
}

/* ---------- clips ---------- */
export function addClip({ url, title, game = "", tags = [] }) {
  const clip = { id: newId(), url: url.trim(), title: String(title || "").trim().slice(0, 80), game, tags: tags.slice(0, 5), date: todayKey(), likes: 0, likedBy: [] };
  update((d) => d.clips.unshift(clip));
  return clip;
}
export function updateClip(id, patch) {
  update((d) => {
    const c = d.clips.find((x) => x.id === id);
    if (c) Object.assign(c, patch, { id: c.id });
  });
}
export function removeClip(id) {
  let snap = null;
  update((d) => {
    const i = d.clips.findIndex((c) => c.id === id);
    if (i >= 0) snap = { clip: d.clips.splice(i, 1)[0], index: i };
  });
  return snap;
}
export function restoreClip(snap) {
  if (snap) update((d) => d.clips.splice(Math.min(snap.index, d.clips.length), 0, snap.clip));
}
// Likes live on the clip's owner, so they work for other players' clips too.
export function toggleLike(owner, clipId) {
  const u = me();
  if (!u) return;
  const d = dataOf(owner);
  const c = d.clips.find((x) => x.id === clipId);
  if (!c) return;
  const i = c.likedBy.indexOf(u.username);
  if (i >= 0) c.likedBy.splice(i, 1);
  else c.likedBy.push(u.username);
  saveData(owner, d);
  emit();
}
export const likeCount = (c) => (c.likes || 0) + (c.likedBy?.length || 0);

/* ---------- goal ---------- */
export function setGoal(goal) {
  update((d) => { d.goal = { minutes: Math.max(30, Math.min(100 * 60, Math.round(goal.minutes))), mode: goal.mode === "limit" ? "limit" : "reach" }; });
}

/* ---------- everyone (leaderboard, community clips) ---------- */
export function allPlayers() {
  return Object.values(users()).map((u) => ({ username: u.username, name: u.name, color: u.color, npc: !!u.npc, demo: !!u.demo, ...dataOf(u.username) }));
}

/* ---------- backup ---------- */
export function exportData() {
  const u = me();
  return JSON.stringify({ app: "gamerhub", exported: new Date().toISOString(), user: u?.username, data: myData() }, null, 2);
}
// Replaces the logged-in user's data with a backup. Returns an error key or "".
export function importData(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return "err.importJson"; }
  if (!parsed || parsed.app !== "gamerhub" || !parsed.data) return "err.importApp";
  const d = clean(parsed.data);
  update((cur) => Object.assign(cur, d));
  return "";
}
