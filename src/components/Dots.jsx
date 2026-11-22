// Overlay puntinato per i fondi scuri (Cover Flow e Split): sopra lo sfondo, sotto i contenuti, non intercetta i tocchi.
export default function Dots({ className = "" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.13) 1px, transparent 1.4px)", backgroundSize: "7px 7px" }}
    />
  );
}
