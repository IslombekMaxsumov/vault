// Log in and sign up. The login page shows the demo account for the checker
// (qwerty / 123) with a button that fills it in.
import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { href, navigate } from "../lib/router.js";
import * as db from "../lib/db.js";
import { DEMO_LOGIN } from "../data/demo.js";
import { Logo } from "../components/Logo.jsx";
import { Field } from "../components/ui.jsx";
import { LangSwitch, ThemeButton } from "../components/Shell.jsx";

function AuthFrame({ theme, children }) {
  const { t } = useI18n();
  return (
    <div className="auth">
      <div className="auth-top">
        <Logo size={24} />
        <div className="auth-tools"><LangSwitch /><ThemeButton theme={theme} /></div>
      </div>
      <div className="auth-body">
        <aside className="auth-intro">
          <p className="eyebrow">{t("auth.eyebrow")}</p>
          <p className="auth-lede">{t("auth.lede")}</p>
          <ul className="auth-points">
            <li>{t("auth.point1")}</li>
            <li>{t("auth.point2")}</li>
            <li>{t("auth.point3")}</li>
          </ul>
        </aside>
        <div className="auth-form">{children}</div>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete, ...rest }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input {...rest} className="input" type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" className="icon-btn icon-btn-sm input-eye" aria-pressed={show} aria-label={show ? t("auth.hide") : t("auth.show")} onClick={() => setShow(!show)}>
        {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}

export function LoginPage({ theme, next }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return setError("err.fillBoth");
    setBusy(true);
    const err = await db.logIn(form.username, form.password);
    setBusy(false);
    if (err) return setError(err);
    const to = next && next.startsWith("/") && !/^\/(login|signup)/.test(next) ? next : "/";
    window.location.hash = to;
  };
  const fillDemo = () => { setForm({ ...DEMO_LOGIN }); setError(""); };
  return (
    <AuthFrame theme={theme}>
      <h1 tabIndex={-1}>{t("auth.loginTitle")}</h1>
      <form className="form-stack" onSubmit={submit} noValidate>
        <Field id="lUser" label={t("auth.username")}>
          {(a) => <input {...a} className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" autoCapitalize="none" spellCheck="false" />}
        </Field>
        <Field id="lPass" label={t("auth.password")}>
          {(a) => <PasswordInput {...a} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />}
        </Field>
        <p className="form-error" role="alert">{error ? t(error) : ""}</p>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{t("auth.login")}</button>
      </form>
      <p className="auth-switch">{t("auth.noAccount")} <a href={href("signup")}>{t("auth.signup")}</a></p>

      <section className="demo-note" aria-labelledby="demoTitle">
        <KeyRound size={18} aria-hidden="true" className="demo-icon" />
        <div>
          <h2 id="demoTitle">{t("auth.demoTitle")}</h2>
          <p className="muted">{t("auth.demoText")}</p>
          <dl className="demo-creds">
            <div><dt>{t("auth.username")}</dt><dd className="num">{DEMO_LOGIN.username}</dd></div>
            <div><dt>{t("auth.password")}</dt><dd className="num">{DEMO_LOGIN.password}</dd></div>
          </dl>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fillDemo}>{t("auth.fillDemo")}</button>
        </div>
      </section>
    </AuthFrame>
  );
}

export function SignupPage({ theme }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ username: "", name: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const errs = await db.signUp(form);
    setBusy(false);
    setErrors(errs);
    const firstBad = ["username", "name", "password", "confirm"].find((k) => errs[k]);
    if (firstBad) document.getElementById("s" + firstBad)?.focus();
    else navigate("library", "", { add: "1" });
  };
  return (
    <AuthFrame theme={theme}>
      <h1 tabIndex={-1}>{t("auth.signupTitle")}</h1>
      <form className="form-stack" onSubmit={submit} noValidate>
        <Field id="susername" label={t("auth.username")} hint={t("auth.usernameHint")} error={errors.username}>
          {(a) => <input {...a} className="input" value={form.username} onChange={set("username")} autoComplete="username" autoCapitalize="none" spellCheck="false" maxLength={20} />}
        </Field>
        <Field id="sname" label={t("auth.name")} hint={t("auth.nameHint")} error={errors.name}>
          {(a) => <input {...a} className="input" value={form.name} onChange={set("name")} autoComplete="nickname" maxLength={30} />}
        </Field>
        <Field id="spassword" label={t("auth.password")} hint={t("auth.passwordHint")} error={errors.password}>
          {(a) => <PasswordInput {...a} value={form.password} onChange={set("password")} autoComplete="new-password" />}
        </Field>
        <Field id="sconfirm" label={t("auth.confirm")} error={errors.confirm}>
          {(a) => <PasswordInput {...a} value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />}
        </Field>
        <p className="field-hint">{t("auth.localNote")}</p>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{t("auth.create")}</button>
      </form>
      <p className="auth-switch">{t("auth.haveAccount")} <a href={href("login")}>{t("auth.login")}</a></p>
    </AuthFrame>
  );
}
