// Profile: name and avatar colour, weekly goal, password, backup (export /
// import) and, kept apart, log out and delete account.
import { useEffect, useRef, useState } from "react";
import { Download, Upload, LogOut, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/useI18n.js";
import { useDb } from "../hooks/useDb.js";
import { useToday } from "../hooks/useToday.js";
import { navigate } from "../lib/router.js";
import * as db from "../lib/db.js";
import { COLORS } from "../lib/accounts.js";
import { Avatar, Field, Segmented } from "../components/ui.jsx";
import { Modal } from "../components/Modal.jsx";
import { useToast } from "../components/useToast.js";
import { GoalSummary } from "./Home.jsx";

export function ProfilePage({ route }) {
  const { t, formatDate } = useI18n();
  const { me, data } = useDb();
  const today = useToday();
  const toast = useToast();
  const goalRef = useRef(null);
  const [name, setName] = useState(me.name);
  const [nameErr, setNameErr] = useState("");
  const [goalH, setGoalH] = useState(String(+(data.goal.minutes / 60).toFixed(1)));
  const [goalMode, setGoalMode] = useState(data.goal.mode);
  const [goalErr, setGoalErr] = useState("");
  const [pw, setPw] = useState({ old: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState({});
  const [importErr, setImportErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { if (route.query.get("focus") === "goal") goalRef.current?.querySelector("input")?.focus(); }, []); // eslint-disable-line

  const saveName = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setNameErr("err.name");
    setNameErr("");
    db.updateProfile({ name });
    toast(t("profile.saved"));
  };
  const saveGoal = (e) => {
    e.preventDefault();
    const h = Number(String(goalH).replace(",", "."));
    if (!Number.isFinite(h) || h < 0.5 || h > 100) return setGoalErr("err.goal");
    setGoalErr("");
    db.setGoal({ minutes: h * 60, mode: goalMode });
    toast(t("profile.goalSaved"));
  };
  const savePw = async (e) => {
    e.preventDefault();
    const errs = {};
    if (pw.next.length < 6) errs.next = "err.password";
    else if (pw.next !== pw.confirm) errs.confirm = "err.confirm";
    if (!pw.old) errs.old = "err.oldPassword";
    if (!Object.keys(errs).length) {
      const err = await db.changePassword(pw.old, pw.next);
      if (err) errs[err === "err.oldPassword" ? "old" : "next"] = err;
    }
    setPwErr(errs);
    if (Object.keys(errs).length) return document.getElementById("pw-" + Object.keys(errs)[0])?.focus();
    setPw({ old: "", next: "", confirm: "" });
    toast(t("profile.pwSaved"));
  };
  const exportFile = () => {
    const blob = new Blob([db.exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vault-${me.username}-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) return setImportErr("err.importBig");
    const err = db.importData(await file.text());
    setImportErr(err);
    if (!err) toast(t("profile.imported"));
  };

  return (
    <div className="container profile-page">
      <div className="profile-head">
        <Avatar user={me} size={64} />
        <div>
          <h1 tabIndex={-1}>{me.name}</h1>
          <p className="muted">@{me.username} · {t("profile.since", { date: formatDate(new Date(me.created), { month: "long", year: "numeric" }) })}</p>
        </div>
      </div>

      <div className="settings">
        <section className="setting" aria-labelledby="pName">
          <div className="setting-head"><h2 id="pName">{t("profile.you")}</h2><p className="muted">{t("profile.youText")}</p></div>
          <form className="form-stack" onSubmit={saveName} noValidate>
            <Field id="p-name" label={t("auth.name")} error={nameErr}>
              {(a) => <input {...a} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />}
            </Field>
            <fieldset className="color-pick">
              <legend className="field-label">{t("profile.color")}</legend>
              <div className="color-row">
                {COLORS.map((c, i) => (
                  <label key={c} className="color-opt" style={{ "--av": c }}>
                    <input type="radio" name="avColor" className="visually-hidden" checked={me.color === c} onChange={() => db.updateProfile({ color: c })} />
                    <span aria-hidden="true" />
                    <span className="visually-hidden">{t("profile.colorN", { n: i + 1 })}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-actions"><button type="submit" className="btn btn-secondary">{t("save")}</button></div>
          </form>
        </section>

        <section className="setting" aria-labelledby="pGoal" ref={goalRef}>
          <div className="setting-head"><h2 id="pGoal">{t("goal.title")}</h2><p className="muted">{t("goal.text")}</p></div>
          <form className="form-stack" onSubmit={saveGoal} noValidate>
            <Segmented label={t("goal.mode")} value={goalMode} onChange={setGoalMode} options={[{ value: "reach", label: t("goal.modeReach") }, { value: "limit", label: t("goal.modeLimit") }]} />
            <Field id="p-goal" label={t("goal.hours")} hint={t(goalMode === "limit" ? "goal.hintLimit" : "goal.hintReach")} error={goalErr}>
              {(a) => <input {...a} className="input num goal-input" inputMode="decimal" value={goalH} onChange={(e) => setGoalH(e.target.value)} />}
            </Field>
            <div className="form-actions"><button type="submit" className="btn btn-secondary">{t("save")}</button></div>
            <GoalSummary data={data} today={today} compact />
          </form>
        </section>

        <section className="setting" aria-labelledby="pPw">
          <div className="setting-head"><h2 id="pPw">{t("profile.password")}</h2><p className="muted">{t("auth.localNote")}</p></div>
          <form className="form-stack" onSubmit={savePw} noValidate>
            <Field id="pw-old" label={t("profile.oldPw")} error={pwErr.old}>{(a) => <input {...a} className="input" type="password" autoComplete="current-password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} />}</Field>
            <Field id="pw-next" label={t("profile.newPw")} hint={t("auth.passwordHint")} error={pwErr.next}>{(a) => <input {...a} className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />}</Field>
            <Field id="pw-confirm" label={t("auth.confirm")} error={pwErr.confirm}>{(a) => <input {...a} className="input" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />}</Field>
            <div className="form-actions"><button type="submit" className="btn btn-secondary">{t("profile.changePw")}</button></div>
          </form>
        </section>

        <section className="setting" aria-labelledby="pBackup">
          <div className="setting-head"><h2 id="pBackup">{t("profile.backup")}</h2><p className="muted">{t("profile.backupText")}</p></div>
          <div className="backup-row">
            <button type="button" className="btn btn-secondary" onClick={exportFile}><Download size={16} aria-hidden="true" />{t("profile.export")}</button>
            <label className="btn btn-secondary file-btn">
              <Upload size={16} aria-hidden="true" />{t("profile.import")}
              <input type="file" accept="application/json,.json" className="visually-hidden" onChange={importFile} />
            </label>
          </div>
          <p className="field-error" role="alert">{importErr ? t(importErr) : ""}</p>
        </section>

        <section className="setting setting-danger" aria-labelledby="pDanger">
          <div className="setting-head"><h2 id="pDanger">{t("profile.account")}</h2><p className="muted">{t("profile.accountText")}</p></div>
          <div className="backup-row">
            <button type="button" className="btn btn-secondary" onClick={() => { db.logOut(); navigate("login"); }}><LogOut size={16} aria-hidden="true" />{t("auth.logout")}</button>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden="true" />{t("profile.delete")}</button>
          </div>
        </section>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} titleId="delT" title={t("profile.deleteTitle")}>
        <p>{t("profile.deleteText", { name: me.username })}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
          <button type="button" className="btn btn-danger" onClick={() => { db.deleteAccount(); navigate("login"); }}>{t("profile.deleteYes")}</button>
        </div>
      </Modal>
    </div>
  );
}
