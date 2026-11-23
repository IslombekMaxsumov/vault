// All the maths behind the dashboard, stats page, goal and leaderboard.
// Pure functions on plain data (no React, no storage), so they can be tested
// with `node --test` (tests/stats.test.mjs).
//
// A session is { id, game, date: "YYYY-MM-DD", start: "HH:MM" | "", minutes, note }.
// Weeks start on Monday.
import { addDays, fromKey, toKey, isValidKey } from "./dates.js";

export const MAX_SESSION = 16 * 60; // one sitting can't be longer than 16 hours
export const DAY = 24 * 60;

const sum = (list) => list.reduce((a, s) => a + s.minutes, 0);

export function weekStart(key) {
  const d = fromKey(key);
  const shift = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(key, -shift);
}

// [from, to] (inclusive) for "week" (this Mon–Sun), "7d", "30d", "90d", "month" (this calendar month), "all"
export function periodRange(period, today, sessions = []) {
  switch (period) {
    case "week": return [weekStart(today), addDays(weekStart(today), 6)];
    case "7d": return [addDays(today, -6), today];
    case "30d": return [addDays(today, -29), today];
    case "90d": return [addDays(today, -89), today];
    case "month": return [today.slice(0, 8) + "01", today];
    default: {
      const first = sessions.reduce((m, s) => (s.date < m ? s.date : m), today);
      return [first, today];
    }
  }
}

export const inRange = (sessions, [from, to]) => sessions.filter((s) => s.date >= from && s.date <= to);

// One entry per day, zero days included: [{ date, minutes }]
export function dailySeries(sessions, [from, to]) {
  const byDay = new Map();
  for (const s of sessions) if (s.date >= from && s.date <= to) byDay.set(s.date, (byDay.get(s.date) || 0) + s.minutes);
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ date: d, minutes: byDay.get(d) || 0 });
  return out;
}

// Weekly totals (Monday keys), for long periods where daily bars get too thin.
export function weeklySeries(sessions, [from, to]) {
  const out = [];
  for (let w = weekStart(from); w <= to; w = addDays(w, 7)) {
    const end = addDays(w, 6);
    out.push({ date: w, minutes: sum(sessions.filter((s) => s.date >= w && s.date <= end && s.date >= from && s.date <= to)) });
  }
  return out;
}

// [{ game, minutes, count, share }] most played first
export function byGame(sessions) {
  const map = new Map();
  for (const s of sessions) {
    const g = map.get(s.game) || { game: s.game, minutes: 0, count: 0, last: "" };
    g.minutes += s.minutes; g.count++; if (s.date > g.last) g.last = s.date;
    map.set(s.game, g);
  }
  const total = sum(sessions) || 1;
  return [...map.values()].map((g) => ({ ...g, share: g.minutes / total })).sort((a, b) => b.minutes - a.minutes);
}

// Average minutes on each weekday (Mon..Sun) over the days in range.
export function byWeekday(sessions, [from, to]) {
  const total = [0, 0, 0, 0, 0, 0, 0], days = [0, 0, 0, 0, 0, 0, 0];
  for (const { date, minutes } of dailySeries(sessions, [from, to])) {
    const i = (fromKey(date).getDay() + 6) % 7;
    total[i] += minutes; days[i]++;
  }
  return total.map((m, i) => (days[i] ? m / days[i] : 0));
}

// When people play, from the start time: night 0–6, morning 6–12, afternoon 12–18, evening 18–24.
export function byTimeOfDay(sessions) {
  const out = { morning: 0, afternoon: 0, evening: 0, night: 0, unknown: 0 };
  for (const s of sessions) {
    const h = /^\d{2}:\d{2}$/.test(s.start || "") ? Number(s.start.slice(0, 2)) : -1;
    const k = h < 0 ? "unknown" : h < 6 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    out[k] += s.minutes;
  }
  return out;
}

// Days in a row with at least one session. The current streak still counts
// if the last session was yesterday (today isn't over yet).
export function streaks(sessions, today) {
  const days = [...new Set(sessions.map((s) => s.date))].sort();
  let longest = 0, run = 0, prev = "";
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  let current = 0;
  const set = new Set(days);
  let d = set.has(today) ? today : addDays(today, -1);
  while (set.has(d)) { current++; d = addDays(d, -1); }
  return { current, longest };
}

export function summary(sessions) {
  const total = sum(sessions);
  const days = new Set(sessions.map((s) => s.date)).size;
  const longest = sessions.reduce((m, s) => (s.minutes > m.minutes ? s : m), { minutes: 0 });
  return { total, count: sessions.length, days, avgSession: sessions.length ? total / sessions.length : 0, avgDay: days ? total / days : 0, longest: longest.minutes ? longest : null };
}

// Change against the period just before (same length). null when there's nothing to compare.
export function trend(sessions, [from, to]) {
  const len = Math.round((fromKey(to) - fromKey(from)) / 864e5) + 1;
  const before = [addDays(from, -len), addDays(from, -1)];
  const now = sum(inRange(sessions, [from, to])), then = sum(inRange(sessions, before));
  return then ? (now - then) / then : null;
}

// This week so far against the same days of last week (Mon–Tue against last Mon–Tue).
export function weekSoFarTrend(sessions, today) {
  const from = weekStart(today);
  const now = sum(inRange(sessions, [from, today]));
  const then = sum(inRange(sessions, [addDays(from, -7), addDays(today, -7)]));
  return then ? (now - then) / then : null;
}

/* ---------- weekly goal ----------
   goal = { minutes, mode: "reach" (play at least) | "limit" (stay under) } */
export function goalProgress(sessions, goal, today) {
  const [from, to] = periodRange("week", today);
  const played = sum(inRange(sessions, [from, to]));
  const target = Math.max(1, goal?.minutes || 0);
  const daysLeft = Math.round((fromKey(to) - fromKey(today)) / 864e5) + 1; // today included
  const left = Math.max(0, target - played);
  let state;
  if (goal?.mode === "limit") state = played > target ? "over" : played > target * 0.8 ? "close" : "ok";
  else state = played >= target ? "done" : "going";
  return { played, target, ratio: played / target, left, perDay: left / daysLeft, daysLeft, state, mode: goal?.mode === "limit" ? "limit" : "reach" };
}

/* ---------- checks for the log form ----------
   Returns { field: errorKey } (empty object = fine). */
export function checkSession({ game, date, minutes, start }, others, today) {
  const e = {};
  if (!game) e.game = "err.game";
  if (!isValidKey(date)) e.date = "err.date";
  else if (date > today) e.date = "err.future";
  else if (date < addDays(today, -365 * 2)) e.date = "err.tooOld";
  if (!Number.isFinite(minutes) || minutes < 1) e.minutes = "err.minutes";
  else if (minutes > MAX_SESSION) e.minutes = "err.tooLong";
  if (start && !/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) e.start = "err.start";
  if (!e.date && !e.minutes) {
    const dayTotal = sum(others.filter((s) => s.date === date)) + minutes;
    if (dayTotal > DAY) e.minutes = "err.dayFull";
  }
  return e;
}

// "1:30", "90", "1h 30m", "1.5h", "2 h" → minutes (NaN if it can't be read)
export function parseDuration(text) {
  const s = String(text || "").trim().toLowerCase().replace(",", ".");
  if (!s) return NaN;
  let m = s.match(/^(\d{1,2}):([0-5]\d)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/^\d+$/.test(s)) return Number(s);
  m = s.match(/^(\d+(?:\.\d+)?)\s*(h|ч|soat)$/);
  if (m) return Math.round(Number(m[1]) * 60);
  m = s.match(/^(?:(\d+)\s*(?:h|ч|soat))?\s*(?:(\d+)\s*(?:m|min|мин|м|daq|daqiqa))?$/);
  if (m && (m[1] || m[2])) return Number(m[1] || 0) * 60 + Number(m[2] || 0);
  return NaN;
}

/* ---------- leaderboard ----------
   players: [{ username, name, color, sessions, games }]
   metric: "time" | "sessions" | "streak" | "games"
   gameKey (optional): a catalog id; only time on that game counts. */
export function leaderboard(players, { period, metric, gameKey = "", today }) {
  const range = periodRange(period, today);
  const rows = players.map((p) => {
    let list = period === "all" ? p.sessions : inRange(p.sessions, range);
    if (gameKey) {
      const ids = new Set(p.games.filter((g) => g.catalogId === gameKey).map((g) => g.id));
      list = list.filter((s) => ids.has(s.game));
    }
    const value =
      metric === "sessions" ? list.length
      : metric === "streak" ? streaks(list, today).longest
      : metric === "games" ? new Set(list.map((s) => s.game)).size
      : sum(list);
    const top = byGame(list)[0];
    return { username: p.username, name: p.name, color: p.color, value, top: top ? p.games.find((g) => g.id === top.game)?.title || "" : "" };
  }).filter((r) => r.value > 0);
  rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  // equal values share a rank (1, 2, 2, 4)
  rows.forEach((r, i) => { r.rank = i && rows[i - 1].value === r.value ? rows[i - 1].rank : i + 1; });
  return rows;
}

// Calendar heat map: the last `weeks` weeks as columns of 7 days (Mon..Sun).
export function heatWeeks(sessions, today, weeks = 12) {
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  const series = new Map(dailySeries(sessions, [first, addDays(weekStart(today), 6)]).map((d) => [d.date, d.minutes]));
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, w * 7 + d);
      col.push({ date, minutes: date > today ? null : series.get(date) || 0 });
    }
    cols.push(col);
  }
  return cols;
}

export { toKey };
