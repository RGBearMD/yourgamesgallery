# YGG · Your Games Gallery — contesto per assistenti AI

Leggi questo file **prima** di toccare il codice: descrive cosa fa l'app, com'è fatta, cosa è già stato risolto (e perché), cosa NON è stato verificato e le regole per lavorarci.

- **Sito online:** https://yourgamesgallery.netlify.app/ · **Lingua:** l'utente parla italiano, rispondi in italiano.
- **Scopo (parole dell'autore):** dare una **panoramica immediata dei giochi mostrando già anche gli screenshot**, così una persona si fa un'idea di com'è ogni gioco. Le librerie di solito mostrano solo le copertine, ed è limitante. Tono: «un bellissimo museo digitale della propria collezione». Pensata per **mobile**, installabile (PWA, Android).
- **Creatore:** Massimo D'Ambrogio (titolare nella pagina privacy; manca ancora l'email in `src/privacyConfig.js`).
- **Logo:** `public/logo.webp` (home, con animazione di fluttuazione), `logo-sm.webp` (header), icone app/favicon/og derivate dal file originale dell'utente (`YGGLogoDef1_0.png`, ripulito dalle sbavature).

## 1. Stack e comandi

React 19 · Vite 8 · Tailwind CSS v4 · ESLint 10 (react-hooks 7, react-refresh) · Netlify (hosting + Functions ESM) · font locali `@fontsource` (Chakra Petch + DM Sans, OFL). **Nessun database e nessun archivio sul server.**

```
npm run dev      # sito + funzioni IN LOCALE (plugin in vite.config.js): niente Netlify, niente crediti
npm run build    # vite build (genera anche l'ID di versione del service worker)
npm start        # dopo il build: server Node autonomo (sito + funzioni) su http://localhost:8888 (PORT)
npm run lint     # eslint . (copre anche public/, netlify/, server/). Attualmente PULITO
npm audit        # attualmente 0 vulnerabilità
```
Per provare dal telefono sulla stessa Wi-Fi: `npm run dev -- --host`. **Chiave Steam in locale:** copia `.env.example` in `.env` (stessa cartella di `package.json`, nome esatto `.env`, NON `.env.txt`), scrivi `STEAM_API_KEY=la_chiave` senza spazi e RIAVVIA `npm run dev`: all'avvio il terminale stampa «Steam: chiave API trovata/NON trovata/VUOTA» (legge `.env.local` e `.env`; `.env.example` ha la chiave vuota apposta). Su Netlify la chiave sta in Environment variables e vale dopo un nuovo deploy. Per i test si possono puntare le API a un finto server con `STEAM_API_BASE` e `STEAM_STORE_BASE`, e si può consentire un host di immagini di prova a `img` con `IMG_ALLOW_HOSTS`.

## 2. Struttura (solo file in uso)

```
index.html                       favicon, manifest, anteprima social (og:image con URL ASSOLUTO del sito), preconnect steamstatic
public/                          logo*.webp, og.jpg, favicon-32/48.png, apple-touch-icon.png, icons/ (192, 512, maskable),
                                 manifest.webmanifest, sw.js (service worker), screens/ (3 immagini d'esempio per «Cos'è YGG»)
src/main.jsx · src/index.css     font locali; token colore, keyframes (float, scaleUp, slideUp…), reduced-motion
src/privacyConfig.js             DATI DEL TITOLARE da compilare prima di pubblicare (nome, email, hosting)
src/App.jsx                      stato globale, home, header, filtri, rendering progressivo, modalità vista
src/components/
  GameStrip.jsx                  Lista. **GOG** (copertina ORIZZONTALE): riga in alto = copertina (112px) + «Titolo - anno», sotto 3 screenshot a tutta larghezza. **Steam** (copertina verticale): copertina piccola (56px) a sinistra; accanto «Titolo - anno» e sotto 2 screenshot. Miniature = formato MEDIO (Steam 600x338, GOG ggvgm). TUTTA la scheda apre «Info»
  GameGrid.jsx                   Cards (usata anche dalla Timeline). **Steam/Epic:** copertina 2:3 con titolo/anno/ore in sovraimpressione (2–6 colonne). **GOG:** copertina ORIZZONTALE (460/215) con titolo e anno SOTTO (2–5 colonne, mai verticale). Con il filtro «giochi doppi» mostra «Anche su …»
  GameModal.jsx                  «Info»: titolo «Titolo - anno», badge piattaforma cliccabile (→ pagina Steam/GOG), ore giocate e **6 screenshot** (2 colonne×3 righe su mobile, 3×2 su desktop); NESSUN riquadro di dettagli (multiplayer ecc. rimossi); click su uno screenshot → Lightbox
  Timeline.jsx                   modalità Timeline: istogramma + slider anno min→max + giochi di quell'anno, ← →
  FilterSheet.jsx                pannello «Filtra» (bottom sheet): generi con conteggi + avanzamento analisi
  GameIndex.jsx                  drawer ☰: lista ALFABETICA con ricerca, Scarica lista, Installa, Ko-fi, Privacy e, IN FONDO, «Torna alla home» (logo)
  LibrarySwitch.jsx              finestra «Le tue librerie»: passa da una libreria salvata all'altra (si apre dal pulsante in header, visibile solo con 2+ librerie) + «Aggiungi o gestisci librerie» (→ home)
  CoverFlow.jsx                  vista «Cover Flow»: metà alta = copertine 3D che si scorrono (trascinamento con inerzia, rotella/trackpad orizzontale, frecce, ◀ ▶ su PC, tocco su una laterale = la porta al centro); metà bassa = «Titolo - anno» + 2 screenshot (affiancati, formato medio). Tocco su copertina centrale/screenshot = «Info». Nel DOM solo ±6 copertine (WINDOW), posizione con decimali animata via rAF (con «riduci animazioni» salta direttamente). I dettagli si chiedono solo a copertina ferma (200 ms) + prefetch dei 2 vicini. Il gioco al centro è ricordato in App (`flowId`) e il menu ☰ può spostarlo
  SplitFlow.jsx                  vista «Split» (schermo diviso, `viewMode "split"`): OCCUPA TUTTA L'AREA sotto l'intestazione (il Dock vi sta sopra, senza la riga «n giochi…»). **Telefono (<640px): solo l'elenco verticale a tutto schermo** (nessun pannello a destra, nessuna richiesta di dettagli: gli screenshot si vedono in «Info»). Da `sm`: a SINISTRA (30%) lista VERTICALE di copertine 3D (rotateX, swipe/trascinamento anche tenendo premuto, rotella, frecce); le non selezionate sono scurite e semitrasparenti in base alla distanza; a DESTRA «Titolo - anno» + badge piattaforma, 4 screenshot in griglia 2×2 e, sfondo, il 5° screenshot in trasparenza (35%). Tocco su copertina centrale/screenshot = «Info». Condivide con il Cover Flow il gioco al centro (`flowId` in App)
  data/demo.js · public/demo/    libreria DEMO («Prova la demo» in home): 12 giochi INVENTATI con arte originale (`NN-cover.webp` + `NN-1…6.webp`; per cambiare un'immagine basta sostituire il file con lo stesso nome). `platform:"Demo"`, dati (anno, generi, studio, screenshot) dentro il gioco: NESSUNA richiesta di rete (`fetchDetails` e `useMeta` la saltano), immagini anche offline (`sw.js` mette in cache `/demo/`). Stato `demo` in `App.jsx`: solo in memoria, MAI in `localStorage` né mescolata alle librerie salvate; pulsante «Demo ✕» in header per uscire; `libPlatform` = "demo" (voci `NAME`/`DOT`). `isLandscape` è falso per la demo
  Updates.jsx · data/updates.js  pagina «Aggiornamenti» (route `#updates`, come `#privacy`): cronologia dalla più recente da `src/data/updates.js` (date ISO, voci in italiano). Link da menu ☰, fondo della home e dall'etichetta versione. **Per ogni rilascio aggiungere un oggetto IN CIMA a `UPDATES`**
  Dock.jsx                       7 tasti quadrati fissi in basso: Strip, Cards, Cover Flow, Split, Filtra, Linea del tempo (EN: Timeline), Random
  About.jsx                      «Cos'è YGG» con 3 screenshot d'esempio (GIOCHI FITTIZI con arte originale: nessuna immagine di giochi reali)
  KofiButton.jsx                 pulsante Ko-fi con icona SVG incorporata (nessuna richiesta esterna finché non lo tocchi)
  (src/services/useFlow.js: logica condivisa di Cover Flow e Split: posizione con decimali, animazione, trascinamento con inerzia, rotella, tasti, `focusId`, dettagli solo a copertina ferma. Una sola implementazione: non duplicarla)
  Thumb.jsx · Lightbox.jsx       miniatura con dissolvenza al caricamento; ingrandimento
  Cover.jsx                      copertina con catena di ripiego: versione ridimensionata (`img`, se `width`) → originale → immagine orizzontale → nascosta
  Icons.jsx · Sentinel.jsx
  PublicProfileHelpModal.jsx     guida: come rendere pubblici GOG / «Dettagli dei giochi» di Steam
  Privacy.jsx                    pagina «Privacy e trasparenza» (route `#privacy`, senza router) + «Cancella i dati salvati»
src/services/
  gameData.js                    helper (isSteam, coverUrl, storeUrl, hoursPlayed, normalizeSteamGame) + fetchDetails/useGameDetails (screenshot+anno): cache, coda max 3 chiamate, richieste UNITE (6 giochi Steam / 4 GOG per chiamata), un secondo tentativo, `failed` se il server non risponde
  meta.js                        useMeta: anno + generi di tutta la libreria in background (50 giochi Steam per richiesta)
  steamProfile.js · gogApi.js    import libreria Steam (da profilo) / GOG (username)
  epicImport.js                  Epic: parseEpicFile (JSON Legendary/Heroic, CSV/TSV, elenco di titoli), matchEpicTitles (chiama `epicMatch`), buildEpicGames
  titles.js                      normalizeTitle: UNICA chiave di confronto tra titoli (client e funzioni): senza maiuscole/accenti/™®/punteggiatura/apostrofi, senza «The» e diciture di edizione, numero romano finale → cifra
  viewport.js · install.js · scroll.js
netlify/functions/               TUTTE nella forma standard `export default async (Request) => Response`
  gog.js                         proxy di gog.com/u/{user}/games/stats
  steamLibrary.js                POST {profile} → libreria Steam (GetOwnedGames, serve STEAM_API_KEY e «Dettagli dei giochi» pubblici). Codici: no_key 501, invalid 400, not_found 404, private 403
  fetchSteamDetails.js           ?appIds=620,730 (max 8) → { items: { id: {screenshots[≤6 {thumb,full}], year}|null }, rateLimited } (appdetails: screenshots, release_date)
  gameDetails.js                 ?ids=… (GOG, max 6) → { items: { id: {screenshots[≤6 {thumb,full}], year: null}|null } }. thumb=ggvgm (lista e Info), full=ggvgl (solo ingrandimento). L'ANNO NON si legge qui (vedi «Anno» sotto)
  img.js                         ?u=<url>&w=<px> → WebP ridimensionato (sharp) delle copertine; accetta solo host GOG/Steam (+ `IMG_ALLOW_HOSTS` nei test), max 12 MB, larghezza 64–800, cache lunga. Se fallisce il client ripiega sull'originale
netlify.toml                     solo `[functions]`: `external_node_modules = ["sharp"]`
  fetchMeta.js                   ?ids=steam-620,… → { meta: { id: {g: generi, y: anno}|null }, rateLimited, mode }. Steam: IStoreBrowseService (batch, tag community, data uscita) con ripiego su appdetails; GOG: v2 per gioco
  epicMatch.js                   POST {titles ≤10} → { matches: {titolo: appId|null} } cercando nel catalogo Steam (`storesearch`) con corrispondenza ESATTA dopo normalizzazione (meglio nessuna scheda che una sbagliata)
server/functions.js · index.js   adattatore che esegue le funzioni fuori da Netlify; server Node autonomo (carica .env)
```

## 3. Modello dati e flussi

**Gioco:** `{ id, title, cover, playtime (MINUTI), platform: "GOG"|"Steam", appId?, url? }`. Id Steam = `"steam-<appId>"`; id GOG = numero; `url` GOG = pagina dello store.

**localStorage:** `ygg:accounts:v1` (librerie salvate: `{ last, gog:{id,games,savedAt,source}, steam:{…}, epic:{…} }`; l'app si riapre su `last`; NON c'è più il pulsante «Cambia»: si cambia libreria dal pulsante in header (2+ librerie) o tornando alla home dal LOGO; `navigator.storage.persist()` richiesto) · `ygg:details:v3:<id>` (screenshot+anno) · `ygg:meta:v1` (anno+generi). Chiavi vecchie vengono migrate o rimosse da sole.

**Import:** GOG = username (libreria pubblica). Steam = link/nome/SteamID → `steamLibrary` (l'utente imposta «Dettagli dei giochi» su Pubblico; dopo l'import può rimetterli privati). **Epic = file**: Epic NON ha un'API pubblica per la libreria; YGG non gestisce MAI credenziali Epic. L'utente esporta con Legendary (`legendary list --json`/`--csv`) o Heroic, oppure scrive un elenco di titoli; `parseEpicFile` legge il file (DLC e Unreal Engine esclusi, copertine solo `https`), `epicMatch` cerca ogni titolo nel catalogo Steam: se coincide il gioco diventa `{id:"steam-<appId>", appId, platform:"Epic"}` (quindi dati, copertina verticale, screenshot e generi di Steam), altrimenti è «solo-Epic» (`id epic-<nome>`, scheda con iniziale, nessun dettaglio: `isEpicOnly`, escluso da `useMeta` e `fetchDetails`). Link «Epic ↗» = ricerca sullo store Epic. Rimossi nel giro 7: script JS, file `steam_games.json`, codice di trasferimento.

**Giochi doppi:** `dupOf` in `App.jsx` confronta (solo sul dispositivo) i titoli normalizzati della libreria aperta con quelle salvate; filtro nel pannello «Filtra» (richiede 2+ librerie), si combina col genere; il badge «Anche su …» si vede solo in quella vista. Limite: il confronto è per titolo, quindi edizioni molto diverse o titoli tradotti non coincidono.

**Dettagli di un gioco:** `fetchDetails` (una sola implementazione, in `gameData.js`). Le richieste di più giochi vicini nel tempo (40 ms) sono UNITE in una chiamata (gruppi da 6 Steam / 4 GOG), max 3 chiamate insieme, un secondo tentativo dopo 1,5 s; risultati vuoti non memorizzati. Strip: richiesta solo per le righe vicine allo schermo (`useNearViewport`, margine 900px). Le miniature sono formati medi (Steam `600x338`, GOG `ggvgm`: il formato piccolo `ggvgt` era TROPPO sfocato e non si usa); l'alta definizione (`full`) si scarica SOLO all'ingrandimento.

**Copertine:** nelle liste passano dalla funzione `img` (Strip: Steam 168px, GOG 336px; Cards/Timeline: 420px) perché gli originali sono grandi (GOG: indirizzo grezzo `item.game.image`, formato non verificato). Misurato col mock: 678 KB → 17 KB. Le copertine hanno `fetchPriority="low"` nella Strip per lasciare banda agli screenshot.

**Anno (REGOLA):** una sola fonte per gioco, `useMeta` (`fetchMeta`); i dettagli (`year`) valgono solo come ripiego quando manca (Strip: `meta ?? dettagli`; Modal: `metaYear ?? year`). Motivo: GOG `release_date` = uscita su GOG (es. 2009), non quella originale (1998): lista e Info mostravano anni diversi.

**Anno e generi (`useMeta`):** 50 giochi Steam per richiesta (GOG 6), pausa 1,2 s; se `mode:"single"` (ripiego lento) scende a 4 ogni 5 s; backoff 90 s se Steam limita. Misurato col mock: 332 giochi in ~8 s. `GENRE_TAGS` in `fetchMeta.js` tiene solo i tag che sono generi. L'anno alimenta Strip/Cards/Timeline.


**Rendering:** progressivo (`STEP = 24`, `Sentinel`); `jumpTo` (menu ☰) allarga la lista con `flushSync`. Strip/Cards in modalità Timeline mostrano solo i giochi dell'anno.

**PWA:** manifest + icone (anche maskable) + `sw.js` (solo pagina e `/assets/*`; non tocca `/.netlify/*` né immagini Steam/GOG; ID di versione sostituito a ogni build in `vite.config.js`). Pulsante «Installa l'app» da `beforeinstallprompt`.

## 4. Cronologia (sintesi)

- **Giri 1–2:** UI da zero (palette ink/spark, Chakra Petch+DM Sans), un solo servizio per gli screenshot (prima 3 implementazioni, il Modal ignorava i dati scaricati perché `[]` è truthy), immagini leggere (thumb/full), rendering progressivo, hamburger alfabetico, Dock fisso, privacy di base.
- **Giro 3–4:** rimossi file inutili e `cheerio`; funzioni eseguibili in locale e su server Node (`npm run dev`/`npm start`) per non dipendere da Netlify (crediti: piano gratuito 300/mese, 15 per deploy di produzione → sviluppare in locale, un deploy per lotto).
- **Giro 5:** font locali, pagina privacy, PWA.
- **Giro 6:** analisi generi da minuti a ~8 s (batch Steam + tag), pannello «Filtra», multi-account salvati, Steam da profilo.
- **Giro 7:** `npm audit fix` (0 vulnerabilità; il `package-lock.json` consegnato è già corretto: copiarlo sul progetto evita che gli avvisi tornino); rimossi codice temporaneo e script JS; Timeline; copy da «museo digitale»; sezione «Cos'è YGG» con screenshot d'esempio; pulsante **Ko-fi** (menu ☰ e home; la promessa sulle donazioni è stata RIMOSSA nel giro 10); rimosso il toggle «Mock»; nuovo logo (home con fluttuazione, header, icone, favicon, og:image).
- **Giro 8:** formato «Titolo - anno»; Info con 6 screenshot e senza scheda dettagli (multiplayer e `gamePlayers`/PCGamingWiki RIMOSSI); layout lista diverso per GOG (copertina orizzontale + 3 screenshot) e Steam (copertina più piccola + 2); velocità: richieste unite, anticipo 900px, retry, copertine a bassa priorità; testi sullo scopo di YGG; creatore nei crediti e nella privacy.
- **Giro 9:** miniature GOG di nuovo medie (`tiny` rimosso); Cards e Timeline GOG con copertine ORIZZONTALI; funzione `img` che ridimensiona le copertine (Steam e GOG); anno unico lista/Info (regola sopra); diagnostica della chiave Steam in locale (messaggio all'avvio, `.env.local`, avviso `.env.txt`, errore esplicito in sviluppo).
- **Giro 10:** home su PC: galleria «Cos'è YGG» in 3 colonne senza slider (resta slider sul telefono); header: titolo più piccolo, logo cliccabile = torna alla home, pulsante di cambio libreria con finestra delle opzioni (solo con 2+ librerie), rimosso il pulsante «Cambia»; «Torna alla home» in fondo al menu ☰; RIMOSSA la frase sulle donazioni (resta solo il pulsante Ko-fi: non promettere percentuali finché la gestione non è definita); filtro «Giochi doppi»; terza piattaforma **Epic** (import da file, vedi sopra); anni validi solo dal 1980 (un'epoca zero «1970» non deve comparire).

## 4c. Giro 11 (multilingua e rifiniture)

- **Multilingua IT/EN** senza librerie: `src/i18n/` (`it.js`, `en.js` con chiavi IDENTICHE, `privacy.js` con il testo legale, `context.js`, `I18nProvider.jsx`). Lingua: scelta salvata in `ygg:lang`, altrimenti italiano se `navigator.language` è italiano, inglese negli altri casi. Selettore `LangToggle` (header della home, pagina privacy, menu ☰). **REGOLA:** nessun testo fisso nei componenti: si usa `t("chiave", {vars})`; plurale singolare con chiave `.one` e variabile `n`; date e numeri con `locale`; i servizi lanciano `i18nError("err.…")` (l'errore mostrato cambia lingua con il sito). Per aggiungere una lingua: nuovo file con le stesse chiavi + voce in `I18nProvider` e `privacy.js`. Controllo consigliato prima di consegnare: ogni chiave usata nel codice deve esistere in IT ed EN (le traduzioni inglesi non sono state riviste da un madrelingua).
- **Home:** nuovo testo (h2, paragrafo, slogan), «Cos'è YGG» con **6 box con icona** (griglia 2 colonne) e 3 screenshot d'esempio per lingua (`public/screens/*.webp` e `*-en.webp`, giochi e studi FITTIZI); galleria in 3 colonne senza slider su PC; pulsante **Ko-fi fisso in basso a destra** solo nella home (nel menu ☰ resta quello a tutta larghezza).
- **Header** allineato al contenitore: nella Strip su desktop ☰, titolo, pulsante libreria e «n. giochi» sono allineati al `max-w-4xl` della lista; nelle altre viste a `max-w-[1560px]`.
- **Info:** sotto il titolo compare «Sviluppatore / Editore» (Steam `appdetails` `developers`/`publishers`; GOG API v2 `_embedded.developers`/`publisher`, chiamata in `gameDetails.js`); cache dettagli `ygg:details:v4`.
- **Dock:** «Casual» → **«Random»**; click → `Dice` (dado neon in CSS, ~1 s in loop, poi si apre il gioco; con «riduci animazioni» attesa breve e dado fermo). Il video dell'utente è stato solo riferimento (non incluso).
- **Epic:** nuovo metodo dalla pagina Acquisti di Epic con `public/epic-purchases.js` (console del browser, desktop): scorre da sola le pagine con `#next-btn`, legge SOLO i titoli (terza cella, testi «foglia»), esclude i rimborsati, scarica `epic_games.json` (`[{app_title}]`, già compatibile con `parseEpicFile`). Verificato su una pagina di prova con la STESSA struttura dell'HTML fornito dall'utente, NON sulla pagina reale di Epic (le classi cambiano: lo script usa struttura e id, non le classi).
- NON verificato con servizi reali: `developers`/`publishers` di Steam e GOG v2, pagina Acquisti reale di Epic, qualità delle traduzioni inglesi.

- **Giro 12:** (1) con «riduci animazioni» attivo nel sistema TUTTE le animazioni erano spente (anche dado e logo): ora il dado gira sempre (risposta a un tocco, 1 s) e il logo fluttua in modo leggero (4px, 9 s); il resto resta fermo. Provare sempre con `reduced_motion="reduce"` in Playwright. (2) Lista in ORDINE ALFABETICO (`Intl.Collator` con numeri naturali, senza punteggiatura, «The» iniziale ignorato), con etichetta «A–Z» nel conteggio. (3) `NoticeBar`: avviso informativo una tantum («nessun cookie, nessun tracciamento»), NON un banner di consenso: il sito non scrive cookie né usa tracker, e le linee guida del Garante (2021) non richiedono consenso per strumenti tecnici; se si aggiungono statistiche, pubblicità o strumenti di terzi, serve un vero consenso preventivo.

## 4d. Giro 13

- Nuova vista **Cover Flow** (`CoverFlow.jsx`, `viewMode "flow"`, tasto nel Dock; chiavi i18n `dock.flow*`, `flow.*` in IT ed EN). Altezza `max(26rem, 100dvh − 12.75rem)` divisa a metà; `SHOT_MAX` tiene gli screenshot dentro la metà bassa. Copertine: Steam/Epic verticali (420px), GOG orizzontali (560px) tramite `Cover`/`img`. **Mobile (<640px):** titolo centrato sopra la copertina (1,5rem), «n di N» centrato sotto, screenshot UNO SOTTO L'ALTRO a larghezza piena (la pagina scorre); su PC titolo+contatore nella riga sotto e screenshot affiancati. Uno screenshot (il 3°, altrimenti il 1°) fa da sfondo trasparente (opacity 30%) dietro alla copertina. Lo swipe parte anche da dito/mouse premuto sulla copertina: `draggable={false}` in `Cover`, `dragstart` e `contextmenu` bloccati nel contenitore (altrimenti il browser avvia il trascinamento nativo dell'immagine o il menu di pressione lunga). Verificato con Playwright (mobile 390 e desktop 1280, dati e immagini finti): trascinamento, «n di N», apertura di «Info». NON verificato: dispositivo touch reale, prestazioni con copertine reali, lettura con screen reader.

## 4e. Versione e repository

- Repository ricreato per la 3ª volta (la precedente aveva ~57 commit): la storia riparte da zero, quindi la versione dell'app è indipendente dal numero di commit. **Versione = campo `version` di `package.json`** (ora `3.0.0`; tenere uguale anche in `package-lock.json`), mostrata in piccolo in basso a destra da `VersionTag.jsx` (iniettata in `vite.config.js` come `import.meta.env.VITE_APP_VERSION`; su Netlify il tooltip mostra anche il commit, da `COMMIT_REF`). Per rilasciare: `npm version minor|patch --no-git-tag-version` e poi commit.
- **SEGRETI:** la chiave Steam va SOLO in `.env` (con il punto, ignorato da git) in locale e nelle Environment variables su Netlify. Un file chiamato `env` (senza punto) era stato committato con la chiave e ha bloccato il deploy (secrets scanning di Netlify): ora `env` è nel `.gitignore`. Prima del primo commit controllare con `git status` che non compaiano file con chiavi.

## 4f. Giro 14

- Nuova vista **Split** (`SplitFlow.jsx`) e hook condiviso `useFlow` (anche `CoverFlow` ora lo usa: stesso comportamento di prima). Dock a 7 tasti: su mobile 2,6rem l'uno, etichette 9px (sotto i 360px di larghezza è al limite: non aggiungere altri tasti). Pagina **Aggiornamenti** (`#updates`). Versione `3.1.0`. Chiavi i18n nuove: `dock.split*`, `split.*`, `updates.*` (IT ed EN identiche). Verificato con Playwright (mobile 390 / desktop 1280, dati finti): drag con pressione prolungata (mouse e touch via CDP), rotella, apertura «Info», pagina aggiornamenti. NON verificato: dispositivo touch reale, copertine/screenshot reali, GOG (copertine orizzontali) nella vista Split.

- **Giro 14b:** Split a tutto schermo e solo-elenco su telefono; copertine non selezionate più scure; Cover Flow: riga «n giochi · piattaforma · A–Z» piccola e CENTRATA in alto (prop `topLine`, creata da `topRow()` in `App.jsx`) e anno SOTTO il titolo (a capo, non più «Titolo - anno»); nelle viste flow/split la riga normale non c'è più. `npm audit fix` eseguito (0 vulnerabilità; minimatch aggiornato).

- **Giro 14c:** BUG corretto: `useEffect(() => window.scrollTo(0, 0), [])` restituiva a React la Promise di `scrollTo` (browser recenti) → «destroy is not a function» e pagina bianca in dev su `#updates`/`#privacy`: scrivere SEMPRE `useEffect(() => { window.scrollTo(0, 0); }, [])`. Cover Flow: tolta la riga «n giochi…» in alto (il titolo parte sotto la barra del menu), fondo scuro, screenshot di sfondo al 30% (nessun overlay puntinato: provato e tolto); copertine non selezionate più scure come in Split. Split: sfondo destro più scuro (stessa opacità), griglia 2×2 centrata (orizzontale e verticale).

- **TRAPPOLA `animate-fade-in`:** il keyframe usa `both`, quindi a fine animazione l'elemento torna a `opacity: 1` e annulla qualunque classe `opacity-*` messa sullo STESSO elemento. Per un'immagine semitrasparente con dissolvenza: opacità sul contenitore, `animate-fade-in` sull'`<img>` interna (così lo sfondo di Cover Flow e Split).

- **Giro 15:** passando a Cover Flow/Split la pagina torna in cima (`useEffect` su `viewMode` in `App.jsx`). Pannello «Filtra»: in cima il pulsante evidenziato «Togli filtri» (`filter.all`, prop `onClear` → `clearFilters`: toglie genere E «giochi doppi»), prima era il chip «Tutti i giochi» in fondo alla lista dei generi.

- **Giro 16 (demo):** pulsante «Prova la demo» (+ riga «Senza account e senza dati…») in home sotto lo slogan, evidenziato (bordo giallo). Immagini ricavate dai fogli generati dall'utente (ritaglio automatico con soglia sulla cornice scura #111; screenshot centrati 16:9 a 640×360 WebP, copertine intere ~720px di larghezza). NOTE: le copertine sono quasi QUADRATE (non 2:3: l'app le adatta con `object-cover` e taglia i lati) e 7 hanno il titolo disegnato nell'immagine (Mossback Meadows, Tidebreaker, Lanternfolk, Dustline Rally, Quill & Cipher, Ironbloom, Skyfarer's Atlas): nelle Cards si tagliano ai lati. Gli screenshot dei giochi 1 e 2 vengono da celle verticali (ritaglio 16:9 a bassa risoluzione): da rigenerare in 16:9. Versione `3.2.0`.
- **Giro 17 (demo ampliata):** 24 giochi demo (id `demo-1…24`, file `public/demo/NN-cover.webp` + `NN-1…6.webp`). I giochi 13–24 hanno copertine 848×1264 (2:3, ridotte a 600px) e fogli 2×3 ritagliati a 640×360; per i fogli 20 e 23 (scene scure) la griglia si rileva con deviazione standard bassa invece della soglia di luminosità. La copertina 19 ha il titolo disegnato. Timeline: 2–3 giochi per anno 2016–2025. Versione `3.3.0`.

## 5. Convenzioni di design

- **Token** (`index.css`, `@theme`): `ink #13111d`, `panel`, `raised`, `line`, `fog`, `muted`, `gog #a78bfa`, `steam #38bdf8`, `spark #ffb547` (accento). Font display Chakra Petch, testo DM Sans.
- **Trappola Tailwind v4:** il CSS non «in layer» batte le utility → stili globali SOLO in `@layer base`.
- **Niente `backdrop-blur`** su elementi persistenti (pesa su mobile). Animazioni solo `transform`/`opacity`. `prefers-reduced-motion` gestito in `index.css` (le animazioni infinite come `animate-float` sono disattivate).
- **Lint React 19:** niente `setState` sincrono nel corpo di un effect (derivare lo stato o usare `key`); i file di componenti esportano solo componenti.
- Targhetta museo: titolo + anno in `text-spark`; schede cliccabili per intero (`role="button"`, tastiera ok, nessun pulsante annidato).

## 6. Verificato e NON verificato

**Verificato** (Playwright/Chromium mobile e desktop, contro un FINTO server Steam): build, lint, audit; home (logo animato, scopo, About con 3 immagini, Ko-fi, «creato da»); import Steam da profilo; lista Steam e GOG (posizioni di copertina, titolo, miniature; formato «Titolo - anno»); nessun file `1920x1080`/`ggvgl` scaricato nella lista, solo all'ingrandimento; Info (6 screenshot, griglia 2×3/3×2, badge verso lo store, Lightbox); richieste unite (12 giochi → 2 chiamate); messaggio d'errore; Timeline; Dock; menu ☰; produzione: installabilità, icone, nessuna richiesta esterna al caricamento, offline.

**NON verificato con i servizi reali** (nessun accesso di rete dal sandbox): formato di `IStoreBrowseService/GetItems`, `/tagdata/populartags/english`, `appdetails`, `GetOwnedGames`, anno e tag GOG, formati `ggvgm`/`ggvgl`, `game.url` di GOG, formato reale dell'indirizzo delle copertine GOG, `sharp` su Netlify, **l'API `storesearch` di Steam (Epic)** e **i formati reali dei file di Legendary/Heroic** (il parser è tollerante e provato su campioni sintetici dei 4 formati: JSON array, `{library:[…]}`, CSV/TSV, elenco semplice); **la velocità in produzione non è stata misurata**; installazione su un telefono Android vero; testo privacy (revisione legale). Se l'anno non compare per tutti i giochi, il primo sospetto è `release` in `fetchMeta.js`.

## 7. Limiti noti e backlog

- Steam limita le richieste (~200/5 min, non ufficiale); l'anno/genere di un gioco che non risponde resta vuoto (la Timeline mostra quanti giochi sono senza anno).
- Importazione Steam impossibile con «Dettagli dei giochi» privati.
- Epic: nessuna libreria diretta (serve un file esportato con Legendary/Heroic); i giochi che esistono solo su Epic non hanno copertina, screenshot, anno né generi (solo titolo), e non compaiono nella Timeline.
- Offline: la libreria si riapre ma copertine e screenshot (Steam/GOG) richiedono la rete.
- La frase «condivisibile e offline» NON è ancora vera: condividere (link/esportazione) e salvare le immagini offline non esistono.
- Backlog: virtualizzazione per librerie enormi, ordinamenti, sfondo del Modal dal colore dominante, tema chiaro, conferma su «Cambia», `netlify.toml` con cache lunga su `/assets/*`, sostituire il `README.md` (è il testo del template Vite).

## 8. Regole di lavoro

1. Leggi i file coinvolti; non riscrivere ciò che funziona. Una sola implementazione per cosa (dettagli solo in `gameData.js`).
2. Formato risposta delle funzioni di dettaglio: `{ screenshots:[{thumb,full}], year, local, online }`. Non cambiarlo senza aggiornare `gameData.js`.
3. Dopo ogni modifica: `npm run lint`, `npm run build`, `npm audit`. Prova in locale (`npm run dev`) con viewport mobile; niente deploy di produzione per ogni prova.
4. Non scrivere testi fissi nei componenti (usa `t()` e aggiorna ENTRAMBI i dizionari). Non reintrodurre `backdrop-blur` persistente, immagini `full` o originali non ridimensionati nelle liste, liste intere nel DOM, copertine GOG verticali, un secondo calcolo dell'anno diverso da `useMeta`, un secondo modo di confrontare i titoli diverso da `normalizeTitle`, accesso alle credenziali Epic/Steam/GOG, richieste a servizi esterni dal browser (font, icone) senza aggiornare la pagina privacy.
5. Se cambi cosa viene raccolto/inviato, aggiorna `Privacy.jsx` e questo file. Compila `src/privacyConfig.js` prima di pubblicare.
6. Dichiara cosa non hai potuto testare (API reali).
7. **Consegna:** zip con i file **alla radice** (niente cartella contenitore), senza `node_modules`, `dist`, `.env`, file `*.zip`, backup o file inutilizzati. Includi sempre il `package-lock.json` aggiornato.
8. Test: chiudere i server per PORTA (`fuser` non esiste nel sandbox: i server restano accesi tra un comando e l'altro) e fare un warm-up della prima chiamata a una funzione.
9. Avvisi Git «LF will be replaced by CRLF» su Windows: innocui.
