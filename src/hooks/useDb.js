// Re-render when the data changes (db.emit), and hand out what pages need.
//   const { me, data, players } = useDb();
import { useMemo, useSyncExternalStore, useEffect, useState } from "react";
import * as db from "../lib/db.js";

export function useDb() {
  const version = useSyncExternalStore(db.subscribe, db.getVersion);
  return useMemo(() => {
    const me = db.me();
    return { version, me, data: db.myData(), players: () => db.allPlayers() };
  }, [version]);
}

// Seconds that have passed since an ISO time, ticking every second.
// Elapsed time is always worked out from the saved start, so nothing drifts
// and a closed tab doesn't matter.
export function useElapsed(startedAt) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    const vis = () => setNow(Date.now());
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, [startedAt]);
  return startedAt ? Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000)) : 0;
}

export const clock = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};
