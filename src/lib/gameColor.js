// Every game gets a colour from its title (the same title always gives the
// same colour), used on its cover and in charts. The 8 colours are the chart
// set (--c1..--c8 in tokens.css).

export function hashString(s) {
  let h = 2166136261;
  for (const ch of String(s).toLowerCase()) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

export const colorIndex = (title) => hashString(title) % 8; // 0..7

// In a chart, two games may hash to the same colour; later ones (less played)
// move to the next free colour, so a ring never shows two equal neighbours.
export function assignColors(titles) {
  const used = new Set();
  return titles.map((title) => {
    let i = colorIndex(title);
    for (let k = 0; k < 8 && used.has(i); k++) i = (i + 1) % 8;
    used.add(i);
    return `var(--c${i + 1})`;
  });
}

export const gameColor = (title) => `var(--c${colorIndex(title) + 1})`;

// Which colours and which of the `count` compositions a drawn cover uses.
// Always in range, for any title (>>> keeps the 32-bit hash positive).
export function coverPlan(title, count) {
  const h = hashString(title);
  const a = colorIndex(title);
  return { a, b: (a + 2 + (h % 5)) % 8, comp: (h >>> 3) % count, seed: (h >>> 7) & 255 };
}
