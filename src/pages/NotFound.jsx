import { useI18n } from "../i18n/useI18n.js";
import { href } from "../lib/router.js";
import { EmptyState } from "../components/ui.jsx";
import { SearchX } from "lucide-react";

export function NotFound({ what }) {
  const { t } = useI18n();
  return (
    <div className="container">
      <h1 tabIndex={-1} className="visually-hidden">{t(what === "game" ? "nf.game" : "nf.title")}</h1>
      <EmptyState icon={SearchX} title={t(what === "game" ? "nf.game" : "nf.title")} text={t("nf.text")}>
        <a className="btn btn-primary" href={href(what === "game" ? "library" : "")}>{t(what === "game" ? "nf.toLibrary" : "nf.home")}</a>
      </EmptyState>
    </div>
  );
}
