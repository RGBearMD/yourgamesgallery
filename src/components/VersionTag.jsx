// Versione dell'app, in piccolo in basso a destra; un tocco apre la pagina «Aggiornamenti» (da package.json; nel tooltip anche il commit, se noto).
// `raised`: sopra al Dock (viste con la libreria aperta); altrimenti in fondo alla pagina, sotto il pulsante Ko-fi.
export default function VersionTag({ raised = false }) {
  const commit = import.meta.env.VITE_APP_COMMIT;
  return (
    <a
      href="#updates"
      title={commit ? `build ${commit}` : undefined}
      className={`fixed right-1 z-30 select-none p-1 hover:text-fog font-display text-[10px] leading-none text-muted/70 ${raised ? "bottom-[5.6rem] sm:bottom-[6.2rem]" : "bottom-0"}`}
    >
      v{import.meta.env.VITE_APP_VERSION}
    </a>
  );
}
