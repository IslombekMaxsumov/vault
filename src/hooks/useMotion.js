// Small motion helpers. All of them respect "reduce motion": numbers jump
// straight to their value, rings and indicators don't animate.
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// A number that eases from its previous value to the new one (headline stats).
export function useCountUp(value, ms = 700) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0);
  const from = useRef(reducedMotion() ? value : 0);
  useEffect(() => {
    if (reducedMotion() || !Number.isFinite(value)) { setShown(value); from.current = value; return; }
    const start = performance.now(), a = from.current, b = value;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3); // ease out
      setShown(a + (b - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = b; };
  }, [value, ms]);
  return shown;
}

// false on the first paint, true one frame later: lets a ring or a bar start
// at zero and transition to its real length.
export function useDrawn() {
  const [drawn, setDrawn] = useState(reducedMotion());
  useEffect(() => {
    if (drawn) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, [drawn]);
  return drawn;
}

// Sliding indicator under the active item of a nav or segmented control.
// Puts --ind-x / --ind-w (and --ind-y / --ind-h) on the container; CSS moves a
// pseudo-element there with a transition.
export function useIndicator(selector, deps) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const place = () => {
      const el = box.querySelector(selector);
      if (!el) { box.style.setProperty("--ind-w", "0px"); return; }
      box.style.setProperty("--ind-x", el.offsetLeft + "px");
      box.style.setProperty("--ind-w", el.offsetWidth + "px");
      box.style.setProperty("--ind-y", el.offsetTop + "px");
      box.style.setProperty("--ind-h", el.offsetHeight + "px");
      box.dataset.ready = "true";
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line
  return ref;
}
