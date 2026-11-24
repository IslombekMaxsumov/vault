// Routes, the login guard and the page frame.
// Pages: #/ (home), #/library, #/game/<id>, #/log, #/clips, #/stats,
// #/leaderboard, #/profile, #/login, #/signup.
import { useEffect, useRef, useState } from "react";
import { useRoute, navigate } from "./lib/router.js";
import { useI18n } from "./i18n/useI18n.js";
import { useDb } from "./hooks/useDb.js";
import { useTheme } from "./hooks/useTheme.js";
import * as db from "./lib/db.js";
import { Header, TabBar, TimerControl, Footer } from "./components/Shell.jsx";
import { LoginPage, SignupPage } from "./pages/Auth.jsx";
import { HomePage } from "./pages/Home.jsx";
import { LibraryPage } from "./pages/Library.jsx";
import { GamePage } from "./pages/Game.jsx";
import { LogPage } from "./pages/Log.jsx";
import { ClipsPage } from "./pages/Clips.jsx";
import { StatsPage } from "./pages/Stats.jsx";
import { LeaderboardPage } from "./pages/Leaderboard.jsx";
import { ProfilePage } from "./pages/Profile.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

const PAGES = { "": HomePage, library: LibraryPage, game: GamePage, log: LogPage, clips: ClipsPage, stats: StatsPage, leaderboard: LeaderboardPage, profile: ProfilePage };
const TITLES = { "": "nav.home", library: "nav.library", game: "nav.library", log: "nav.log", clips: "nav.clips", stats: "nav.stats", leaderboard: "nav.leaderboard", profile: "nav.profile", login: "auth.login", signup: "auth.signup" };

export default function App() {
  const route = useRoute();
  const { t } = useI18n();
  const { me, data } = useDb();
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const main = useRef(null);
  const first = useRef(true);

  // First load: create the demo players (or move their dates forward).
  useEffect(() => { db.seed().finally(() => setReady(true)); }, []);

  const authPage = route.page === "login" || route.page === "signup";
  // Logged out → login page (and back to where you were after logging in).
  useEffect(() => {
    if (!ready) return;
    if (!me && !authPage) {
      // remember where to go back to, unless we're already on the way to the login page (Log out)
      const cur = window.location.hash.slice(1);
      if (!/^\/(login|signup)/.test(cur)) navigate("login", "", { next: cur || "/" });
    }
    if (me && authPage) navigate("");
  }, [ready, me, authPage]);

  // Tab title, and move focus to the page heading on page changes (not on first load)
  useEffect(() => {
    document.title = `${t(TITLES[route.page] || "nav.home")} · VAULT`;
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    main.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, [route.page, route.param, t]);

  if (!ready) return <div className="boot" aria-busy="true" />;

  if (authPage || !me) {
    return (
      <main id="main" ref={main} className="auth-main">
        {route.page === "signup" ? <SignupPage theme={theme} /> : <LoginPage theme={theme} next={route.query.get("next")} />}
      </main>
    );
  }

  const Page = PAGES[route.page] || NotFound;
  return (
    <div className={`app ${data.timer ? "has-timer" : ""}`}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); main.current?.querySelector("h1")?.focus(); }}>{t("skip")}</a>
      <Header page={route.page} theme={theme} />
      <main id="main" ref={main} className="page">
        {/* keyed by route: every page change mounts fresh and its sections reveal in sequence (.page-anim in app.css) */}
        <div key={route.page + "/" + route.param} className="page-anim">
          <ErrorBoundary><Page route={route} /></ErrorBoundary>
        </div>
      </main>
      <Footer />
      <TimerControl variant="strip" />
      <TabBar page={route.page} />
    </div>
  );
}
