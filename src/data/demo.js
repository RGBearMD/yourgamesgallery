// Libreria DEMO: 12 videogiochi INVENTATI (nessun gioco, studio o personaggio reale) con arte originale in `public/demo/`.
// Serve per provare il sito senza inserire dati: funziona senza rete e non viene mai salvata sul dispositivo.
// File: NN-cover.webp (copertina, circa quadrata: l'app la adatta) e NN-1…NN-6.webp (screenshot 16:9).
// Per sostituire un'immagine basta rimpiazzare il file con lo stesso nome. Generi in inglese (come i tag di Steam).
const rows = [
  // [n, titolo, anno, studio, generi, minuti giocati]
  [1, "Vesperfall", 2021, "Duskwright Games", ["RPG", "Action"], 1860],
  [2, "Halcyon Reach", 2019, "Parallax Harbor", ["Simulation", "Adventure"], 940],
  [3, "Neon Mirage 2089", 2023, "Neonlark Studio", ["Action", "Shooter"], 725],
  [4, "Mossback Meadows", 2022, "Little Kettle", ["Simulation", "Casual"], 3120],
  [5, "Tidebreaker", 2016, "Saltwind Interactive", ["Adventure", "Action"], 2210],
  [6, "Lanternfolk", 2018, "Candlewick Works", ["Platformer", "Indie"], 480],
  [7, "Dustline Rally", 2012, "Redline Mesa", ["Racing", "Sports"], 1305],
  [8, "Hollow Station 9", 2020, "Quietvolt", ["Adventure", "Mystery"], 610],
  [9, "Brickwork Kingdoms", 2014, "Cobblestone Guild", ["Strategy", "Simulation"], 4350],
  [10, "Quill & Cipher", 2024, "Inkwell & Co.", ["Puzzle", "Adventure"], 390],
  [11, "Ironbloom", 2010, "Petalsteel", ["Action", "Shooter"], 1575],
  [12, "Skyfarer's Atlas", 2025, "Cloudloom", ["Adventure", "Open World"], 860],
];

const pad = (n) => String(n).padStart(2, "0");

export const DEMO_GAMES = rows.map(([n, title, year, studio, genres, playtime]) => ({
  id: `demo-${n}`,
  title,
  cover: `/demo/${pad(n)}-cover.webp`,
  playtime, // minuti
  platform: "Demo",
  year,
  genres,
  developers: [studio],
  publishers: [studio],
  screenshots: [1, 2, 3, 4, 5, 6].map((k) => ({ thumb: `/demo/${pad(n)}-${k}.webp`, full: `/demo/${pad(n)}-${k}.webp` })),
}));
