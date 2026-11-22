import { useEffect } from "react";
import { Icon } from "./Icons";
import LangToggle from "./LangToggle";
import { UPDATES } from "../data/updates";
import { useI18n } from "../i18n/context";

// Pagina «Aggiornamenti» (route `#updates`, senza router): cronologia dalla più recente, con la versione attuale in cima.
export default function Updates() {
  const { t, locale } = useI18n();
  useEffect(() => { window.scrollTo(0, 0); }, []); // niente return: scrollTo può restituire una Promise e React la scambierebbe per la funzione di pulizia
  const list = [...UPDATES].sort((a, b) => b.date.localeCompare(a.date));
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line/60 bg-ink px-3">
        <a href="#" className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold hover:bg-raised"><Icon name="prev" className="size-4" /> {t("updates.back")}</a>
        <h1 className="flex-1 truncate font-display text-lg font-bold tracking-tight">{t("updates.title")}</h1>
        <LangToggle />
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-3 px-3 pb-16 pt-5">
        <p className="text-sm text-muted">{t("updates.note")} <span className="font-semibold text-spark">{t("updates.current", { v: import.meta.env.VITE_APP_VERSION })}</span></p>
        {list.map((u, ui) => (
          <section key={u.date} className="rounded-2xl border border-line/60 bg-panel p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold">
              {fmt(u.date)}
              {ui === 0 && <span className="rounded bg-spark px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink">{t("updates.latest")}</span>}
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-fog/90">
              {u.items.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
