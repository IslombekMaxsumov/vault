// If a page throws while rendering, show a calm message instead of a blank
// screen. The header and tab bar stay, so the user can go elsewhere.
import { Component } from "react";
import { useI18n } from "../i18n/useI18n.js";
import { EmptyState } from "./ui.jsx";
import { TriangleAlert } from "lucide-react";

function Fallback() {
  const { t } = useI18n();
  return (
    <div className="container">
      <h1 tabIndex={-1} className="visually-hidden">{t("error.title")}</h1>
      <EmptyState icon={TriangleAlert} title={t("error.title")} text={t("error.text")}>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>{t("error.reload")}</button>
      </EmptyState>
    </div>
  );
}

export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error(error); }
  render() { return this.state.failed ? <Fallback /> : this.props.children; }
}
