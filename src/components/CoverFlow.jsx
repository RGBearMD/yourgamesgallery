import { useEffect, useMemo, useState } from "react";
import Cover from "./Cover";
import Thumb, { ThumbSkeleton } from "./Thumb";
import { Icon } from "./Icons";
import { useGameDetails, prefetchDetails, isLandscape } from "../services/gameData";
import { useFlow } from "../services/useFlow";
import { useI18n } from "../i18n/context";

// Cover Flow: metà alta = copertine in 3D che si scorrono (trascinando, con rotella, frecce o tasti);
// metà bassa = titolo + 2 screenshot del gioco al centro. Tocco sulla copertina centrale (o sul titolo/screenshot) = «Info».
// Nel DOM ci sono sempre solo le copertine vicine al centro (WINDOW per lato), mai la lista intera.
// Scorrimento, trascinamento e dettagli: `useFlow` (condiviso con la vista Split).
const WINDOW = 6;
// Larghezza massima di uno screenshot: lo fa stare nella metà bassa (altezza della sezione / 2 − riga del titolo), in 16:9
const SHOT_MAX = "calc((max(26rem, 100dvh - 8.25rem) / 2 - 4.4rem) * 1.7778)";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function CoverFlow({ games, meta = {}, focusId, onFocus, onSelect }) {
  const { t } = useI18n();
  const n = games.length;

  const [size, setSize] = useState({ w: 360, h: 300 });
  // Geometria: dimensioni delle copertine in base all'area disponibile
  const wide = games.length ? isLandscape(games[0]) : false; // GOG = orizzontale
  const geo = useMemo(() => {
    const maxH = size.h * 0.8;
    let w, h;
    if (wide) { w = Math.min(size.w * 0.6, maxH * (460 / 215)); h = w * (215 / 460); }
    else { h = Math.min(maxH, size.w * 0.55 * 1.5); w = h * (2 / 3); }
    return { w, h, gap: w * 0.64, step: w * 0.26 };
  }, [size, wide]);

  const { pos, index, current, active, last, goTo, step, moved, elRef: stage, bind } = useFlow({ games, focusId, onFocus, onEnter: onSelect, axis: "x", dragPx: geo.step * 1.6 });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage]);

  const { shots, year: detailYear, loading, failed } = useGameDetails(active, !!active);

  if (!n) return null;
  const items = [];
  for (let i = Math.max(0, index - WINDOW); i <= Math.min(last, index + WINDOW); i++) {
    const g = games[i];
    const d = i - pos, c = clamp(d, -1, 1), a = Math.abs(d);
    const wideItem = isLandscape(g);
    const w = wideItem === wide ? geo.w : wideItem ? geo.h * (460 / 215) * 0.75 : geo.h * 0.75 * (2 / 3); // titoli di tipo diverso: dimensioni di ripiego
    const h = wideItem ? w * (215 / 460) : w * 1.5;
    const x = c * geo.gap + (d - c) * geo.step;
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
          transform: `translate3d(${x}px,0,${-Math.abs(c) * 150}px) rotateY(${-c * 58}deg)`,
          opacity: 1 - clamp((a - 3) / 3, 0, 1),
          zIndex: 100 - Math.round(a * 10),
          boxShadow: "0 14px 30px rgba(0,0,0,.55)",
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
  const open = () => onSelect(current);
  const arrow = "absolute top-1/2 z-[200] hidden -translate-y-1/2 rounded-full bg-panel/80 p-2 text-fog hover:bg-raised disabled:opacity-30 md:block";
  const ready = active?.id === current.id && !loading;
  const bg = ready ? (shots[2] ?? shots[0])?.thumb : null; // uno screenshot in trasparenza dietro alla copertina
  const shotCell = "w-full sm:w-[calc(50%-4px)] sm:max-w-[var(--shot-max)]";

  return (
    <section aria-label={t("flow.aria")} className="mx-auto flex w-full max-w-5xl flex-col sm:h-[max(26rem,calc(100dvh-8.25rem))]" style={{ "--shot-max": SHOT_MAX }}>
      <div
        {...bind}
        className="relative flex touch-none [&_*]:touch-none h-[58dvh] min-h-[26rem] cursor-grab select-none flex-col overflow-hidden rounded-2xl bg-ink outline-none active:cursor-grabbing sm:h-auto sm:min-h-0 sm:flex-1"
      >
        {bg && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30">{/* l'opacità sta sul contenitore: `animate-fade-in` porta l'immagine a opacity 1 e annullerebbe una classe opacity sull'img */}
              <img key={bg} src={bg} alt="" draggable={false} className="h-full w-full animate-fade-in object-cover" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/85" />
          </>
        )}

        <h3 className="pointer-events-none relative z-10 flex min-h-[5.25rem] flex-col items-center justify-center px-4 pt-2 text-center font-display font-semibold leading-tight [text-shadow:0_2px_10px_rgba(0,0,0,.8)] sm:hidden">
          <span className="line-clamp-2 text-[1.5rem]">{current.title}</span>
          {year && <span className="text-[1.1rem] text-spark">{year}</span>}
        </h3>

        <div ref={stage} style={{ perspective: "1000px" }} className="relative min-h-0 flex-1">
          {items}
          <button type="button" aria-label={t("flow.prev")} onClick={() => step(-1)} disabled={index === 0} className={`${arrow} left-2`}><Icon name="prev" className="size-5" /></button>
          <button type="button" aria-label={t("flow.next")} onClick={() => step(1)} disabled={index === last} className={`${arrow} right-2`}><Icon name="next" className="size-5" /></button>
        </div>

        <p className="pointer-events-none relative z-10 pb-3 pt-1 text-center text-sm text-fog/80 sm:hidden">{t("flow.pos", { i: index + 1, n })}</p>
      </div>

      <div className="flex flex-col gap-2 pt-3 sm:min-h-0 sm:flex-1">
        <div className="hidden items-baseline gap-3 sm:flex">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-display text-base font-semibold leading-tight">{current.title}</h3>
            {year && <p className="font-display text-sm font-semibold text-spark">{year}</p>}
          </div>
          <span className="shrink-0 text-xs text-muted">{t("flow.pos", { i: index + 1, n })}</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label={t("aria.openInfo", { title: current.title })}
          onClick={open}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
          className="flex cursor-pointer flex-col items-center gap-2 sm:min-h-0 sm:flex-1 sm:flex-row sm:justify-center sm:overflow-hidden"
        >
          {!ready
            ? [0, 1].map((i) => <div key={i} className={shotCell}><ThumbSkeleton /></div>)
            : shots.slice(0, 2).map((s, i) => (
              <div key={s.thumb} className={shotCell}>
                <Thumb src={s.thumb} alt={t("aria.shotsOf", { title: current.title, i: i + 1 })} delay={i * 60} eager />
              </div>
            ))}
          {ready && shots.length === 0 && <p className="self-center text-xs text-muted">{failed ? t("strip.failed") : t("strip.none")}</p>}
        </div>
      </div>
    </section>
  );
}
