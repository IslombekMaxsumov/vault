// Uzbek date formatting done by hand. Some browsers claim to support "uz" in
// Intl but have no month names for it and print "M11 18, Wed" instead.
// Uzbek writes the day with a hyphen: "18-noyabr", "Chorshanba, 18-noyabr".

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const WEEKDAYS_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Supports the option combinations this app uses:
// { weekday: "narrow" | "short" | "long" }, { day, month: "short" | "long", year?, weekday? }
export function formatUzDate(date, options = {}) {
  const weekday = WEEKDAYS[date.getDay()];
  // weekday only: "D" (narrow), "Du" (short), "Dushanba" (long)
  if (options.weekday && !options.month && !options.day) {
    if (options.weekday === "narrow") return weekday.charAt(0).toUpperCase();
    if (options.weekday === "short") return WEEKDAYS_SHORT[date.getDay()];
    return capitalize(weekday);
  }

  const months = options.month === "long" ? MONTHS : MONTHS_SHORT;
  // month and year only: "2026-yil noyabr"
  if (options.month && !options.day) return `${options.year ? `${date.getFullYear()}-yil ` : ""}${months[date.getMonth()]}`;
  let text = `${date.getDate()}-${months[date.getMonth()]}`;
  if (options.year) text = `${date.getFullYear()}-yil ${text}`;
  if (options.weekday) text = `${options.weekday === "short" ? WEEKDAYS_SHORT[date.getDay()] : capitalize(weekday)}, ${text}`;
  return text;
}
