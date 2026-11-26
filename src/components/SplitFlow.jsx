import { useEffect, useMemo, useState } from "react";

// Il pannello di destra (screenshot) esiste solo da `sm` in su: su telefono la vista è solo l'elenco a tutto schermo
const WIDE_QUERY = "(min-width: 640px)";
import Cover from "./Cover";
import Thumb, { ThumbSkeleton } from "./Thumb";
import { Icon } from "./Icons";
import { useGameDetails, prefetchDetails, isLandscape, platformName, platformClasses } from "../services/gameData";
import { useFlow } from "../services/useFlow";
import { useI18n } from "../i18n/context";

// Vista «Split» (schermo diviso in 2): a sinistra la lista VERTICALE di copertine in 3D (si scorre con swipe/trascinamento,
// rotella, frecce); a destra titolo, 4 screenshot in griglia 2×2 e, come sfondo in trasparenza, un quinto screenshot grande.
// Nel DOM solo le copertine vicine al centro. Scorrimento e dettagli: `useFlow` (condiviso con il Cover Flow).
const WINDOW = 6;
const HEIGHT = "max(24rem, calc(100dvh - 3.5rem))"; // tutta l'area sotto l'intestazione (h-14); il Dock vi si sovrappone
// Larghezza massima della griglia 2×2 perché stia nell'altezza della vista (16:9, 2 righe, meno titolo e margini)
const GRID_MAX = `max(18rem, calc(((${HEIGHT} - 14rem) / 2) * 1.7778 * 2 + 0.5rem))`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function SplitFlow({ games, meta = {}, focusId, onFocus, onSelect }) {
  const { t } = useI18n();
  const n = games.length;
  const [size, setSize] = useState({ w: 150, h: 400 });
  const [wideScreen, setWideScreen] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const on = () => setWideScreen(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const wide = n ? isLandscape(games[0]) : false; // GOG = copertine orizzontali
  const geo = useMemo(() => {
    let w, h;
    if (wide) { w = Math.min(size.w * 0.86, size.h * 0.4 * (460 / 215)); h = w * (215 / 460); }
    else { h = Math.min(size.h * 0.4, size.w * 0.8 * 1.5); w = h * (2 / 3); }
    return { w, h, gap: h * 0.8, step: h * 0.34 };
  }, [size, wide]);

  const { pos, index, current, active, last, goTo, step, moved, elRef: column, bind } = useFlow({ games, focusId, onFocus, onEnter: onSelect, axis: "y", dragPx: geo.step * 1.6 });

  useEffect(() => {
    const el = column.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [column]);

  const { shots, year: detailYear, loading, failed } = useGameDetails(active, !!active && wideScreen); // su telefono i dettagli non servono (si vedono in «Info»)

  if (!n) return null;
  const items = [];
  for (let i = Math.max(0, index - WINDOW); i <= Math.min(last, index + WINDOW); i++) {
    const g = games[i];
    const d = i - pos, c = clamp(d, -1, 1), a = Math.abs(d);
    const wideItem = isLandscape(g);
    const w = wideItem === wide ? geo.w : wideItem ? geo.h * (460 / 215) * 0.75 : geo.h * 0.75 * (2 / 3); // titoli di tipo diverso: dimensioni di ripiego
    const h = wideItem ? w * (215 / 460) : w * 1.5;
    const y = c * geo.gap + (d - c) * geo.step;
    items.push(
      <button
        key={g.id}
        type="button"
        tabIndex={-1}
        aria-label={g.title}
        onClick={() => { if (moved.current) return; if (i === index) onSelect(g); else goTo(i); }}
        onPointerDown={() => prefetchDetails(g)}
        style={{
          width: w, height: h, left: `calc(50% - ${w / 2}px)`, top: `calc(50% - ${h / 2}px)`,
          transform: `translate3d(0,${y}px,${-Math.abs(c) * 120}px) rotateX(${-c * 48}deg)`,
          opacity: (1 - clamp(a, 0, 1) * 0.3) * (1 - clamp((a - 2) / 3, 0, 1)), // più semitrasparenti quelle lontane
          zIndex: 100 - Math.round(a * 10),
          boxShadow: "0 12px 26px rgba(0,0,0,.55)",
        }}
        className={`absolute select-none overflow-hidden rounded-lg border bg-ink ${i === index ? "border-spark/70" : "border-line/60"}`}
      >
        <Cover game={g} wide={wideItem} width={wideItem ? 560 : 420} />
        {/* le copertine non selezionate sono più scure: l'ombra cresce con la distanza dal centro */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: clamp(a, 0, 1) * 0.6 }} />
      </button>
    );
  }

  const year = meta[current.id]?.y ?? (active?.id === current.id ? detailYear : null);
  const ready = active?.id === current.id && !loading;
  const bg = ready ? (shots[4] ?? shots[0])?.thumb : null; // uno screenshot grande in trasparenza come sfondo
  const arrow = "absolute left-1/2 z-[200] hidden -translate-x-1/2 rounded-full bg-panel/80 p-1.5 text-fog hover:bg-raised disabled:opacity-30 md:block";
  const open = () => onSelect(current);

  return (
    <section
      aria-label={t("split.aria")}
      className="grid w-full grid-cols-1 overflow-hidden bg-ink sm:grid-cols-[30%_1fr]"
      style={{ height: HEIGHT, "--grid-max": GRID_MAX }}
    >
      {/* Sinistra: copertine verticali */}
      <div
        ref={column}
        {...bind}
        style={{ ...bind.style, perspective: "900px" }}
        className="relative touch-none [&_*]:touch-none cursor-grab select-none overflow-hidden bg-gradient-to-r from-panel/70 to-ink outline-none active:cursor-grabbing"
      >
        {items}
        <button type="button" aria-label={t("split.prev")} onClick={() => step(-1)} disabled={index === 0} className={`${arrow} top-10`}><Icon name="prev" className="size-4 rotate-90" /></button>
        <button type="button" aria-label={t("split.next")} onClick={() => step(1)} disabled={index === last} className={`${arrow} bottom-28`}><Icon name="next" className="size-4 rotate-90" /></button>
        <p className="pointer-events-none absolute inset-x-0 top-3 z-[200] text-center text-xs text-fog/80">{t("flow.pos", { i: index + 1, n })}</p>
      </div>

      {/* Destra: titolo + 4 screenshot, sfondo = screenshot grande in trasparenza */}
      <div className="relative hidden min-w-0 overflow-hidden sm:block">
        {bg && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30">{/* l'opacità sta sul contenitore: `animate-fade-in` porta l'immagine a opacity 1 e annullerebbe una classe opacity sull'img */}
              <img key={bg} src={bg} alt="" draggable={false} className="h-full w-full animate-fade-in object-cover" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-ink/60" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          </>
        )}
        <div className="relative z-10 flex h-full flex-col gap-2 p-2.5 sm:gap-4 sm:p-6 sm:pb-28">
          <div className="min-w-0">
            <h3 className="line-clamp-3 font-display text-lg font-bold leading-tight [text-shadow:0_2px_12px_rgba(0,0,0,.8)] sm:line-clamp-2 sm:text-4xl">
              {current.title}{year && <span className="whitespace-nowrap text-spark"> - {year}</span>}
            </h3>
            <span className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${platformClasses(current)}`}>{platformName(current)}</span>
          </div>

          {/* griglia 2×2 centrata (orizzontalmente e verticalmente) nello spazio sotto il titolo */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
            <div
              role="button"
              tabIndex={0}
              aria-label={t("aria.openInfo", { title: current.title })}
              onClick={open}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
              className="mx-auto grid w-full cursor-pointer grid-cols-2 gap-1.5 sm:max-w-[var(--grid-max)] sm:gap-2"
            >
              {!ready
                ? [0, 1, 2, 3].map((i) => <ThumbSkeleton key={i} />)
                : shots.slice(0, 4).map((s, i) => <Thumb key={s.thumb} src={s.thumb} alt={t("aria.shotsOf", { title: current.title, i: i + 1 })} delay={i * 60} eager />)}
            </div>
            {ready && shots.length === 0 && <p className="text-xs text-muted">{failed ? t("strip.failed") : t("strip.none")}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
