// Libreria DEMO: 12 videogiochi INVENTATI (nessun gioco, studio o personaggio reale) con arte originale in `public/demo/`.
// Serve per provare il sito senza inserire dati: funziona senza rete e non viene mai salvata sul dispositivo.
// File: NN-cover.webp (copertina, circa quadrata: l'app la adatta) e NN-1…NN-6.webp (screenshot 16:9).
// Per sostituire un'immagine basta rimpiazzare il file con lo stesso nome. Generi in inglese (come i tag di Steam).
const rows = [
  // [n, titolo, anno, studio, generi, minuti giocati, (numero di screenshot, default 6)]
  [1, "Vesperfall", 2021, "Duskwright Games", ["RPG", "Action"], 1860],
  [2, "Halcyon Reach", 2019, "Parallax Harbor", ["Simulation", "Adventure"], 940],
  [3, "Neon Mirage 2089", 2023, "Neonlark Studio", ["Action", "Shooter"], 725],
  [4, "Mossback Meadows", 2022, "Little Kettle", ["Simulation", "Casual"], 3120],
  [5, "Tidebreaker", 2016, "Saltwind Interactive", ["Adventure", "Action"], 2210],
  [6, "Lanternfolk", 2018, "Candlewick Works", ["Platformer", "Indie"], 480],
  [7, "Dustline Rally", 2016, "Redline Mesa", ["Racing", "Sports"], 1305],
  [8, "Hollow Station 9", 2020, "Quietvolt", ["Adventure", "Mystery"], 610],
  [9, "Brickwork Kingdoms", 2018, "Cobblestone Guild", ["Strategy", "Simulation"], 4350],
  [10, "Quill & Cipher", 2024, "Inkwell & Co.", ["Puzzle", "Adventure"], 390],
  [11, "Ironbloom", 2017, "Petalsteel", ["Action", "Shooter"], 1575],
  [12, "Skyfarer's Atlas", 2025, "Cloudloom", ["Adventure", "Open World"], 860],
  [13, "Emberline Express", 2017, "Copperkettle Studio", ["Simulation", "Strategy"], 1420],
  [14, "Saffron Caravan", 2018, "Sandglass Tales", ["Adventure", "Strategy"], 780],
  [15, "Pulse Drifter", 2019, "Neonlark Studio", ["Racing", "Action"], 540],
  [16, "Hexwood Apothecary", 2020, "Candlewick Works", ["Simulation", "Indie"], 1130],
  [17, "Paperfleet", 2020, "Foldwave", ["Strategy", "Casual"], 690],
  [18, "Cogwheel Skies", 2021, "Brassgate Games", ["Adventure", "Action"], 1980],
  [19, "Moonstation Tycoon", 2021, "Little Kettle", ["Simulation", "Strategy"], 2760],
  [20, "Gloamharbor", 2022, "Duskwright Games", ["Mystery", "Adventure"], 920],
  [21, "Powder Peak", 2022, "Saltwind Interactive", ["Sports", "Casual"], 365],
  [22, "Rustwater Reach", 2023, "Parallax Harbor", ["Adventure", "Open World"], 1510],
  [23, "Abyssal Bloom", 2024, "Quietvolt", ["Adventure", "Indie"], 805],
  [24, "Gearhollow Carnival", 2025, "Inkwell & Co.", ["Puzzle", "Indie"], 450],
];

const pad = (n) => String(n).padStart(2, "0");

export const DEMO_GAMES = rows.map(([n, title, year, studio, genres, playtime, shots = 6]) => ({
  id: `demo-${n}`,
  title,
  cover: `/demo/${pad(n)}-cover.webp`,
  playtime, // minuti
  platform: "Demo",
  year,
  genres,
  developers: [studio],
  publishers: [studio],
  screenshots: Array.from({ length: shots }, (_, i) => i + 1).map((k) => ({ thumb: `/demo/${pad(n)}-${k}.webp`, full: `/demo/${pad(n)}-${k}.webp` })),
}));
