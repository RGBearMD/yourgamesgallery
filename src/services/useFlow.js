import { useCallback, useEffect, useRef, useState } from "react";
import { prefetchDetails } from "./gameData";

// Logica condivisa dalle viste a «flusso» (Cover Flow orizzontale e Split verticale): posizione con decimali,
// animazione verso la copertina più vicina, trascinamento con inerzia (dito o mouse, anche tenendo premuto),
// rotella, tasti freccia, sincronizzazione col gioco richiesto da fuori (`focusId`) e dettagli chiesti solo a copertina ferma.
// `axis`: "x" (Cover Flow) o "y" (Split). `dragPx`: pixel di trascinamento che valgono una copertina.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useFlow({ games, focusId, onFocus, onEnter, axis = "x", dragPx = 60 }) {
  const horizontal = axis === "x";
  const n = games.length;
  const last = Math.max(0, n - 1);

  const [pos, setPos] = useState(() => Math.max(0, games.findIndex((g) => g.id === focusId))); // posizione (con decimali)
  const posRef = useRef(pos);
  const target = useRef(pos);
  const raf = useRef(0);
  const drag = useRef(null);
  const moved = useRef(false); // true dopo un trascinamento: serve a ignorare il «click» che segue
  const wheelAcc = useRef(0);
  const elRef = useRef(null); // elemento che riceve la rotella (e di cui il componente misura la dimensione)
  const dragPxRef = useRef(dragPx);
  const [active, setActive] = useState(() => games[pos] ?? null); // gioco di cui si chiedono i dettagli (solo a copertina ferma)

  useEffect(() => { dragPxRef.current = dragPx; }, [dragPx]);

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
  const step = useCallback((delta) => goTo(Math.round(target.current) + delta), [goTo]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Rotella / trackpad: un «scatto» = una copertina (Cover Flow: orizzontale o Maiusc+rotella; Split: verticale)
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onWheel = (e) => {
      const d = horizontal ? (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0) : Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!d) return;
      e.preventDefault();
      wheelAcc.current += d;
      if (Math.abs(wheelAcc.current) >= 50) { step(Math.sign(wheelAcc.current)); wheelAcc.current = 0; }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [horizontal, step]);

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

  // Trascinamento (mouse o dito, anche dopo una pressione prolungata)
  const coord = (e) => (horizontal ? e.clientX : e.clientY);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnimationFrame(raf.current);
    drag.current = { c: coord(e), pos: posRef.current, lc: coord(e), lt: performance.now(), v: 0, on: false, id: e.pointerId };
    moved.current = false;
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const delta = coord(e) - d.c;
    if (!d.on) {
      if (Math.abs(delta) < 8) return;
      d.on = true;
      moved.current = true;
      try { e.currentTarget.setPointerCapture(d.id); } catch { /* pointer già rilasciato */ }
    }
    const now = performance.now();
    if (now - d.lt > 0) d.v = 0.7 * d.v + 0.3 * ((coord(e) - d.lc) / (now - d.lt));
    d.lc = coord(e); d.lt = now;
    posRef.current = clamp(d.pos - delta / dragPxRef.current, 0, last);
    target.current = posRef.current;
    setPos(posRef.current);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    goTo(posRef.current - (d.v * 260) / dragPxRef.current); // un po' di inerzia
  };
  const onKeyDown = (e) => {
    const [next, prev] = horizontal ? ["ArrowRight", "ArrowLeft"] : ["ArrowDown", "ArrowUp"];
    if (e.key === next) { e.preventDefault(); step(1); }
    else if (e.key === prev) { e.preventDefault(); step(-1); }
    else if (e.key === "Enter" && current) { e.preventDefault(); onEnter?.(current); }
  };

  // Da distribuire sul contenitore trascinabile. `dragstart` e `contextmenu` bloccati: il browser non deve avviare
  // il trascinamento nativo dell'immagine né il menu della pressione prolungata, che interromperebbero il gesto.
  const bind = {
    tabIndex: 0,
    onKeyDown, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
    onDragStart: (e) => e.preventDefault(),
    onContextMenu: (e) => e.preventDefault(),
    style: { touchAction: horizontal ? "pan-y" : "none", WebkitTouchCallout: "none", WebkitUserSelect: "none" },
  };

  return { pos, index, current, active, last, goTo, step, moved, elRef, bind };
}
