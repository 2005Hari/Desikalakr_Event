import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import { GlobalStyles } from "./desi-kalakar-dashboard.jsx";

function Shell({ children }) {
  return (
    <div className="dk-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <GlobalStyles />
      <div className="dk-card" style={{ width: "100%", maxWidth: 560, padding: 28 }}>{children}</div>
    </div>
  );
}

function Field({ field, value, onChange }) {
  const common = { className: "dk-input", style: { width: "100%" } };
  switch (field.type) {
    case "textarea":
      return <textarea {...common} rows={4} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "dropdown":
      return (
        <select {...common} value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>Choose one…</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "radio":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {field.options.map((o) => (
            <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
              <input type="radio" name={field.id} checked={value === o} onChange={() => onChange(o)} /> {o}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      if (field.options?.length) {
        const arr = Array.isArray(value) ? value : [];
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {field.options.map((o) => (
              <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                <input type="checkbox" checked={arr.includes(o)} onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))} /> {o}
              </label>
            ))}
          </div>
        );
      }
      return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}
        </label>
      );
    case "number":
      return <input {...common} type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <input {...common} type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "email":
      return <input {...common} type="email" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "phone":
      return <input {...common} type="tel" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input {...common} type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

export default function PublicForm({ slug, formId }) {
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  useEffect(() => {
    api("GET", `/public/forms/${slug}/${formId}`).then(setForm).catch((e) => setErr(e.message));
  }, [slug, formId]);

  const set = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setSubmitErr("");
    try {
      await api("POST", `/public/forms/${slug}/${formId}/submit`, { answers });
      setSubmitted(true);
    } catch (e2) { setSubmitErr(e2.message); } finally { setBusy(false); }
  };

  if (err) return <Shell><div style={{ textAlign: "center", color: "var(--ink-soft)" }}>{err}</div></Shell>;
  if (!form) return <Shell><div style={{ textAlign: "center", color: "var(--ink-soft)" }}>Loading…</div></Shell>;

  if (submitted) {
    return (
      <Shell>
        <div style={{ textAlign: "center" }}>
          <div className="dk-display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Thanks!</div>
          <div style={{ color: "var(--ink-soft)", fontSize: 14 }}>Your response to "{form.title}" has been recorded.</div>
        </div>
      </Shell>
    );
  }

  const closed = form.status !== "open";

  return (
    <Shell>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--marigold)", textTransform: "uppercase", marginBottom: 4 }}>{form.eventName}</div>
      <div className="dk-display" style={{ fontSize: 23, fontWeight: 600, marginBottom: 6 }}>{form.title}</div>
      {form.description ? <div style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 16, whiteSpace: "pre-wrap" }}>{form.description}</div> : null}

      {closed ? (
        <div style={{ fontSize: 14, color: "var(--danger)", fontWeight: 600 }}>This form is no longer accepting responses.</div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
          {form.fields.map((f) => (
            <div key={f.id}>
              {f.type !== "checkbox" || f.options?.length ? (
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{f.label}{f.required ? <span style={{ color: "var(--danger)" }}> *</span> : null}</div>
              ) : null}
              <Field field={f} value={answers[f.id]} onChange={(v) => set(f.id, v)} />
            </div>
          ))}
          {submitErr ? <div style={{ color: "var(--danger)", fontSize: 13 }}>{submitErr}</div> : null}
          <button className="dk-btn dk-btn-primary" disabled={busy} style={{ padding: "11px 18px" }}>{busy ? "Submitting…" : "Submit"}</button>
        </form>
      )}
    </Shell>
  );
}
