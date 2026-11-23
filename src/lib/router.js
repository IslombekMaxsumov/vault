// A tiny hash router: pages live at "#/library", "#/game/abc?tab=sessions".
// Hash routes work on GitHub Pages: a refresh always loads index.html.
import { useEffect, useState } from "react";

export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#\/?/, "");
  const [path, qs = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  return { page: parts[0] || "", param: parts[1] || "", query: new URLSearchParams(qs) };
}

export function href(page, param = "", query = null) {
  let h = "#/" + page + (param ? "/" + encodeURIComponent(param) : "");
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== "" && v != null)).toString() : "";
  return qs ? `${h}?${qs}` : h;
}

export const navigate = (page, param, query) => { window.location.hash = href(page, param, query); };

// Change the query of the current page without adding a history entry
// (filters, tabs), so Back still goes to the previous page.
export function setQuery(query) {
  const { page, param } = parseHash();
  history.replaceState(null, "", href(page, param, query));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
