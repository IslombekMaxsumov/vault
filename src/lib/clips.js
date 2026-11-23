// Clips are links people paste. parseClipUrl() works out which site a link is
// from and how to show it: an embedded player (YouTube, Twitch, Streamable,
// Vimeo), a plain <video> for direct .mp4/.webm files, or just a link card for
// anything else (Medal.tv, Instagram, ...). Nothing is uploaded anywhere.
//
// Returns null for text that is not an http(s) link, otherwise
// { platform, id, url, thumb, start, embeddable }.

const YT_ID = /^[\w-]{11}$/;

function seconds(t) {
  // YouTube start time: "90", "90s", "1m30s", "1h2m3s"
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = String(t).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0;
}

export function parseClipUrl(input) {
  let u;
  try {
    u = new URL(String(input || "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "").toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);
  const url = u.href;

  // YouTube
  let yt = null;
  if (host === "youtu.be") yt = parts[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (parts[0] === "watch") yt = u.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) yt = parts[1];
  }
  if (yt && YT_ID.test(yt)) {
    return { platform: "youtube", id: yt, url, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, start: seconds(u.searchParams.get("t") || u.searchParams.get("start")), embeddable: true };
  }

  // Twitch clips and videos
  if (host === "clips.twitch.tv" && parts[0] && parts[0] !== "embed") {
    return { platform: "twitch", kind: "clip", id: parts[0], url, thumb: "", start: 0, embeddable: true };
  }
  if (host === "twitch.tv") {
    if (parts[1] === "clip" && parts[2]) return { platform: "twitch", kind: "clip", id: parts[2], url, thumb: "", start: 0, embeddable: true };
    if (parts[0] === "videos" && /^\d+$/.test(parts[1] || "")) return { platform: "twitch", kind: "video", id: parts[1], url, thumb: "", start: 0, embeddable: true };
  }

  // Streamable, Vimeo
  if (host === "streamable.com" && /^[a-z0-9]+$/i.test(parts[parts[0] === "e" ? 1 : 0] || "")) {
    return { platform: "streamable", id: parts[parts[0] === "e" ? 1 : 0], url, thumb: "", start: 0, embeddable: true };
  }
  if ((host === "vimeo.com" || host === "player.vimeo.com") && parts.length) {
    const id = parts.find((p) => /^\d{5,}$/.test(p));
    if (id) return { platform: "vimeo", id, url, thumb: "", start: 0, embeddable: true };
  }

  // Medal.tv: links open on Medal (their player needs their own page)
  if (host === "medal.tv") {
    const i = parts.findIndex((p) => p === "clips" || p === "clip");
    return { platform: "medal", id: i >= 0 ? parts[i + 1] || "" : "", url, thumb: "", start: 0, embeddable: false };
  }

  // A direct video file
  if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) {
    return { platform: "file", id: "", url, thumb: "", start: 0, embeddable: true };
  }

  return { platform: "link", id: "", url, thumb: "", start: 0, embeddable: false };
}

// The address of the player for an embeddable clip. Twitch requires the name
// of the site that embeds it (parent), so it is passed in.
export function embedUrl(clip, parentHost = "localhost") {
  const p = parseClipUrl(clip.url);
  if (!p || !p.embeddable) return "";
  switch (p.platform) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${p.id}?autoplay=1&rel=0${p.start ? `&start=${p.start}` : ""}`;
    case "twitch":
      return p.kind === "clip"
        ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(p.id)}&parent=${parentHost}&autoplay=true`
        : `https://player.twitch.tv/?video=${p.id}&parent=${parentHost}&autoplay=true`;
    case "streamable":
      return `https://streamable.com/e/${p.id}?autoplay=1`;
    case "vimeo":
      return `https://player.vimeo.com/video/${p.id}?autoplay=1`;
    default:
      return "";
  }
}

export const PLATFORM_NAMES = { youtube: "YouTube", twitch: "Twitch", streamable: "Streamable", vimeo: "Vimeo", medal: "Medal", file: "Video", link: "Link" };
