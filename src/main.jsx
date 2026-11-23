import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./i18n/I18nProvider.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import App from "./App.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <I18nProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  </StrictMode>
);
