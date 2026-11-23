// Translations for the whole app (same helper as Tasko, plus duration and day
// formatting). Wrap the app in <I18nProvider>, then in any component:
//   const { t, lang, setLang, formatDate, duration, dayLabel } = useI18n();
import { useCallback, useEffect, useMemo, useState } from "react";
import { translations, LANGS, LOCALES } from "./translations.js";
import { storage } from "../lib/storage.js";
import { formatUzDate } from "./uzDate.js";
import { I18nContext } from "./useI18n.js";
import { fromKey, addDays } from "../lib/dates.js";

function detectLang() {
  const saved = storage.get("lang");
  if (LANGS.includes(saved)) return saved;
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LANGS.includes(browser) ? browser : "en";
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);
  const locale = LOCALES[lang];

  const setLang = useCallback((code) => {
    if (!LANGS.includes(code)) return;
    storage.set("lang", code);
    setLangState(code);
  }, []);

  // t("key", { count: 3, name: "x" }): falls back to English, then to the key.
  const t = useCallback(
    (key, vars = {}) => {
      let value = translations[lang][key] ?? translations.en[key];
      if (value === undefined) return key;
      if (typeof value === "object") {
        const rule = new Intl.PluralRules(locale).select(Number(vars.count));
        value = value[rule] ?? value.other;
      }
      return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
    },
    [lang, locale]
  );

  const formatDate = useCallback(
    (date, options) => (lang === "uz" ? formatUzDate(date, options) : new Intl.DateTimeFormat(locale, options).format(date)),
    [lang, locale]
  );

  // Uzbek groups thousands with spaces like Russian (Intl "uz" sometimes uses commas).
  const formatNumber = useCallback(
    (n, opts) => new Intl.NumberFormat(lang === "uz" ? "ru-RU" : locale, opts).format(n),
    [lang, locale]
  );

  // 754 → "12 h 34 min"; { short: true } drops the minutes once it's 10 h or more.
  const duration = useCallback(
    (minutes, { short = false } = {}) => {
      const total = Math.max(0, Math.round(minutes));
      const h = Math.floor(total / 60), m = total % 60;
      if (!h) return t("dur.m", { m });
      if (!m || (short && h >= 10)) return t("dur.h", { h: formatNumber(h) });
      return t("dur.hm", { h: formatNumber(h), m });
    },
    [t, formatNumber]
  );

  // "Today", "Yesterday", "Saturday, 21 November" (with the year if it isn't this year)
  const dayLabel = useCallback(
    (key, today) => {
      if (key === today) return t("day.today");
      if (key === addDays(today, -1)) return t("day.yesterday");
      const d = fromKey(key);
      const opts = { weekday: "long", day: "numeric", month: "long" };
      if (key.slice(0, 4) !== today.slice(0, 4)) opts.year = "numeric";
      const text = formatDate(d, opts);
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    [t, formatDate]
  );

  const shortDate = useCallback((key) => formatDate(fromKey(key), { day: "numeric", month: "short" }), [formatDate]);

  // Compact chart axis date: "07.09" (Uzbek and Russian), "07/09" (English, day first).
  const axisDate = useCallback((key) => key.slice(8) + (lang === "en" ? "/" : ".") + key.slice(5, 7), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({ lang, locale, setLang, t, formatDate, formatNumber, duration, dayLabel, shortDate, axisDate }),
    [lang, locale, setLang, t, formatDate, formatNumber, duration, dayLabel, shortDate, axisDate]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
