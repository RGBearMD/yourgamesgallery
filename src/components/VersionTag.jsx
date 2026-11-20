// Versione dell'app, in piccolo in basso a destra (da package.json; nel tooltip anche il commit, se noto).
// `raised`: sopra al Dock (viste con la libreria aperta); altrimenti in fondo alla pagina, sotto il pulsante Ko-fi.
export default function VersionTag({ raised = false }) {
  const commit = import.meta.env.VITE_APP_COMMIT;
  return (
    <span
      title={commit ? `build ${commit}` : undefined}
      className={`pointer-events-none fixed right-2 z-30 select-none font-display text-[10px] leading-none text-muted/70 ${raised ? "bottom-[5.9rem] sm:bottom-[6.4rem]" : "bottom-0.5"}`}
    >
      v{import.meta.env.VITE_APP_VERSION}
    </span>
  );
}
