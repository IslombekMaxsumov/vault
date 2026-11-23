// Today's date as "YYYY-MM-DD". Re-checks every minute and when the tab
// becomes visible again, so "Today" and "Overdue" stay correct past midnight.
import { useEffect, useState } from "react";
import { todayKey } from "../lib/dates.js";

export function useToday() {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    const refresh = () => setToday(todayKey());
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return today;
}
