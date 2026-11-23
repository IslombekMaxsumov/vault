// Built-in game catalog: what the "Add game" search offers. Only facts
// (name, genre, platforms, year, studio); no cover art, so covers are drawn
// from the title (see components/GameCover.jsx). Users can also add any game
// that is not in this list.
// genre: a key of the "genre.*" translations; platforms: "pc" | "ps" | "xbox" | "switch" | "mobile"

export const GENRES = ["shooter", "battle", "moba", "rpg", "action", "sports", "racing", "strategy", "sandbox", "fighting", "platformer", "sim"];
export const PLATFORMS = ["pc", "ps", "xbox", "switch", "mobile"];

export const CATALOG = [
  { id: "cs2", title: "Counter-Strike 2", genre: "shooter", platforms: ["pc"], year: 2023, studio: "Valve" },
  { id: "valorant", title: "Valorant", genre: "shooter", platforms: ["pc", "ps", "xbox"], year: 2020, studio: "Riot Games" },
  { id: "overwatch2", title: "Overwatch 2", genre: "shooter", platforms: ["pc", "ps", "xbox", "switch"], year: 2022, studio: "Blizzard" },
  { id: "apex", title: "Apex Legends", genre: "battle", platforms: ["pc", "ps", "xbox", "switch"], year: 2019, studio: "Respawn" },
  { id: "fortnite", title: "Fortnite", genre: "battle", platforms: ["pc", "ps", "xbox", "switch", "mobile"], year: 2017, studio: "Epic Games" },
  { id: "pubg", title: "PUBG: Battlegrounds", genre: "battle", platforms: ["pc", "ps", "xbox"], year: 2017, studio: "Krafton" },
  { id: "pubgm", title: "PUBG Mobile", genre: "battle", platforms: ["mobile"], year: 2018, studio: "Krafton" },
  { id: "warzone", title: "Call of Duty: Warzone", genre: "battle", platforms: ["pc", "ps", "xbox"], year: 2020, studio: "Activision" },
  { id: "dota2", title: "Dota 2", genre: "moba", platforms: ["pc"], year: 2013, studio: "Valve" },
  { id: "lol", title: "League of Legends", genre: "moba", platforms: ["pc"], year: 2009, studio: "Riot Games" },
  { id: "mlbb", title: "Mobile Legends: Bang Bang", genre: "moba", platforms: ["mobile"], year: 2016, studio: "Moonton" },
  { id: "eldenring", title: "Elden Ring", genre: "rpg", platforms: ["pc", "ps", "xbox"], year: 2022, studio: "FromSoftware" },
  { id: "witcher3", title: "The Witcher 3: Wild Hunt", genre: "rpg", platforms: ["pc", "ps", "xbox", "switch"], year: 2015, studio: "CD Projekt Red" },
  { id: "bg3", title: "Baldur's Gate 3", genre: "rpg", platforms: ["pc", "ps", "xbox"], year: 2023, studio: "Larian Studios" },
  { id: "genshin", title: "Genshin Impact", genre: "rpg", platforms: ["pc", "ps", "mobile"], year: 2020, studio: "HoYoverse" },
  { id: "cyberpunk", title: "Cyberpunk 2077", genre: "rpg", platforms: ["pc", "ps", "xbox"], year: 2020, studio: "CD Projekt Red" },
  { id: "gtav", title: "Grand Theft Auto V", genre: "action", platforms: ["pc", "ps", "xbox"], year: 2013, studio: "Rockstar Games" },
  { id: "rdr2", title: "Red Dead Redemption 2", genre: "action", platforms: ["pc", "ps", "xbox"], year: 2018, studio: "Rockstar Games" },
  { id: "gow", title: "God of War Ragnarök", genre: "action", platforms: ["pc", "ps"], year: 2022, studio: "Santa Monica Studio" },
  { id: "spiderman2", title: "Marvel's Spider-Man 2", genre: "action", platforms: ["ps", "pc"], year: 2023, studio: "Insomniac Games" },
  { id: "eafc", title: "EA Sports FC 25", genre: "sports", platforms: ["pc", "ps", "xbox", "switch"], year: 2024, studio: "EA Sports" },
  { id: "nba2k", title: "NBA 2K25", genre: "sports", platforms: ["pc", "ps", "xbox", "switch"], year: 2024, studio: "Visual Concepts" },
  { id: "rocketleague", title: "Rocket League", genre: "sports", platforms: ["pc", "ps", "xbox", "switch"], year: 2015, studio: "Psyonix" },
  { id: "forza5", title: "Forza Horizon 5", genre: "racing", platforms: ["pc", "xbox", "ps"], year: 2021, studio: "Playground Games" },
  { id: "mk8", title: "Mario Kart 8 Deluxe", genre: "racing", platforms: ["switch"], year: 2017, studio: "Nintendo" },
  { id: "civ6", title: "Sid Meier's Civilization VI", genre: "strategy", platforms: ["pc", "ps", "xbox", "switch", "mobile"], year: 2016, studio: "Firaxis" },
  { id: "aoe2", title: "Age of Empires II: DE", genre: "strategy", platforms: ["pc", "xbox"], year: 2019, studio: "Forgotten Empires" },
  { id: "clash", title: "Clash Royale", genre: "strategy", platforms: ["mobile"], year: 2016, studio: "Supercell" },
  { id: "minecraft", title: "Minecraft", genre: "sandbox", platforms: ["pc", "ps", "xbox", "switch", "mobile"], year: 2011, studio: "Mojang" },
  { id: "roblox", title: "Roblox", genre: "sandbox", platforms: ["pc", "xbox", "ps", "mobile"], year: 2006, studio: "Roblox Corporation" },
  { id: "terraria", title: "Terraria", genre: "sandbox", platforms: ["pc", "ps", "xbox", "switch", "mobile"], year: 2011, studio: "Re-Logic" },
  { id: "tekken8", title: "Tekken 8", genre: "fighting", platforms: ["pc", "ps", "xbox"], year: 2024, studio: "Bandai Namco" },
  { id: "sf6", title: "Street Fighter 6", genre: "fighting", platforms: ["pc", "ps", "xbox"], year: 2023, studio: "Capcom" },
  { id: "hollowknight", title: "Hollow Knight", genre: "platformer", platforms: ["pc", "ps", "xbox", "switch"], year: 2017, studio: "Team Cherry" },
  { id: "celeste", title: "Celeste", genre: "platformer", platforms: ["pc", "ps", "xbox", "switch"], year: 2018, studio: "Maddy Makes Games" },
  { id: "stardew", title: "Stardew Valley", genre: "sim", platforms: ["pc", "ps", "xbox", "switch", "mobile"], year: 2016, studio: "ConcernedApe" },
  { id: "eurotruck", title: "Euro Truck Simulator 2", genre: "sim", platforms: ["pc"], year: 2012, studio: "SCS Software" },
];

export const catalogById = (id) => CATALOG.find((g) => g.id === id) || null;

// Search by title or studio, ignoring case, spaces and punctuation ("cs 2" finds "Counter-Strike 2" via "cs2").
export function searchCatalog(query, { exclude = [] } = {}) {
  const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const q = norm(query);
  return CATALOG.filter((g) => !exclude.includes(g.id))
    .filter((g) => !q || norm(g.title).includes(q) || norm(g.studio).includes(q) || g.id.includes(q))
    .sort((a, b) => {
      // titles that start with the query come first
      const sa = norm(a.title).startsWith(q) ? 0 : 1, sb = norm(b.title).startsWith(q) ? 0 : 1;
      return sa - sb || a.title.localeCompare(b.title);
    });
}
