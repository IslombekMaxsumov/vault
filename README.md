# VAULT

Site #9 of my 10-website course project: a personal gaming archive. Keep a library of the games you play, log playtime with a live timer or by hand, see stats and charts, keep your clips (pasted video links) and compare yourself on a leaderboard. Features are inspired by Medal.tv; the name and look are VAULT's own.

**Demo account for checking:** login `qwerty`, password `123` (already filled with 9 games, about 8 weeks of sessions, clips and 7 demo players on the leaderboard). The login page has a button that fills it in.

## Pages (hash routes, so refreshing works on GitHub Pages)

| Route | Page |
|---|---|
| `#/login`, `#/signup` | Log in (with the demo note), create an account |
| `#/` | Home: start a session, this week's numbers, weekly goal, last 14 days, most played, recent sessions, latest clips, leaderboard place |
| `#/library` | Library: search, status chips, platform / genre / sort (kept in the address), add a game from the built-in list or by hand |
| `#/game/<id>` | Game: status, platform, rating, favourite, notes, numbers, time per week, session history, clips, remove with Undo |
| `#/log` | Timer, log time by hand, every session grouped by day with totals, edit / delete with Undo |
| `#/clips` | My clips / Everyone, filters, likes, player dialog (the video loads only after Play) |
| `#/stats` | Period, headline numbers, time per day or week, per game, per weekday, time of day, 12-week heat map; every chart has a table |
| `#/leaderboard` | By time, sessions, longest streak or games played; this week / month / all time; per game; my row pinned when far down |
| `#/profile` | Name and colour, weekly goal, password, backup export / import, log out, delete account |

## Things that do real work

- **Live timer** (`lib/db.js`): only the start time is saved, and the elapsed time is always worked out from it, so it survives reloads and closed tabs.
- **Duration parsing** (`lib/stats.js` `parseDuration`): "1:30", "90", "1.5h", "1,5 ч", "2h 15m", "1 soat 20 daqiqa".
- **Session checks**: no future dates, no session over 16 h, no day over 24 h, a real time of day.
- **Weekly goal** in two modes: play at least / stay under, with time left and per day.
- **Stats**: daily and weekly series, per game, weekday averages, time of day, streaks, change against the period before, heat map levels from quartiles.
- **Leaderboard** with shared ranks for ties.
- **Clip links** (`lib/clips.js`): YouTube (watch, youtu.be, shorts, embed, `t=` start time), Twitch clips and videos, Streamable, Vimeo and direct video files play inside the site; Medal and other links open on their own site.
- **Accounts** (`lib/accounts.js`): front-end only, salted SHA-256 hashes in localStorage (same approach as typeflow, #5).

## Design: "Living Archive" (art direction revision, 2026-11-24)

An immersive personal archive rather than a dashboard: each page has its own composition.
- **Palette:** warm archive paper `#F3F1EB` with coral `#E86650` and slate blue `#729BA8` (light); a deep blue-slate room `#151C22` with soft coral and blue light (dark). Brief values that failed AA in light mode were darkened just enough (noted in `src/styles/tokens.css`). Coral buttons carry dark text (white on coral is only 3.3:1).
- **Type:** Golos Text at 700–800 for large editorial headings (Golos Display is not on Google Fonts), Golos Text for body, Roboto Mono for every number.
- **Motif:** thin orbit lines (hero, login collage, empty states, the orbit chart) and the coral **Session Trace** (one mark per session).
- **Home:** a large greeting, this week's time as the one big counting number, the featured game's art turned slightly in front of an arch outline with slowly drifting organic shapes, the goal ring and the start-session panel overlapping it; a wide activity band with curved edges; a session timeline; an editorial clip gallery.
- **Library:** compact toolbar, a featured-favourite band, a staggered shelf of larger covers with a start button that appears on hover (always visible on touch screens).
- **Game page:** the art blurred and enlarged as a backdrop, a big title and counting playtime, facts, timeline, clips.
- **Stats:** one huge total, this period against the one before, a wide bar chart, an orbit chart (one arc per game), lollipop rows, a dot heat map that appears week by week. Every chart keeps its table.
- **Leaderboard:** big rank numerals, a restrained top three, avatars with rings, a sliding period control, your row highlighted and pinned when far down.
- **Motion** (150–450 ms, longer only for charts): staggered page reveals, sliding nav, tab and segmented indicators, count-up numbers, bars growing from the baseline, rings and arcs drawing themselves, cover layers drifting apart on hover, a short reveal for a newly logged session, like and dialog animations. With "reduce motion" all of it is off and numbers show their value at once.
- **Game covers** (`components/GameCover.jsx`), all 2:3:
  - The 37 games in the built-in catalog show their **official cover art** (`public/covers`, 400×600, downloaded by `tools/covers.mjs`; the source of each is in `src/data/covers.js`). The art belongs to its publishers and is used here for a non-commercial course project.
  - Games added by hand, or art that fails to load, get a **drawn cover**: two colours from the title and one of five compositions (eclipse, orbit, arch, split, stack) with the title in large type. `coverPlan()` in `lib/gameColor.js` makes it deterministic and is tested on 5 000 titles.

## Run

```
npm install
npm run dev      # http://localhost:5173
npm test         # logic tests (node --test)
npm run build
```

Deploys to GitHub Pages with `.github/workflows/deploy.yml` on every push to `main` (Vite `base: "./"`).

## Demo clips

The demo clips are official game trailers on YouTube. I checked that each link works with YouTube's oEmbed. No video is stored here.
