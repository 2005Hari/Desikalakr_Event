import React, { useEffect, useState } from "react";
import { api } from "./api.js";

const title = (t, sub) => (
  <div style={{ marginBottom: 14 }}>
    {sub ? <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", color: "var(--ink-soft)", textTransform: "uppercase" }}>{sub}</div> : null}
    <div className="dk-display" style={{ fontSize: 24, fontWeight: 600 }}>{t}</div>
  </div>
);

export function KitEditor({ kits, setKits }) {
  const set = (i, k, v) => setKits(kits.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {kits.map((k, i) => (
        <div key={i} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="dk-input" style={{ width: 110 }} placeholder="Key (e.g. Mirror)" value={k.key} onChange={(e) => set(i, "key", e.target.value.replace(/[^\w-]/g, ""))} />
          <input className="dk-input" style={{ flex: 1, minWidth: 140 }} placeholder="Label shown to staff" value={k.label} onChange={(e) => set(i, "label", e.target.value)} />
          <input className="dk-input" style={{ width: 90 }} type="number" min="0" placeholder="Price" value={k.price} onChange={(e) => set(i, "price", e.target.value)} />
          <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "6px 10px" }} onClick={() => setKits(kits.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <div>
        <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setKits([...kits, { key: "", label: "", price: "" }])}>+ Add kit type</button>
      </div>
    </div>
  );
}

export const cleanKits = (kits) => kits.filter((k) => k.key.trim()).map((k) => ({ key: k.key.trim(), label: (k.label || k.key).trim(), price: Number(k.price) || 0 }));

export default function AdminPage({ slug, config, onChanged, showToast }) {
  const [name, setName] = useState(config.name);
  const [eyebrow, setEyebrow] = useState(config.branding?.eyebrow || "");
  const [kits, setKits] = useState(config.kitTypes || []);
  const [busy, setBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [team, setTeam] = useState({ admins: [], volunteers: [] });
  const [member, setMember] = useState({ username: "", role: "volunteer", password: "" });

  const loadTeam = async () => {
    try { setTeam(await api("GET", `/events/${slug}/team`)); } catch (e) { showToast(e.message, "danger"); }
  };
  useEffect(() => { loadTeam(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);

  const guard = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { showToast(e.message, "danger"); } finally { setBusy(false); }
  };

  const saveConfig = () => guard(async () => {
    await api("PUT", `/events/${slug}/config`, { name, branding: { ...(config.branding || {}), eyebrow }, kitTypes: cleanKits(kits) });
    showToast("Event settings saved", "success");
    await onChanged();
  });

  const doImport = (file) => file && guard(async () => {
    const form = new FormData();
    form.append("file", file);
    const r = await api("POST", `/events/${slug}/registrations/import`, form);
    setImportResult(r);
    showToast(`Imported ${r.imported} registration(s)`, "success");
    await onChanged();
  });

  const addMember = (e) => {
    e.preventDefault();
    guard(async () => {
      await api("POST", `/events/${slug}/team`, { username: member.username.trim(), role: member.role, password: member.password || undefined });
      setMember({ username: "", role: "volunteer", password: "" });
      showToast("Team updated", "success");
      await loadTeam();
    });
  };

  const removeMember = (u) => guard(async () => { await api("DELETE", `/events/${slug}/team/${encodeURIComponent(u)}`); await loadTeam(); });

  return (
    <div className="dk-fade-in">
      {title("Event Admin", "Admins only")}

      <div className="dk-card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Event & kit types</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input className="dk-input" style={{ flex: 2, minWidth: 180 }} placeholder="Event name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="dk-input" style={{ flex: 1, minWidth: 140 }} placeholder="Small heading (optional)" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
        </div>
        <KitEditor kits={kits} setKits={setKits} />
        <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "10px 0" }}>
          Imported registrations are matched to a kit when the form answer contains the kit's label (or key). Changing prices only affects registrations imported afterwards.
        </div>
        <button className="dk-btn dk-btn-primary" disabled={busy || !name.trim()} style={{ padding: "9px 16px" }} onClick={saveConfig}>Save</button>
      </div>

      <div className="dk-card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Import registrations</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
          Upload the CSV or Excel export of your registration form. Columns are detected from their headings (name, phone, email, year, school, programme, kit, payment screenshot; add "2" to a heading for a second participant). New rows are added; existing registrations are never overwritten.
        </div>
        <input type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={(e) => { doImport(e.target.files[0]); e.target.value = ""; }} />
        {importResult ? (
          <div style={{ marginTop: 12, fontSize: 12.5 }}>
            <b>{importResult.imported}</b> imported{importResult.skipped ? `, ${importResult.skipped} blank row(s) skipped` : ""}.
            <div style={{ marginTop: 6, color: "var(--ink-soft)" }}>
              Detected columns: {Object.entries(importResult.columns || {}).map(([h, f]) => `${h} → ${f || "ignored"}`).join(" · ")}
            </div>
          </div>
        ) : null}
      </div>

      <div className="dk-card" style={{ padding: 20 }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Team</div>
        {[["Admins", team.admins, "admin"], ["Volunteers", team.volunteers, "volunteer"]].map(([label, list]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>{label}</div>
            {list.length ? list.map((u) => (
              <div key={u} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, padding: "3px 0" }}>
                <span>{u}</span>
                <button className="dk-btn dk-btn-outline" style={{ padding: "3px 9px", fontSize: 12 }} disabled={busy} onClick={() => removeMember(u)}>Remove</button>
              </div>
            )) : <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>None</div>}
          </div>
        ))}
        <form onSubmit={addMember} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <input className="dk-input" style={{ flex: 1, minWidth: 130 }} placeholder="Username" value={member.username} onChange={(e) => setMember({ ...member, username: e.target.value })} />
          <select className="dk-input" value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })}>
            <option value="volunteer">Volunteer</option>
            <option value="admin">Admin</option>
          </select>
          <input className="dk-input" style={{ flex: 1, minWidth: 150 }} type="password" placeholder="Password (only to create a new account)" value={member.password} onChange={(e) => setMember({ ...member, password: e.target.value })} />
          <button className="dk-btn dk-btn-primary" disabled={busy || !member.username.trim()} style={{ padding: "9px 16px" }}>Add</button>
        </form>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
          Leave the password empty to add someone who already has a Nextcloud account; fill it in to create a new account for them.
        </div>
      </div>
    </div>
  );
}
