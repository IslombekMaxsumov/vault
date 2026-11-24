// The frame around every page after login: header (desktop menu, timer,
// language, theme, account menu), the phone tab bar with its "More" sheet,
// and the slim timer strip above the tab bar on phones.
import { useEffect, useRef, useState } from "react";
import { House, Library, Timer, Clapperboard, ChartColumn, Trophy, UserRound, Ellipsis, Sun, Moon, LogOut, Square } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb, useElapsed, clock } from "../hooks/useDb.js";
import { href, navigate } from "../lib/router.js";
import * as db from "../lib/db.js";
import { Logo } from "./Logo.jsx";
import { Avatar } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import { useToast } from "./useToast.js";
import { useIndicator } from "../hooks/useMotion.js";

export const NAV = [
  { page: "", key: "nav.home", icon: House },
  { page: "library", key: "nav.library", icon: Library },
  { page: "log", key: "nav.log", icon: Timer },
  { page: "clips", key: "nav.clips", icon: Clapperboard },
  { page: "stats", key: "nav.stats", icon: ChartColumn },
  { page: "leaderboard", key: "nav.leaderboard", icon: Trophy },
];
const MORE = ["stats", "leaderboard", "profile"];
// which menu item a page belongs to (the game page belongs to the library)
const owner = (page) => (page === "game" ? "library" : page);

function LangSwitch() {
  const { t, lang, setLang } = useI18n();
  const ref = useIndicator('[aria-pressed="true"]', [lang]);
  return (
    <div ref={ref} className="seg seg-lang" role="group" aria-label={t("header.lang")}>
      {["uz", "ru", "en"].map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
          <span aria-hidden="true">{l.toUpperCase()}</span>
          <span className="visually-hidden">{t("lang." + l)}</span>
        </button>
      ))}
    </div>
  );
}

export function ThemeButton({ theme }) {
  const { t } = useI18n();
  const dark = theme.theme === "dark";
  return (
    <button type="button" className="icon-btn" onClick={theme.toggle} aria-label={dark ? t("header.light") : t("header.dark")}>
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

// The running timer: in the header (desktop) and as a strip (phones).
export function TimerControl({ variant }) {
  const { t, duration } = useI18n();
  const { data } = useDb();
  const toast = useToast();
  const sec = useElapsed(data.timer?.startedAt);
  if (!data.timer) return null;
  const game = data.games.find((g) => g.id === data.timer.game);
  const stop = () => {
    const s = db.stopTimer();
    if (!s) return;
    if (s.tooShort) return toast(t("timer.tooShort"));
    toast(t("timer.logged", { time: duration(s.minutes), game: game?.title || "" }), { label: t("undo"), run: () => db.removeSession(s.id) });
  };
  return (
    <div className={`timer-ctl timer-${variant}`}>
      <span className="timer-dot" aria-hidden="true" />
      <a className="timer-game" href={href("log")}>{game?.title}</a>
      <span className="timer-clock num" role="timer" aria-label={t("timer.elapsed")}>{clock(sec)}</span>
      <button type="button" className="btn btn-sm btn-primary timer-stop" onClick={stop}>
        <Square size={12} fill="currentColor" aria-hidden="true" />{t("timer.stop")}
      </button>
    </div>
  );
}

function AccountMenu({ me }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") { setOpen(false); ref.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <Avatar user={me} size={32} />
        <span className="visually-hidden">{t("header.account", { name: me.name })}</span>
      </button>
      {open && (
        <div className="account-pop">
          <p className="account-name"><strong>{me.name}</strong><span className="muted">@{me.username}</span></p>
          <a href={href("profile")} onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" />{t("nav.profile")}</a>
          <button type="button" onClick={() => { db.logOut(); navigate("login"); }}><LogOut size={16} aria-hidden="true" />{t("auth.logout")}</button>
        </div>
      )}
    </div>
  );
}

export function Header({ page, theme }) {
  const { t, lang } = useI18n();
  const { me } = useDb();
  const cur = owner(page);
  const navRef = useIndicator('[aria-current="page"]', [cur, lang]);
  return (
    <header className="site-header">
      <div className="header-bar">
        <a className="brand" href={href("")} aria-label={t("header.home")}><Logo /></a>
        <nav ref={navRef} className="top-nav" aria-label={t("nav.label")}>
          {NAV.map((n) => (
            <a key={n.page} href={href(n.page)} aria-current={cur === n.page ? "page" : undefined}>{t(n.key)}</a>
          ))}
        </nav>
        <div className="header-tools">
          <TimerControl variant="header" />
          <LangSwitch />
          <ThemeButton theme={theme} />
          {me && <AccountMenu me={me} />}
        </div>
      </div>
    </header>
  );
}

export function TabBar({ page }) {
  const { t, lang } = useI18n();
  const [more, setMore] = useState(false);
  const cur = owner(page);
  const tabs = NAV.slice(0, 4);
  const moreOn = MORE.includes(cur);
  const barRef = useIndicator('[aria-current="page"]', [cur, lang]);
  return (
    <>
      <nav ref={barRef} className="tab-bar" aria-label={t("nav.label")}>
        {tabs.map((n) => (
          <a key={n.page} href={href(n.page)} aria-current={cur === n.page ? "page" : undefined}>
            <n.icon size={20} aria-hidden="true" /><span>{t(n.key + "Short")}</span>
          </a>
        ))}
        <button type="button" className={moreOn ? "is-current" : ""} aria-current={moreOn ? "page" : undefined} aria-haspopup="dialog" onClick={() => setMore(true)}>
          <Ellipsis size={20} aria-hidden="true" /><span>{t("nav.more")}</span>
        </button>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} titleId="moreTitle" title={t("nav.more")} className="more-sheet">
        <ul className="more-list">
          {[["stats", ChartColumn, "nav.stats"], ["leaderboard", Trophy, "nav.leaderboard"], ["profile", UserRound, "nav.profile"]].map(([p, Icon, key]) => (
            <li key={p}>
              <a href={href(p)} aria-current={cur === p ? "page" : undefined} onClick={() => setMore(false)}><Icon size={20} aria-hidden="true" />{t(key)}</a>
            </li>
          ))}
          <li><button type="button" onClick={() => { setMore(false); db.logOut(); navigate("login"); }}><LogOut size={20} aria-hidden="true" />{t("auth.logout")}</button></li>
        </ul>
      </Modal>
    </>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Logo size={18} />
        <p className="muted">{t("footer.note")}</p>
      </div>
    </footer>
  );
}

export { LangSwitch };
