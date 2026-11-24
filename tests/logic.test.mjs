// Run with: npm test   (or node --test tests/)
import test from "node:test";
import assert from "node:assert/strict";
import { parseClipUrl, embedUrl } from "../src/lib/clips.js";
import * as S from "../src/lib/stats.js";
import { searchCatalog } from "../src/data/catalog.js";
import { buildDemoData } from "../src/data/demo.js";
import { checkSignUp } from "../src/lib/accounts.js";
import { coverPlan } from "../src/lib/gameColor.js";

const ses = (date, minutes, game = "a", start = "") => ({ id: date + minutes + game, game, date, minutes, start });

test("clip links: YouTube in all its shapes", () => {
  for (const u of ["https://www.youtube.com/watch?v=c80dVYcL69E", "https://youtu.be/c80dVYcL69E", "https://m.youtube.com/shorts/c80dVYcL69E", "https://www.youtube.com/embed/c80dVYcL69E"]) {
    const p = parseClipUrl(u);
    assert.equal(p.platform, "youtube", u);
    assert.equal(p.id, "c80dVYcL69E");
  }
  assert.equal(parseClipUrl("https://youtu.be/c80dVYcL69E?t=1m30s").start, 90);
  assert.match(embedUrl({ url: "https://youtu.be/c80dVYcL69E?t=90" }), /youtube-nocookie\.com\/embed\/c80dVYcL69E\?.*start=90/);
});

test("clip links: Twitch, Streamable, Medal, files, junk", () => {
  assert.equal(parseClipUrl("https://clips.twitch.tv/FunnyClipSlug").kind, "clip");
  assert.equal(parseClipUrl("https://www.twitch.tv/someone/clip/FunnyClipSlug").id, "FunnyClipSlug");
  assert.match(embedUrl({ url: "https://clips.twitch.tv/Abc" }, "islombekmaxsumov.github.io"), /parent=islombekmaxsumov\.github\.io/);
  assert.equal(parseClipUrl("https://streamable.com/abc123").platform, "streamable");
  const medal = parseClipUrl("https://medal.tv/games/valorant/clips/2abc/xyz");
  assert.equal(medal.platform, "medal");
  assert.equal(medal.embeddable, false);
  assert.equal(parseClipUrl("https://example.com/clip.mp4").platform, "file");
  assert.equal(parseClipUrl("https://example.com/page").platform, "link");
  assert.equal(parseClipUrl("not a link"), null);
  assert.equal(parseClipUrl("javascript:alert(1)"), null);
  assert.equal(parseClipUrl("https://youtube.com/watch?v=short").platform, "link"); // bad id → plain link
});

test("weeks start on Monday; period ranges", () => {
  assert.equal(S.weekStart("2026-11-24"), "2026-11-23"); // Tuesday → Monday
  assert.equal(S.weekStart("2026-11-29"), "2026-11-23"); // Sunday → same week
  assert.deepEqual(S.periodRange("week", "2026-11-24"), ["2026-11-23", "2026-11-29"]);
  assert.deepEqual(S.periodRange("7d", "2026-11-24"), ["2026-11-18", "2026-11-24"]);
  assert.deepEqual(S.periodRange("month", "2026-11-24"), ["2026-11-01", "2026-11-24"]);
});

test("daily series fills empty days; by game shares add up", () => {
  const list = [ses("2026-11-20", 60), ses("2026-11-22", 30, "b"), ses("2026-11-22", 30)];
  const d = S.dailySeries(list, ["2026-11-20", "2026-11-23"]);
  assert.deepEqual(d.map((x) => x.minutes), [60, 0, 60, 0]);
  const g = S.byGame(list);
  assert.equal(g[0].game, "a");
  assert.equal(g[0].minutes, 90);
  assert.ok(Math.abs(g.reduce((a, x) => a + x.share, 0) - 1) < 1e-9);
});

test("streaks: current survives until the day is over", () => {
  const list = ["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-22", "2026-11-23"].map((d) => ses(d, 30));
  assert.deepEqual(S.streaks(list, "2026-11-24"), { current: 2, longest: 3 });
  assert.equal(S.streaks(list, "2026-11-25").current, 0);
  assert.deepEqual(S.streaks([], "2026-11-24"), { current: 0, longest: 0 });
});

test("time of day buckets and weekday averages", () => {
  const t = S.byTimeOfDay([ses("2026-11-20", 10, "a", "05:00"), ses("2026-11-20", 20, "a", "09:30"), ses("2026-11-20", 30, "a", "21:00"), ses("2026-11-20", 40)]);
  assert.deepEqual(t, { night: 10, morning: 20, afternoon: 0, evening: 30, unknown: 40 });
  const w = S.byWeekday([ses("2026-11-23", 60), ses("2026-11-16", 0.0001)], ["2026-11-16", "2026-11-29"]); // two Mondays
  assert.ok(Math.abs(w[0] - 30) < 0.01);
});

test("this week so far vs the same days last week", () => {
  const list = [ses("2026-11-16", 60), ses("2026-11-17", 60), ses("2026-11-19", 600), ses("2026-11-23", 90)];
  // Tue 24 Nov: this Mon–Tue = 90, last Mon–Tue = 120 (Thursday's 600 is not counted)
  assert.equal(S.weekSoFarTrend(list, "2026-11-24"), -0.25);
  assert.equal(S.weekSoFarTrend([ses("2026-11-23", 30)], "2026-11-24"), null);
});

test("weekly goal: reach and limit", () => {
  const list = [ses("2026-11-23", 300), ses("2026-11-24", 200)];
  const r = S.goalProgress(list, { minutes: 600, mode: "reach" }, "2026-11-24");
  assert.equal(r.played, 500);
  assert.equal(r.left, 100);
  assert.equal(r.daysLeft, 6);
  assert.equal(r.state, "going");
  assert.equal(S.goalProgress(list, { minutes: 450, mode: "limit" }, "2026-11-24").state, "over");
  assert.equal(S.goalProgress(list, { minutes: 600, mode: "limit" }, "2026-11-24").state, "close");
});

test("log form checks", () => {
  const today = "2026-11-24";
  assert.deepEqual(S.checkSession({ game: "a", date: today, minutes: 60, start: "20:00" }, [], today), {});
  assert.equal(S.checkSession({ game: "", date: today, minutes: 60 }, [], today).game, "err.game");
  assert.equal(S.checkSession({ game: "a", date: "2026-11-25", minutes: 60 }, [], today).date, "err.future");
  assert.equal(S.checkSession({ game: "a", date: "2026-02-31", minutes: 60 }, [], today).date, "err.date");
  assert.equal(S.checkSession({ game: "a", date: today, minutes: 0 }, [], today).minutes, "err.minutes");
  assert.equal(S.checkSession({ game: "a", date: today, minutes: 17 * 60 }, [], today).minutes, "err.tooLong");
  assert.equal(S.checkSession({ game: "a", date: today, minutes: 600 }, [ses(today, 900)], today).minutes, "err.dayFull");
  assert.equal(S.checkSession({ game: "a", date: today, minutes: 60, start: "25:00" }, [], today).start, "err.start");
});

test("duration text in three languages", () => {
  assert.equal(S.parseDuration("90"), 90);
  assert.equal(S.parseDuration("1:30"), 90);
  assert.equal(S.parseDuration("1.5h"), 90);
  assert.equal(S.parseDuration("1,5 ч"), 90);
  assert.equal(S.parseDuration("2h 15m"), 135);
  assert.equal(S.parseDuration("1 soat 20 daqiqa"), 80);
  assert.ok(Number.isNaN(S.parseDuration("soon")));
});

test("leaderboard ranks, ties and per-game filter", () => {
  const today = "2026-11-24";
  const players = [
    { username: "a", name: "A", sessions: [ses(today, 120, "a1")], games: [{ id: "a1", catalogId: "cs2", title: "CS2" }] },
    { username: "b", name: "B", sessions: [ses(today, 120, "b1")], games: [{ id: "b1", catalogId: "dota2", title: "Dota" }] },
    { username: "c", name: "C", sessions: [ses(today, 60, "c1")], games: [{ id: "c1", catalogId: "cs2", title: "CS2" }] },
    { username: "d", name: "D", sessions: [], games: [] },
  ];
  const rows = S.leaderboard(players, { period: "week", metric: "time", today });
  assert.deepEqual(rows.map((r) => [r.username, r.rank]), [["a", 1], ["b", 1], ["c", 3]]);
  assert.deepEqual(S.leaderboard(players, { period: "week", metric: "time", gameKey: "cs2", today }).map((r) => r.username), ["a", "c"]);
});

test("catalog search ignores case and punctuation", () => {
  assert.equal(searchCatalog("cs 2")[0].id, "cs2");
  assert.equal(searchCatalog("ELDEN")[0].id, "eldenring");
  assert.ok(!searchCatalog("", { exclude: ["cs2"] }).some((g) => g.id === "cs2"));
});

test("demo data: deterministic, no future sessions, this week not empty", () => {
  const a = buildDemoData("2026-11-24"), b = buildDemoData("2026-11-24");
  assert.deepEqual(a, b);
  const q = a.qwerty;
  assert.ok(q.sessions.length > 30);
  assert.ok(q.sessions.every((s) => s.date <= "2026-11-24" && q.games.some((g) => g.id === s.game)));
  assert.ok(q.clips.length >= 4);
  for (const day of ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26"]) {
    const d = buildDemoData(day);
    const [from] = S.periodRange("7d", day);
    assert.ok(S.inRange(d.qwerty.sessions, [from, day]).length > 0, day);
  }
});

test("sign-up checks", () => {
  assert.deepEqual(checkSignUp({ username: "new_user", name: "Ali", password: "secret1", confirm: "secret1" }, {}), {});
  const e = checkSignUp({ username: "Q!", name: "A", password: "123", confirm: "123" }, {});
  assert.deepEqual(Object.keys(e).sort(), ["name", "password", "username"]);
  assert.equal(checkSignUp({ username: "qwerty", name: "Ali", password: "secret1", confirm: "x" }, { qwerty: {} }).username, "err.taken");
  assert.equal(checkSignUp({ username: "ali", name: "Ali", password: "secret1", confirm: "x" }, {}).confirm, "err.confirm");
});

test("drawn covers: same title, same plan; indices always in range", () => {
  assert.deepEqual(coverPlan("Night Harbour", 5), coverPlan("Night Harbour", 5));
  const chars = "abcdefghijklmnopqrstuvwxyz Ёжик0123456789'";
  for (let i = 0; i < 5000; i++) {
    let title = "";
    for (let k = 0; k < 1 + (i % 30); k++) title += chars[(i * 7 + k * 13) % chars.length];
    const p = coverPlan(title + i, 5);
    assert.ok(p.comp >= 0 && p.comp < 5 && p.a >= 0 && p.a < 8 && p.b >= 0 && p.b < 8 && p.a !== p.b, title);
  }
  assert.equal(coverPlan("Night Harbour", 5).comp >= 0, true); // the title that crashed before the fix
});
