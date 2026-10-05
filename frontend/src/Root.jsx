import React, { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";
import { EventApp, GlobalStyles } from "./desi-kalakar-dashboard.jsx";
import { KitEditor, cleanKits } from "./AdminPage.jsx";
import PublicForm from "./PublicForm.jsx";

const slugFromHash = () => (window.location.hash.match(/^#\/e\/([a-z0-9-]+)/) || [])[1] || null;
const publicFormFromHash = () => {
  const m = window.location.hash.match(/^#\/form\/([a-z0-9-]+)\/([\w-]+)/);
  return m ? { slug: m[1], formId: m[2] } : null;
};

function Shell({ children, wide }) {
  return (
    <div className="dk-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <GlobalStyles />
      <div className="dk-card" style={{ width: "100%", maxWidth: wide ? 560 : 380, padding: 26 }}>{children}</div>
    </div>
  );
}

function Login({ onDone }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api("POST", "/auth/login", { username: username.trim(), password });
      setToken(r.token);
      onDone(r);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <Shell>
      <div className="dk-display" style={{ fontSize: 24, fontWeight: 600 }}>Event Control Room</div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 18px" }}>Sign in with your Nextcloud account.</div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="dk-input" placeholder="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="dk-input" type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err ? <div style={{ color: "var(--danger)", fontSize: 13 }}>{err}</div> : null}
        <button className="dk-btn dk-btn-primary" disabled={busy || !username || !password} style={{ padding: "10px 16px" }}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </Shell>
  );
}

function CreateEvent({ onCreated, onCancel }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [kits, setKits] = useState([{ key: "", label: "", price: "" }]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("POST", "/events", { slug, name, kitTypes: cleanKits(kits) });
      onCreated(slug);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="dk-display" style={{ fontSize: 20, fontWeight: 600 }}>New event</div>
      <input className="dk-input" placeholder="Event name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="dk-input" placeholder="Short id, e.g. desi-kalakar-2026" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}>Kit types (you can change these later)</div>
      <KitEditor kits={kits} setKits={setKits} />
      {err ? <div style={{ color: "var(--danger)", fontSize: 13 }}>{err}</div> : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="dk-btn dk-btn-primary" disabled={busy || !name.trim() || slug.length < 3} style={{ padding: "10px 16px" }}>Create event</button>
        <button type="button" className="dk-btn dk-btn-outline" style={{ padding: "10px 16px" }} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function EventPicker({ session, onPick, onLogout, onReload }) {
  const [creating, setCreating] = useState(false);
  return (
    <Shell wide>
      {creating ? (
        <CreateEvent onCancel={() => setCreating(false)} onCreated={async (slug) => { await onReload(); onPick(slug); }} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="dk-display" style={{ fontSize: 24, fontWeight: 600 }}>Your events</div>
            <span style={{ fontSize: 12.5, color: "var(--ink-soft)", cursor: "pointer", textDecoration: "underline" }} onClick={onLogout}>Sign out ({session.user.username})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
            {session.events.length ? session.events.map((e) => (
              <button key={e.slug} className="dk-btn dk-btn-outline" style={{ padding: "12px 14px", textAlign: "left", display: "flex", justifyContent: "space-between" }} onClick={() => onPick(e.slug)}>
                <span style={{ fontWeight: 700 }}>{e.name}</span>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{e.role}</span>
              </button>
            )) : <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>You haven't been added to any event yet. Ask an event admin to add your username.</div>}
          </div>
          {session.user.canCreateEvents ? <button className="dk-btn dk-btn-primary" style={{ padding: "10px 16px" }} onClick={() => setCreating(true)}>+ New event</button> : null}
        </>
      )}
    </Shell>
  );
}

export default function Root() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [slug, setSlug] = useState(slugFromHash());
  const [publicForm, setPublicForm] = useState(publicFormFromHash());

  const reload = async () => {
    const me = await api("GET", "/me");
    setSession(me);
    return me;
  };

  useEffect(() => {
    if (publicForm || !getToken()) return;
    reload().catch(() => setToken(null)).finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onHash = () => { setSlug(slugFromHash()); setPublicForm(publicFormFromHash()); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const pick = (s) => { window.location.hash = s ? `#/e/${s}` : ""; setSlug(s); };
  const logout = () => { setToken(null); setSession(null); pick(null); };

  // Public form links need no login at all — check this before anything session-related.
  if (publicForm) return <PublicForm slug={publicForm.slug} formId={publicForm.formId} />;
  if (booting) return null;
  if (!session) return <Login onDone={setSession} />;
  if (!slug) return <EventPicker session={session} onPick={pick} onLogout={logout} onReload={reload} />;
  return <EventApp key={slug} slug={slug} onSwitch={() => { reload().catch(() => {}); pick(null); }} onLogout={logout} />;
}
