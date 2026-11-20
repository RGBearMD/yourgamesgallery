import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cover from "./Cover";
import Thumb, { ThumbSkeleton } from "./Thumb";
import { Icon } from "./Icons";
import { useGameDetails, prefetchDetails, isLandscape } from "../services/gameData";
import { useI18n } from "../i18n/context";

// Cover Flow: metà alta = copertine in 3D che si scorrono (trascinando, con rotella, frecce o tasti);
// metà bassa = titolo + 2 screenshot del gioco al centro. Tocco sulla copertina centrale (o sul titolo/screenshot) = «Info».
// Nel DOM ci sono sempre solo le copertine vicine al centro (WINDOW per lato), mai la lista intera.
const WINDOW = 6;
// Larghezza massima di uno screenshot: lo fa stare nella metà bassa (altezza della sezione / 2 − riga del titolo), in 16:9
const SHOT_MAX = "calc((max(26rem, 100dvh - 12.75rem) / 2 - 3.6rem) * 1.7778)";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function CoverFlow({ games, meta = {}, focusId, onFocus, onSelect }) {
  const { t } = useI18n();
  const n = games.length;
  const last = Math.max(0, n - 1);
  const startIndex = () => Math.max(0, games.findIndex((g) => g.id === focusId));

  const stage = useRef(null);
  const [size, setSize] = useState({ w: 360, h: 300 });
  const [pos, setPos] = useState(startIndex); // posizione (con decimali) durante trascinamento e animazione
  const posRef = useRef(pos);
  const target = useRef(pos);
  const raf = useRef(0);
  const drag = useRef(null);
  const moved = useRef(false);
  const wheelAcc = useRef(0);
  const [active, setActive] = useState(() => games[pos] ?? null); // gioco di cui si chiedono i dettagli (solo a copertina ferma)

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (reduceMotion()) { posRef.current = target.current; setPos(target.current); return; }
    const tick = () => {
      const d = target.current - posRef.current;
      if (Math.abs(d) < 0.003) { posRef.current = target.current; setPos(target.current); return; }
      posRef.current += d * 0.2;
      setPos(posRef.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);
  const goTo = useCallback((i) => { target.current = clamp(Math.round(i), 0, last); run(); }, [last, run]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rotella / trackpad orizzontale: un «scatto» = una copertina
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      wheelAcc.current += d;
      if (Math.abs(wheelAcc.current) >= 50) { goTo(Math.round(target.current) + Math.sign(wheelAcc.current)); wheelAcc.current = 0; }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goTo]);

  // Il filtro per genere può accorciare la lista, il menu ☰ può chiedere un gioco preciso
  useEffect(() => {
    const i = games.findIndex((g) => g.id === focusId);
    if (i >= 0 && i !== Math.round(target.current)) goTo(i);
    else if (target.current > last) goTo(last);
  }, [focusId, games, last, goTo]);

  const index = clamp(Math.round(pos), 0, last);
  const current = games[index] ?? null;

  // A copertina ferma (200 ms): ricordo il gioco e chiedo i dettagli solo di quello (+ i vicini in anticipo)
  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => {
      setActive(current);
      onFocus?.(current.id);
      [games[index - 1], games[index + 1]].forEach((g) => g && prefetchDetails(g));
    }, 200);
    return () => clearTimeout(id);
  }, [current, games, index, onFocus]);

  const { shots, year: detailYear, loading, failed } = useGameDetails(active, !!active);

  // Geometria: dimensioni delle copertine in base all'area disponibile
  const wide = games.length ? isLandscape(games[0]) : false; // GOG = orizzontale
  const geo = useMemo(() => {
    const maxH = size.h * 0.8;
    let w, h;
    if (wide) { w = Math.min(size.w * 0.6, maxH * (460 / 215)); h = w * (215 / 460); }
    else { h = Math.min(maxH, size.w * 0.55 * 1.5); w = h * (2 / 3); }
    return { w, h, gap: w * 0.64, step: w * 0.26 };
  }, [size, wide]);

  // Trascinamento
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnimationFrame(raf.current);
    drag.current = { x: e.clientX, pos: posRef.current, t: performance.now(), lx: e.clientX, lt: performance.now(), v: 0, on: false, id: e.pointerId };
    moved.current = false;
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.on) {
      if (Math.abs(dx) < 8) return;
      d.on = true;
      moved.current = true;
      try { e.currentTarget.setPointerCapture(d.id); } catch { /* pointer già rilasciato */ }
    }
    const now = performance.now();
    if (now - d.lt > 0) d.v = 0.7 * d.v + 0.3 * ((e.clientX - d.lx) / (now - d.lt));
    d.lx = e.clientX; d.lt = now;
    posRef.current = clamp(d.pos - dx / (geo.step * 1.6), 0, last);
    target.current = posRef.current;
    setPos(posRef.current);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    goTo(posRef.current - (d.v * 260) / (geo.step * 1.6)); // un po' di inerzia
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.round(target.current) + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.round(target.current) - 1); }
    else if (e.key === "Enter" && current) { e.preventDefault(); onSelect(current); }
  };

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
    <section aria-label={t("flow.aria")} className="mx-auto flex w-full max-w-5xl flex-col sm:h-[max(26rem,calc(100dvh-12.75rem))]" style={{ "--shot-max": SHOT_MAX }}>
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "pan-y", WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
        className="relative flex h-[58dvh] min-h-[26rem] cursor-grab select-none flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-panel/60 to-ink outline-none active:cursor-grabbing sm:h-auto sm:min-h-0 sm:flex-1"
      >
        {bg && (
          <>
            <img key={bg} src={bg} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full animate-fade-in object-cover opacity-30" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink/70" />
          </>
        )}

        <h3 className="pointer-events-none relative z-10 flex min-h-[4.5rem] items-center justify-center px-4 pt-3 text-center font-display text-[1.5rem] font-semibold leading-tight [text-shadow:0_2px_10px_rgba(0,0,0,.8)] sm:hidden">
          <span className="line-clamp-2">{current.title}{year && <span className="whitespace-nowrap text-spark"> - {year}</span>}</span>
        </h3>

        <div ref={stage} style={{ perspective: "1000px" }} className="relative min-h-0 flex-1">
          {items}
          <button type="button" aria-label={t("flow.prev")} onClick={() => goTo(Math.round(target.current) - 1)} disabled={index === 0} className={`${arrow} left-2`}><Icon name="prev" className="size-5" /></button>
          <button type="button" aria-label={t("flow.next")} onClick={() => goTo(Math.round(target.current) + 1)} disabled={index === last} className={`${arrow} right-2`}><Icon name="next" className="size-5" /></button>
        </div>

        <p className="pointer-events-none relative z-10 pb-3 pt-1 text-center text-sm text-fog/80 sm:hidden">{t("flow.pos", { i: index + 1, n })}</p>
      </div>

      <div className="flex flex-col gap-2 pt-3 sm:min-h-0 sm:flex-1">
        <div className="hidden items-baseline gap-3 sm:flex">
          <h3 className="line-clamp-2 min-w-0 flex-1 font-display text-base font-semibold leading-tight">
            {current.title}{year && <span className="whitespace-nowrap text-spark"> - {year}</span>}
          </h3>
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
