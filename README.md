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

## Design

From the RAVENI / "After Hours" brief, named VAULT: an editorial gaming archive.
- Warm stone light theme and a green-black dark theme, designed separately. Burnt orange accent `#C96738` / `#EB9562`.
- Golos Text for headings and body (Golos Display isn't on Google Fonts, so headings use Golos Text at 650–800) and Roboto Mono for every number. Both have Cyrillic.
- **Contrast:** brief colours that failed WCAG AA in light mode were darkened just enough. The original values are noted in `src/styles/tokens.css`.
- **Signature, the Session Trace:** small burnt-orange vertical marks, one per session. They appear in session rows, on the game page, in the logo and in the most-played block.
- **Game covers** (`components/GameCover.jsx`), all 2:3:
  - The 37 games in the built-in catalog show their **official cover art** (`public/covers`, 400×600). `tools/covers.mjs` downloads it: 27 from Steam, 6 from the Microsoft Store, Mario Kart 8 from Wikipedia and 3 phone games from Google Play. The source of each is in `src/data/covers.js`. The art belongs to its publishers and is used here for a non-commercial course project.
  - Games added by hand, or art that fails to load, get a **drawn cover**: the title's hash picks a colour and one of five geometric compositions, with the genre, platform and a small VAULT mark.
- **Clip placeholders:** clips without a thumbnail get a placeholder in their game's colour.
- **Logo:** an archive bracket holding three session marks of rising height, the last one in orange.

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
