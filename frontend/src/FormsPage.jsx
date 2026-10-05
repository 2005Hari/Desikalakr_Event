import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import { downloadCSV } from "./csv.js";

const FIELD_TYPES = [
  ["text", "Short text"],
  ["textarea", "Long text"],
  ["number", "Number"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["date", "Date"],
  ["dropdown", "Dropdown (one answer)"],
  ["radio", "Radio buttons (one answer)"],
  ["checkbox", "Checkbox(es)"],
];
const CHOICE_TYPES = ["dropdown", "radio", "checkbox"];
const newFieldId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const emptyField = () => ({ id: newFieldId(), type: "text", label: "", required: false, options: [] });

function FieldEditor({ field, onChange, onRemove }) {
  const set = (patch) => onChange({ ...field, ...patch });
  const setOption = (i, v) => set({ options: field.options.map((o, j) => (j === i ? v : o)) });
  return (
    <div className="dk-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input className="dk-input" style={{ flex: 2, minWidth: 160 }} placeholder="Question / label" value={field.label} onChange={(e) => set({ label: e.target.value })} />
        <select className="dk-input" style={{ minWidth: 150 }} value={field.type} onChange={(e) => set({ type: e.target.value, options: CHOICE_TYPES.includes(e.target.value) ? field.options : [] })}>
          {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600 }}>
          <input type="checkbox" checked={field.required} onChange={(e) => set({ required: e.target.checked })} /> Required
        </label>
        <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "5px 9px", fontSize: 12 }} onClick={onRemove}>Remove</button>
      </div>
      {CHOICE_TYPES.includes(field.type) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
          {field.options.map((o, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input className="dk-input" style={{ flex: 1 }} value={o} placeholder={`Option ${i + 1}`} onChange={(e) => setOption(i, e.target.value)} />
              <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "4px 8px", fontSize: 11.5 }} onClick={() => set({ options: field.options.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <div>
            <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => set({ options: [...field.options, ""] })}>+ Add option</button>
          </div>
          {field.type !== "checkbox" && !field.options.length ? <div style={{ fontSize: 11.5, color: "var(--danger)" }}>Needs at least one option.</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function FormBuilder({ slug, initial, onSaved, onCancel, showToast }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [fields, setFields] = useState(initial?.fields?.length ? initial.fields.map((f) => ({ ...f, options: f.options || [] })) : [emptyField()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setField = (i, next) => setFields(fields.map((f, j) => (j === i ? next : f)));
  const removeField = (i) => setFields(fields.filter((_, j) => j !== i));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const payload = { title, description, fields: fields.map((f) => ({ ...f, options: f.options.filter((o) => o.trim()) })) };
    try {
      const saved = initial
        ? await api("PUT", `/events/${slug}/forms/${initial.id}`, payload)
        : await api("POST", `/events/${slug}/forms`, payload);
      showToast(initial ? "Form updated" : "Form created", "success");
      onSaved(saved);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="dk-fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input className="dk-input" placeholder="Form title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="dk-input" placeholder="Description shown to students (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map((f, i) => <FieldEditor key={f.id} field={f} onChange={(next) => setField(i, next)} onRemove={() => removeField(i)} />)}
      </div>
      <div>
        <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setFields([...fields, emptyField()])}>+ Add field</button>
      </div>
      {err ? <div style={{ color: "var(--danger)", fontSize: 13 }}>{err}</div> : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="dk-btn dk-btn-primary" disabled={busy || !title.trim() || !fields.length} style={{ padding: "9px 16px" }}>{initial ? "Save changes" : "Create form"}</button>
        <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "9px 16px" }} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Submissions({ slug, form, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("GET", `/events/${slug}/forms/${form.id}/submissions`).then(setData).catch((e) => setErr(e.message));
  }, [slug, form.id]);

  const exportCsv = () => {
    const rows = data.submissions.map((s) => {
      const row = { SubmittedAt: s.submittedAt };
      form.fields.forEach((f) => { row[f.label] = Array.isArray(s.answers[f.id]) ? s.answers[f.id].join("; ") : s.answers[f.id] ?? ""; });
      return row;
    });
    if (!rows.length) { showToast("No submissions yet", "info"); return; }
    downloadCSV(`${form.title.replace(/[^\w-]+/g, "_") || "form"}-submissions.csv`, rows);
  };

  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div className="dk-display" style={{ fontSize: 20, fontWeight: 600 }}>{form.title} — Entries</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={exportCsv}>Export CSV</button>
          <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={onClose}>Back</button>
        </div>
      </div>
      {err ? <div style={{ color: "var(--danger)" }}>{err}</div> : null}
      {!data ? <div style={{ color: "var(--ink-soft)" }}>Loading…</div> : (
        <div className="dk-card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "9px 12px", textAlign: "left", color: "var(--ink-soft)" }}>Submitted</th>
                {form.fields.map((f) => <th key={f.id} style={{ padding: "9px 12px", textAlign: "left", color: "var(--ink-soft)" }}>{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.submissions.length ? data.submissions.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{new Date(s.submittedAt).toLocaleString("en-IN")}</td>
                  {form.fields.map((f) => (
                    <td key={f.id} style={{ padding: "9px 12px" }}>{Array.isArray(s.answers[f.id]) ? s.answers[f.id].join(", ") : String(s.answers[f.id] ?? (f.type === "checkbox" ? "No" : ""))}</td>
                  ))}
                </tr>
              )) : <tr><td colSpan={form.fields.length + 1} style={{ padding: 16, textAlign: "center", color: "var(--ink-soft)" }}>No entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FormsPage({ slug, showToast }) {
  const [forms, setForms] = useState(null);
  const [mode, setMode] = useState({ view: "list" }); // {view:'list'} | {view:'create'} | {view:'edit', form} | {view:'entries', form}
  const [err, setErr] = useState("");

  const load = () => api("GET", `/events/${slug}/forms`).then(setForms).catch((e) => setErr(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);

  const copyLink = async (form) => {
    const link = `${window.location.origin}/#/form/${slug}/${form.id}`;
    try { await navigator.clipboard.writeText(link); showToast("Link copied", "success"); }
    catch { showToast(link, "info"); }
  };

  const toggleStatus = async (form) => {
    try {
      await api("PUT", `/events/${slug}/forms/${form.id}`, { status: form.status === "open" ? "closed" : "open" });
      load();
    } catch (e) { showToast(e.message, "danger"); }
  };

  if (mode.view === "create" || mode.view === "edit") {
    return (
      <div className="dk-fade-in">
        <SectionTitleLocal title={mode.view === "edit" ? "Edit form" : "New form"} />
        <FormBuilder slug={slug} initial={mode.view === "edit" ? mode.form : null} showToast={showToast}
          onCancel={() => setMode({ view: "list" })}
          onSaved={() => { setMode({ view: "list" }); load(); }} />
      </div>
    );
  }
  if (mode.view === "entries") {
    return <Submissions slug={slug} form={mode.form} showToast={showToast} onClose={() => setMode({ view: "list" })} />;
  }

  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <SectionTitleLocal title="Forms" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13 }} onClick={() => setMode({ view: "create" })}>+ New form</button>
      </div>
      {err ? <div style={{ color: "var(--danger)" }}>{err}</div> : null}
      {!forms ? <div style={{ color: "var(--ink-soft)" }}>Loading…</div> : !forms.length ? (
        <div className="dk-card" style={{ padding: 20, color: "var(--ink-soft)" }}>No forms yet. Create one and share its link with students.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {forms.map((f) => (
            <div key={f.id} className="dk-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {f.fields.length} field{f.fields.length === 1 ? "" : "s"} · <span style={{ color: f.status === "open" ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{f.status === "open" ? "Accepting responses" : "Closed"}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => copyLink(f)}>Copy link</button>
                <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setMode({ view: "entries", form: f })}>View entries</button>
                <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setMode({ view: "edit", form: f })}>Edit</button>
                <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => toggleStatus(f)}>{f.status === "open" ? "Close" : "Reopen"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitleLocal({ title }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", color: "var(--ink-soft)", textTransform: "uppercase" }}>Custom forms</div>
      <div className="dk-display" style={{ fontSize: 24, fontWeight: 600 }}>{title}</div>
    </div>
  );
}
