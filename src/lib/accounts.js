// Front-end-only accounts (there is no server). Passwords are never stored as
// typed: each account keeps a random salt and the SHA-256 hash of salt +
// password. That stops anyone reading the password back, but it is still not
// real security: everything lives in this browser's localStorage.
// Same approach as typeflow (#5).

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const COLORS = ["#2f6fdf", "#d64545", "#1f9d74", "#c27c0e", "#8a4fd6", "#d0517f", "#21808f", "#5f6b7a"];

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const randomSalt = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function makeUser({ username, name, password, color, demo = false, npc = false, created }) {
  const salt = npc ? "" : randomSalt();
  return {
    username, name, color, demo, npc,
    salt, hash: npc ? "" : await sha256(salt + password),
    created: created || new Date().toISOString(),
  };
}

export async function passwordMatches(user, password) {
  return !!user && !user.npc && (await sha256(user.salt + String(password))) === user.hash;
}

// Sign-up checks. Returns { field: errorKey }; empty = fine.
// (The demo account's password "123" is shorter than new accounts may use.)
export function checkSignUp({ username, name, password, confirm }, users) {
  const e = {};
  const u = String(username || "").trim().toLowerCase();
  if (!USERNAME_RE.test(u)) e.username = "err.username";
  else if (users[u]) e.username = "err.taken";
  if (String(name || "").trim().length < 2) e.name = "err.name";
  if (String(password || "").length < 6) e.password = "err.password";
  else if (password !== confirm) e.confirm = "err.confirm";
  return e;
}
