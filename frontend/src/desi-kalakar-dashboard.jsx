import { api, proofHref } from "./api.js";
import { downloadCSV } from "./csv.js";
import AdminPage from "./AdminPage.jsx";
import FormsPage from "./FormsPage.jsx";
import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from "react";
import {
  Home, Users, Ticket, Palette, Wallet, AlertTriangle, BarChart3, Settings as SettingsIcon,
  Search, CheckCircle2, XCircle, Clock, Phone, Mail, GraduationCap, Package, ChevronRight,
  Download, RefreshCw, X, AlertCircle, TrendingUp, PieChart as PieChartIcon, Loader2,
  ShieldCheck, ShieldAlert, ShieldQuestion, ArrowLeft, Sparkles, UserPlus, Plus, ClipboardList
} from "lucide-react";

// Flatten a list of registrations into individual participants, each carrying a
// reference back to their registration. Reused for the original data and for the
// merged (original + walk-in) data.
function flattenParticipants(registrations) {
  const out = [];
  registrations.forEach((reg) => {
    reg.participants.forEach((p, pIndex) => {
      out.push({
        key: `${reg.id}:${pIndex}`,
        regId: reg.id,
        pIndex,
        name: p.name,
        phone: p.phone,
        year: p.year,
        school: p.school,
        programme: p.programme,
        email: reg.email,
        kitType: reg.kitType,
        kitRaw: reg.kitRaw,
        price: reg.price,
        timestamp: reg.timestamp,
        numParticipants: reg.numParticipants,
        isWalkIn: !!reg.isWalkIn,
        teammates: reg.participants.filter((_, i) => i !== pIndex).map((t) => t.name).filter(Boolean),
      });
    });
  });
  return out;
}


const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };

// Kit types are configured per event. This registry is refreshed from the event
// config on every render of EventApp (see applyEventConfig), so every page below
// can keep using the KIT_* lookups.
const KIT_PALETTE = [
  { color: "var(--mirror)", soft: "var(--mirror-soft)", tone: "mirror" },
  { color: "var(--clay)", soft: "var(--clay-soft)", tone: "clay" },
  { color: "var(--marigold)", soft: "var(--marigold-soft)", tone: "warn" },
  { color: "var(--violet)", soft: "var(--violet-soft)", tone: "violet" },
  { color: "var(--success)", soft: "var(--success-soft)", tone: "success" },
];
const KIT_KEYS = [];
const KIT_COLORS = {};
const KIT_SOFT = {};
const KIT_LABELS = {};
const KIT_PRICES = {};
const KIT_TONES = {};
let FILE_PREFIX = "event";
function applyEventConfig(config, slug) {
  KIT_KEYS.length = 0;
  for (const o of [KIT_COLORS, KIT_SOFT, KIT_LABELS, KIT_PRICES, KIT_TONES]) for (const k of Object.keys(o)) delete o[k];
  (config.kitTypes || []).forEach((k, i) => {
    const pal = KIT_PALETTE[i % KIT_PALETTE.length];
    KIT_KEYS.push(k.key);
    KIT_COLORS[k.key] = pal.color; KIT_SOFT[k.key] = pal.soft; KIT_TONES[k.key] = pal.tone;
    KIT_LABELS[k.key] = k.label; KIT_PRICES[k.key] = k.price;
  });
  KIT_COLORS["Multiple-Flagged"] = "var(--danger)"; KIT_COLORS.Unknown = "var(--ink-soft)";
  KIT_LABELS["Multiple-Flagged"] = "Needs Review"; KIT_LABELS.Unknown = "Unknown";
  FILE_PREFIX = slug || "event";
}
const kitTone = (key) => (key === "Multiple-Flagged" ? "danger" : KIT_TONES[key] || "ink");

function fmtMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "\u20B9" + Number(n).toLocaleString("en-IN");
}

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "—";
  }
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "—";
  }
}

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

// ---------- Issue detection (computed from whatever registration/participant lists are passed in) ----------
function computeIssues(registrations, participants) {
  const issues = [];

  // Duplicate emails
  const byEmail = {};
  registrations.forEach((r) => {
    if (!r.email) return;
    (byEmail[r.email] = byEmail[r.email] || []).push(r);
  });
  Object.entries(byEmail).forEach(([email, regs]) => {
    if (regs.length > 1) {
      issues.push({
        id: `dup-email-${email}`,
        type: "Duplicate email",
        severity: "warn",
        message: `The email "${email}" was used in ${regs.length} separate registrations (${regs.map((r) => r.id).join(", ")}). This may be the same person registering more than once.`,
        regIds: regs.map((r) => r.id),
      });
    }
  });

  // Duplicate phone numbers across participants
  const byPhone = {};
  participants.forEach((p) => {
    if (!p.phone || p.phone.length !== 10) return;
    (byPhone[p.phone] = byPhone[p.phone] || []).push(p);
  });
  Object.entries(byPhone).forEach(([phone, ps]) => {
    const uniqueRegs = [...new Set(ps.map((p) => p.regId))];
    if (uniqueRegs.length > 1) {
      issues.push({
        id: `dup-phone-${phone}`,
        type: "Duplicate phone number",
        severity: "warn",
        message: `Phone number ${phone} appears across ${uniqueRegs.length} different registrations (${uniqueRegs.join(", ")}), used by: ${[...new Set(ps.map((p) => p.name))].join(", ")}.`,
        regIds: uniqueRegs,
      });
    } else if (ps.length > 1) {
      issues.push({
        id: `dup-phone-same-${phone}`,
        type: "Same phone, same registration",
        severity: "info",
        message: `Phone number ${phone} is listed for both teammates in registration ${uniqueRegs[0]}. Please confirm this wasn't a copy-paste error.`,
        regIds: uniqueRegs,
      });
    }
  });

  // Duplicate names (exact, case-insensitive) across different registrations
  const byName = {};
  participants.forEach((p) => {
    const n = (p.name || "").trim().toLowerCase();
    if (!n || n.length < 3) return;
    (byName[n] = byName[n] || []).push(p);
  });
  Object.entries(byName).forEach(([name, ps]) => {
    const uniqueRegs = [...new Set(ps.map((p) => p.regId))];
    if (uniqueRegs.length > 1) {
      const samePhone = new Set(ps.map((p) => p.phone)).size === 1;
      issues.push({
        id: `dup-name-${name}`,
        type: "Possible duplicate registration",
        severity: samePhone ? "warn" : "info",
        message: `"${ps[0].name}" appears in ${uniqueRegs.length} registrations (${uniqueRegs.join(", ")})${samePhone ? " with the same phone number" : ""}. ${samePhone ? "Likely a duplicate — please verify before double check-in." : "Could be a coincidental name match."}`,
        regIds: uniqueRegs,
      });
    }
  });

  // Multiple kit types selected on one registration (data entry error)
  registrations.forEach((r) => {
    if (r.kitType === "Multiple-Flagged") {
      issues.push({
        id: `multi-kit-${r.id}`,
        type: "Multiple kits selected",
        severity: "error",
        message: `Registration ${r.id} (${r.participants.map((p) => p.name).join(" & ")}) selected more than one kit option on the form: "${r.kitRaw}". Confirm with the participant which single kit they actually paid for.`,
        regIds: [r.id],
      });
    }
  });

  // Missing / malformed important fields
  participants.forEach((p) => {
    const problems = [];
    if (!p.name) problems.push("missing name");
    if (!p.phone || p.phone.length !== 10) problems.push(`phone number looks invalid ("${p.phone || "blank"}")`);
    if (problems.length) {
      issues.push({
        id: `missing-${p.key}`,
        type: "Incomplete registration",
        severity: "error",
        message: `${p.name || "Unnamed participant"} in registration ${p.regId}: ${problems.join(", ")}.`,
        regIds: [p.regId],
      });
    }
  });

  return issues;
}

// ---------- Event-day state (served by the backend) ----------
const EMPTY_STATE = { participants: {}, registrations: {}, resolvedIssues: {} };

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');

      .dk-root {
        --canvas: #FAF6EF;
        --canvas-soft: #F1EADA;
        --paper: #FFFFFF;
        --ink: #221D18;
        --ink-soft: #8A7C6B;
        --line: #E6DDC9;
        --mirror: #2C6E68;
        --mirror-soft: #DCEEEA;
        --clay: #C1552F;
        --clay-soft: #F7E1D3;
        --marigold: #DD9A2E;
        --marigold-soft: #FBECD1;
        --violet: #5B3E8C;
        --violet-soft: #EBE3F6;
        --success: #3F8F5F;
        --success-soft: #E1F0E5;
        --danger: #C0392B;
        --danger-soft: #F8DEDA;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
        color: var(--ink);
        background: var(--canvas);
      }
      .dk-root * { box-sizing: border-box; }
      .dk-display { font-family: 'Fraunces', Georgia, serif; }
      .dk-tabular { font-variant-numeric: tabular-nums; }

      .dk-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .dk-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }
      .dk-scroll::-webkit-scrollbar-track { background: transparent; }

      .dk-card {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 18px;
      }
      .dk-btn {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        border-radius: 12px;
        transition: transform .08s ease, box-shadow .08s ease, background .12s ease;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .dk-btn:active { transform: scale(0.97); }
      .dk-btn:disabled { cursor: not-allowed; opacity: 0.5; transform: none; }
      .dk-btn-primary { background: var(--ink); color: var(--canvas); }
      .dk-btn-primary:not(:disabled):hover { background: #3a3128; }
      .dk-btn-success { background: var(--success); color: white; }
      .dk-btn-success:not(:disabled):hover { box-shadow: 0 4px 14px rgba(63,143,95,.35); }
      .dk-btn-marigold { background: var(--marigold); color: white; }
      .dk-btn-marigold:not(:disabled):hover { box-shadow: 0 4px 14px rgba(221,154,46,.35); }
      .dk-btn-danger { background: var(--danger-soft); color: var(--danger); }
      .dk-btn-danger:not(:disabled):hover { background: #f3c9c2; }
      .dk-btn-outline { background: var(--paper); color: var(--ink); border-color: var(--line); }
      .dk-btn-outline:not(:disabled):hover { border-color: var(--ink-soft); }

      .dk-badge {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 12px; font-weight: 700; letter-spacing: .01em;
        padding: 4px 10px; border-radius: 999px; white-space: nowrap;
      }

      .dk-input {
        border: 1.5px solid var(--line);
        border-radius: 12px;
        background: var(--paper);
        padding: 10px 14px;
        font-family: 'Inter', sans-serif;
        outline: none;
        transition: border-color .12s ease;
      }
      .dk-input:focus { border-color: var(--ink); }

      .dk-nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 14px; border-radius: 12px;
        color: var(--canvas-soft); font-weight: 600; font-size: 14.5px;
        cursor: pointer; transition: background .12s ease, color .12s ease;
      }
      .dk-nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .dk-nav-item.active { background: var(--marigold); color: #2a1c05; }

      .dk-stat-card {
        position: relative; overflow: hidden;
      }

      @keyframes dk-fade-in { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
      .dk-fade-in { animation: dk-fade-in .18s ease; }

      @media (max-width: 900px) {
        .dk-sidebar { display: none !important; }
        .dk-mobile-nav { display: flex !important; }
      }
    `}</style>
  );
}

function BrushDivider({ color = "var(--clay)", width = 120 }) {
  return (
    <svg width={width} height="10" viewBox="0 0 120 10" fill="none" style={{ display: "block", marginTop: 4, marginBottom: 2 }}>
      <path d="M2 6.5C18 2.5 34 8.5 50 5.5C66 2.5 82 8 98 4.5C104 3.3 112 5 118 3.5"
        stroke={color} strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

// ---------- Small reusable UI atoms ----------
function Badge({ tone = "ink", children, icon: Icon }) {
  const tones = {
    ink: { bg: "var(--canvas-soft)", fg: "var(--ink)" },
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    warn: { bg: "var(--marigold-soft)", fg: "#8a5a0f" },
    mirror: { bg: "var(--mirror-soft)", fg: "var(--mirror)" },
    clay: { bg: "var(--clay-soft)", fg: "var(--clay)" },
    violet: { bg: "var(--violet-soft)", fg: "var(--violet)" },
  };
  const t = tones[tone] || tones.ink;
  return (
    <span className="dk-badge" style={{ background: t.bg, color: t.fg }}>
      {Icon ? <Icon size={12} strokeWidth={2.75} /> : null}
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "var(--ink)", accentSoft = "var(--canvas-soft)" }) {
  return (
    <div className="dk-card dk-stat-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 700, letterSpacing: ".02em", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={accent} strokeWidth={2.3} />
        </div>
      </div>
      <div className="dk-display dk-tabular" style={{ fontSize: 30, fontWeight: 600, marginTop: 8, lineHeight: 1 }}>
        {value}
      </div>
      {sub ? <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ eyebrow, title, color = "var(--clay)" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {eyebrow ? (
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className="dk-display" style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{title}</h2>
      <BrushDivider color={color} />
    </div>
  );
}

function Donut({ segments, size = 132, thickness = 20 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });
  const bg = stops.length ? `conic-gradient(${stops.join(",")})` : "var(--canvas-soft)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg }} />
      <div style={{
        position: "absolute", inset: thickness, borderRadius: "50%", background: "var(--paper)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div className="dk-display dk-tabular" style={{ fontSize: 22, fontWeight: 600 }}>{total}</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 600 }}>total</div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, children, width = 440 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(34,29,24,0.45)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dk-card dk-fade-in dk-scroll"
        style={{ width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", padding: 22, position: "relative" }}
      >
        <button
          onClick={onClose}
          className="dk-btn"
          style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, background: "var(--canvas-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tones = {
    success: { bg: "var(--success)", Icon: CheckCircle2 },
    danger: { bg: "var(--danger)", Icon: AlertCircle },
    info: { bg: "var(--ink)", Icon: Sparkles },
  };
  const t = tones[toast.tone] || tones.info;
  return (
    <div className="dk-fade-in" style={{
      position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 200,
      background: t.bg, color: "#fff", padding: "12px 20px", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14,
      boxShadow: "0 10px 30px rgba(0,0,0,.25)", maxWidth: "90vw",
    }}>
      <t.Icon size={17} />
      {toast.message}
    </div>
  );
}


// ---------- Data context: exposes the merged (original + walk-in) registrations/participants ----------
const DataContext = createContext({ REGS: [], PARTS: [] });
function useData() {
  return useContext(DataContext);
}

// ---------- Navigation ----------
let EVENT_TITLE = "Event";
let EVENT_EYEBROW = "";
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "participants", label: "Participants", icon: Users },
  { id: "checkin", label: "Check-In", icon: Ticket },
  { id: "kits", label: "Kit Manager", icon: Palette },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "forms", label: "Forms", icon: ClipboardList, adminOnly: true },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "admin", label: "Event Admin", icon: ShieldCheck, adminOnly: true },
];

function Sidebar({ page, setPage, issueCount, syncOk, items, user, role, onSwitch, onLogout }) {
  return (
    <div className="dk-sidebar" style={{
      width: 232, flexShrink: 0, background: "var(--ink)", minHeight: "100vh",
      padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ padding: "4px 10px 20px" }}>
        {EVENT_EYEBROW ? <div style={{ color: "var(--marigold)", fontSize: 11, fontWeight: 800, letterSpacing: ".14em" }}>{EVENT_EYEBROW.toUpperCase()}</div> : null}
        <div className="dk-display" style={{ color: "#fff", fontSize: 23, fontWeight: 600, lineHeight: 1.15, marginTop: 2 }}>{EVENT_TITLE}</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5, marginTop: 3 }}>Event Control Room</div>
      </div>
      {items.map((item) => (
        <div key={item.id} className={cx("dk-nav-item", page === item.id && "active")} onClick={() => setPage(item.id)}>
          <item.icon size={17} strokeWidth={2.3} />
          {item.label}
          {item.id === "issues" && issueCount > 0 ? (
            <span style={{
              marginLeft: "auto", background: page === item.id ? "rgba(0,0,0,.2)" : "var(--danger)",
              color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "1px 7px",
            }}>{issueCount}</span>
          ) : null}
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 6, color: "rgba(255,255,255,0.5)", fontSize: 11.5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: syncOk ? "#5FD498" : "#E0A32E" }} />
          {syncOk ? "Synced" : "Offline — retrying"}
        </div>
        <div>{user} · {role}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={onSwitch}>Switch event</span>
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={onLogout}>Sign out</span>
        </div>
      </div>
    </div>
  );
}

function MobileNav({ page, setPage, items }) {
  return (
    <div className="dk-mobile-nav" style={{
      display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: "var(--ink)", padding: "6px 4px", justifyContent: "space-around",
      boxShadow: "0 -4px 16px rgba(0,0,0,.2)", overflowX: "auto",
    }}>
      {items.map((item) => (
        <div key={item.id} onClick={() => setPage(item.id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "6px 8px", color: page === item.id ? "var(--marigold)" : "rgba(255,255,255,0.55)",
          fontSize: 9.5, fontWeight: 700, flexShrink: 0,
        }}>
          <item.icon size={18} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ---------- Event-state read helpers ----------
function getParticipantState(state, key) {
  return (state.participants && state.participants[key]) || {};
}
function getRegState(state, regId) {
  return (state.registrations && state.registrations[regId]) || {};
}
function isCheckedIn(state, key) {
  return !!getParticipantState(state, key).checkedIn;
}
function isKitGiven(state, regId) {
  return !!getRegState(state, regId).kitGiven;
}
function getPaymentStatus(state, regId) {
  return getRegState(state, regId).paymentStatus || "pending"; // pending | verified | issue
}
function getManualIssue(state, regId) {
  return getRegState(state, regId).manualIssue || null;
}

// ---------- Participant Profile ----------
function ProfileContent({ participant, state, onCheckIn, onKitGive, onPayment }) {
  if (!participant) return null;
  const checked = isCheckedIn(state, participant.key);
  const pState = getParticipantState(state, participant.key);
  const kitG = isKitGiven(state, participant.regId);
  const regState = getRegState(state, participant.regId);
  const payStatus = getPaymentStatus(state, participant.regId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, background: "var(--marigold-soft)", color: "#8a5a0f",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, flexShrink: 0,
        }} className="dk-display">
          {(participant.name || "?").trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="dk-display" style={{ fontSize: 19, fontWeight: 600 }}>{participant.name || "Unnamed"}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6 }}>
            Reg {participant.regId} · {participant.numParticipants === 2 ? "Team of 2" : "Solo"}
            {participant.isWalkIn ? <Badge tone="violet" icon={UserPlus}>Walk-in</Badge> : null}
          </div>
        </div>
      </div>

      {participant.teammates.length ? (
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>
          Registered with <b style={{ color: "var(--ink)" }}>{participant.teammates.join(", ")}</b>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <InfoRow icon={Phone} label="Phone" value={participant.phone || "—"} />
        <InfoRow icon={Mail} label="Email" value={participant.email || "—"} small />
        <InfoRow icon={GraduationCap} label="Year" value={participant.year ? (YEAR_LABELS[participant.year] || participant.year) : "—"} />
        <InfoRow icon={Package} label="Kit" value={KIT_LABELS[participant.kitType] || participant.kitType} />
      </div>

      <div className="dk-card" style={{ marginTop: 16, padding: 14, background: "var(--canvas-soft)", border: "none" }}>
        <StatusLine label="Registration" ok icon={CheckCircle2} text="Registered" />
        <StatusLine
          label="Payment"
          ok={payStatus === "verified"}
          bad={payStatus === "issue"}
          icon={payStatus === "verified" ? ShieldCheck : payStatus === "issue" ? ShieldAlert : ShieldQuestion}
          text={payStatus === "verified" ? "Verified" : payStatus === "issue" ? "Issue flagged" : "Not yet verified"}
        />
        <StatusLine
          label="Attendance"
          ok={checked}
          icon={checked ? CheckCircle2 : Clock}
          text={checked ? `Checked in — ${fmtTime(pState.checkedInAt)}` : "Not checked in"}
        />
        <StatusLine
          label="Kit"
          ok={kitG}
          icon={kitG ? CheckCircle2 : Clock}
          text={kitG ? `Distributed — ${fmtTime(regState.kitGivenAt)}` : "Not distributed"}
          last
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button className={cx("dk-btn", checked ? "dk-btn-outline" : "dk-btn-success")} style={{ flex: 1, padding: "11px 10px", fontSize: 13.5 }}
          onClick={() => onCheckIn(participant)}>
          {checked ? "✓ Checked In" : "✅ Check In"}
        </button>
        <button className={cx("dk-btn", kitG ? "dk-btn-outline" : "dk-btn-marigold")} style={{ flex: 1, padding: "11px 10px", fontSize: 13.5 }}
          onClick={() => onKitGive(participant)}>
          {kitG ? "✓ Kit Given" : "🎨 Give Kit"}
        </button>
      </div>
      {participant.price !== null ? (
        <button
          className="dk-btn dk-btn-outline"
          style={{ width: "100%", marginTop: 8, padding: "10px", fontSize: 13 }}
          onClick={() => onPayment(participant, payStatus === "verified" ? "pending" : "verified")}
        >
          {payStatus === "verified" ? "Mark payment as unverified" : `Verify payment · ${fmtMoney(participant.price)}`}
        </button>
      ) : null}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, small }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: small ? 12.5 : 14, fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function StatusLine({ label, ok, bad, icon: Icon, text, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: bad ? "var(--danger)" : ok ? "var(--success)" : "var(--ink-soft)" }}>
        <Icon size={13.5} /> {text}
      </span>
    </div>
  );
}

// ---------- Dashboard page ----------
function DashboardPage({ stats, state, setPage, openProfile, openAddWalkIn }) {
  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow="Live overview" title="Event Dashboard" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => openAddWalkIn()}>
          <UserPlus size={15} /> Add Walk-in
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <StatCard label="Total Registrations" value={stats.totalRegs} sub={stats.walkInCount ? `${stats.originalCount} pre-registered + ${stats.walkInCount} walk-in` : `${stats.totalParticipants} participants`} icon={Users} accent="var(--violet)" accentSoft="var(--violet-soft)" />
        <StatCard label="Total Participants" value={stats.totalParticipants} sub={`${stats.soloCount} solo · ${stats.teamCount} teams`} icon={Users} accent="var(--ink)" accentSoft="var(--canvas-soft)" />
        {KIT_KEYS.map((k) => (
          <StatCard key={k} label={KIT_LABELS[k]} value={stats.byKit[k] || 0} sub="registrations" icon={Palette} accent={KIT_COLORS[k]} accentSoft={KIT_SOFT[k]} />
        ))}
        <StatCard label="Pending Verification" value={stats.needsReview} sub="flagged kit selections" icon={AlertTriangle} accent="var(--danger)" accentSoft="var(--danger-soft)" />
        <StatCard label="Checked In" value={stats.checkedInCount} sub={`of ${stats.totalParticipants} participants`} icon={CheckCircle2} accent="var(--success)" accentSoft="var(--success-soft)" />
        <StatCard label="Kits Distributed" value={stats.kitsGivenCount} sub={`of ${stats.kitsRequired} kits`} icon={Package} accent="var(--marigold)" accentSoft="var(--marigold-soft)" />
        <StatCard label="Kits Remaining" value={stats.kitsRequired - stats.kitsGivenCount} sub="left to distribute" icon={Package} accent="var(--ink)" accentSoft="var(--canvas-soft)" />
        <StatCard label="Expected Revenue" value={fmtMoney(stats.expectedRevenue)} sub="from valid registrations" icon={Wallet} accent="var(--violet)" accentSoft="var(--violet-soft)" />
        <StatCard label="Collected" value={fmtMoney(stats.collectedRevenue)} sub={`${stats.verifiedCount} payments verified`} icon={Wallet} accent="var(--success)" accentSoft="var(--success-soft)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14, marginTop: 22 }} className="dk-grid-2">
        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Kit split" title="Participation Breakdown" color="var(--mirror)" />
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <Donut segments={[
              ...KIT_KEYS.map((k) => ({ label: KIT_LABELS[k], value: stats.byKit[k] || 0, color: KIT_COLORS[k] })),
              { label: "Needs review", value: stats.needsReview, color: "var(--danger)" },
            ]} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minWidth: 160 }}>
              {[
                ...KIT_KEYS.map((k) => [KIT_LABELS[k], stats.byKit[k] || 0, KIT_COLORS[k]]),
                ["Needs review", stats.needsReview, "var(--danger)"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
                  <span className="dk-tabular" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Funnel" title="Registration Status" color="var(--violet)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Registered", stats.totalParticipants, "var(--ink)"],
              ["Checked In", stats.checkedInCount, "var(--success)"],
              ["Kit Given", stats.kitsGivenParticipants, "var(--marigold)"],
              ["Pending Check-In", stats.totalParticipants - stats.checkedInCount, "var(--ink-soft)"],
            ].map(([label, val, color]) => {
              const pct = stats.totalParticipants ? Math.round((val / stats.totalParticipants) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span className="dk-tabular" style={{ color: "var(--ink-soft)" }}>{val} · {pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--canvas-soft)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width .3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dk-card" style={{ padding: 20, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle eyebrow="What's happening now" title="Live Activity" color="var(--marigold)" />
          <button className="dk-btn dk-btn-outline" style={{ padding: "8px 14px", fontSize: 12.5, marginBottom: 14 }} onClick={() => setPage("checkin")}>
            Go to Check-In <ChevronRight size={13} style={{ display: "inline", verticalAlign: -2 }} />
          </button>
        </div>
        {stats.activity.length === 0 ? (
          <div style={{ color: "var(--ink-soft)", fontSize: 13.5, padding: "10px 0" }}>
            No check-ins or kit distributions yet. Once the desk opens, activity will show up here in real time.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stats.activity.slice(0, 10).map((a, i) => (
              <div key={i} onClick={() => openProfile(a.participant)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 4px",
                borderBottom: i === Math.min(9, stats.activity.length - 1) ? "none" : "1px solid var(--line)",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontSize: 13.5, flex: 1 }}>
                  <b>{a.name}</b> {a.text}
                </span>
                <span className="dk-tabular" style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{fmtTime(a.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Participants page ----------
function ParticipantsPage({ state, openProfile, openAddWalkIn }) {
  const { PARTS } = useData();
  const [q, setQ] = useState("");
  const [kitFilter, setKitFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [attFilter, setAttFilter] = useState("all");
  const [kitStatusFilter, setKitStatusFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return PARTS.filter((p) => {
      if (qq) {
        const hay = `${p.name} ${p.phone} ${p.email}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      if (kitFilter !== "all" && p.kitType !== kitFilter) return false;
      if (yearFilter !== "all" && String(p.year) !== yearFilter) return false;
      const checked = isCheckedIn(state, p.key);
      if (attFilter === "in" && !checked) return false;
      if (attFilter === "out" && checked) return false;
      const kitG = isKitGiven(state, p.regId);
      if (kitStatusFilter === "given" && !kitG) return false;
      if (kitStatusFilter === "pending" && kitG) return false;
      const pay = getPaymentStatus(state, p.regId);
      if (payFilter !== "all" && pay !== payFilter) return false;
      return true;
    });
  }, [q, kitFilter, yearFilter, attFilter, kitStatusFilter, payFilter, state, PARTS]);

  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow={`${filtered.length} of ${PARTS.length} shown`} title="Participants" color="var(--mirror)" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => openAddWalkIn()}>
          <UserPlus size={15} /> Add Walk-in
        </button>
      </div>

      <div className="dk-card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink-soft)" }} />
          <input className="dk-input" style={{ width: "100%", paddingLeft: 36 }} placeholder="Search by name, phone, or email…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FilterSelect label="Kit" value={kitFilter} onChange={setKitFilter} options={[["all", "All kits"], ...KIT_KEYS.map((k) => [k, KIT_LABELS[k]]), ["Multiple-Flagged", "Needs review"]]} />
          <FilterSelect label="Year" value={yearFilter} onChange={setYearFilter} options={[["all", "All years"], ["1", "1st Year"], ["2", "2nd Year"], ["3", "3rd Year"], ["4", "4th Year"]]} />
          <FilterSelect label="Attendance" value={attFilter} onChange={setAttFilter} options={[["all", "All"], ["in", "Checked in"], ["out", "Not checked in"]]} />
          <FilterSelect label="Kit status" value={kitStatusFilter} onChange={setKitStatusFilter} options={[["all", "All"], ["given", "Kit given"], ["pending", "Kit pending"]]} />
          <FilterSelect label="Payment" value={payFilter} onChange={setPayFilter} options={[["all", "All"], ["verified", "Verified"], ["pending", "Pending"], ["issue", "Issue"]]} />
        </div>
      </div>

      <div className="dk-card dk-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 820 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--line)" }}>
              {["Name", "Phone", "Year", "Kit", "Attendance", "Kit Status", "Payment"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".03em", color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 400).map((p) => {
              const checked = isCheckedIn(state, p.key);
              const kitG = isKitGiven(state, p.regId);
              const pay = getPaymentStatus(state, p.regId);
              return (
                <tr key={p.key} onClick={() => openProfile(p)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas-soft)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "9px 12px", fontWeight: 600 }}>
                    {p.name || <span style={{ color: "var(--danger)" }}>Unnamed</span>}
                    {p.isWalkIn ? <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 800, color: "var(--violet)" }}>WALK-IN</span> : null}
                  </td>
                  <td style={{ padding: "9px 12px", color: "var(--ink-soft)" }} className="dk-tabular">{p.phone || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{p.year ? YEAR_LABELS[p.year] || p.year : "—"}</td>
                  <td style={{ padding: "9px 12px" }}><Badge tone={kitTone(p.kitType)}>{KIT_LABELS[p.kitType]}</Badge></td>
                  <td style={{ padding: "9px 12px" }}>{checked ? <Badge tone="success" icon={CheckCircle2}>In</Badge> : <Badge tone="ink" icon={Clock}>Waiting</Badge>}</td>
                  <td style={{ padding: "9px 12px" }}>{kitG ? <Badge tone="warn" icon={CheckCircle2}>Given</Badge> : <Badge tone="ink" icon={Clock}>Pending</Badge>}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {pay === "verified" ? <Badge tone="success" icon={ShieldCheck}>Verified</Badge> : pay === "issue" ? <Badge tone="danger" icon={ShieldAlert}>Issue</Badge> : <Badge tone="ink" icon={ShieldQuestion}>Pending</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>No participants match these filters.</div> : null}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select className="dk-input" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{label}: {l}</option>)}
    </select>
  );
}

// ---------- Check-In page ----------
function CheckInPage({ state, onCheckIn, onKitGive, onIssue, showToast, openAddWalkIn }) {
  const { PARTS } = useData();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [];
    return PARTS.filter((p) => `${p.name} ${p.phone} ${p.email}`.toLowerCase().includes(qq)).slice(0, 8);
  }, [q, PARTS]);

  const pick = (p) => {
    setSelected(p);
    setQ("");
  };

  const doCheckIn = (p) => {
    if (isCheckedIn(state, p.key)) { showToast("Already checked in.", "info"); return; }
    onCheckIn(p);
    showToast(`${p.name} checked in ✓`, "success");
  };
  const doKit = (p) => {
    if (isKitGiven(state, p.regId)) { showToast("Kit already given for this registration — duplicate blocked.", "danger"); return; }
    onKitGive(p);
    showToast(`Kit marked as given for ${p.name}'s registration`, "success");
  };
  const doIssue = (p) => {
    const note = window.prompt(`Describe the issue for ${p.name} (registration ${p.regId}):`);
    if (note === null) return;
    onIssue(p, note || "Flagged at check-in desk");
    showToast("Issue recorded.", "danger");
  };

  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow="Registration desk" title="Check-In Mode" color="var(--success)" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => openAddWalkIn()}>
          <UserPlus size={15} /> Add Walk-in
        </button>
      </div>

      {!selected ? (
        <div className="dk-card" style={{ padding: 20 }}>
          <div style={{ position: "relative" }}>
            <Search size={20} style={{ position: "absolute", left: 16, top: 16 }} />
            <input
              ref={inputRef} autoFocus
              className="dk-input"
              style={{ width: "100%", paddingLeft: 44, fontSize: 18, padding: "14px 14px 14px 44px" }}
              placeholder="Search name, phone, or email…"
              value={q} onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            {q.trim().length >= 2 && results.length === 0 ? (
              <div style={{ color: "var(--ink-soft)", padding: "16px 4px" }}>
                No matching participant found. Double-check spelling or try their phone number.
                <div style={{ marginTop: 10 }}>
                  <button className="dk-btn dk-btn-outline" style={{ padding: "9px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => openAddWalkIn(q.trim())}>
                    <Plus size={14} /> Register "{q.trim()}" as a walk-in
                  </button>
                </div>
              </div>
            ) : null}
            {results.map((p) => {
              const checked = isCheckedIn(state, p.key);
              return (
                <div key={p.key} onClick={() => pick(p)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 10px",
                  borderBottom: "1px solid var(--line)", cursor: "pointer", borderRadius: 10,
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas-soft)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--marigold-soft)", color: "#8a5a0f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }} className="dk-display">
                    {(p.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name || "Unnamed"} {p.isWalkIn ? <span style={{ fontSize: 10, fontWeight: 800, color: "var(--violet)" }}>WALK-IN</span> : null}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{p.phone} · {KIT_LABELS[p.kitType]}</div>
                  </div>
                  {checked ? <Badge tone="success" icon={CheckCircle2}>Checked in</Badge> : null}
                  <ChevronRight size={18} color="var(--ink-soft)" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <CheckInCard participant={selected} state={state} onBack={() => setSelected(null)}
          onCheckIn={doCheckIn} onKitGive={doKit} onIssue={doIssue} />
      )}
    </div>
  );
}

function CheckInCard({ participant, state, onBack, onCheckIn, onKitGive, onIssue }) {
  const p = participant;
  const checked = isCheckedIn(state, p.key);
  const pState = getParticipantState(state, p.key);
  const kitG = isKitGiven(state, p.regId);
  const pay = getPaymentStatus(state, p.regId);

  return (
    <div className="dk-card dk-fade-in" style={{ padding: 24 }}>
      <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5, marginBottom: 16 }} onClick={onBack}>
        <ArrowLeft size={13} style={{ display: "inline", verticalAlign: -2, marginRight: 4 }} /> New search
      </button>

      {checked ? (
        <div style={{ background: "var(--success-soft)", color: "var(--success)", padding: "10px 14px", borderRadius: 12, fontWeight: 800, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} /> CHECKED IN ✓ — {fmtTime(pState.checkedInAt)}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14, marginBottom: 18 }}>
        <BigField label="Name" value={p.name || "Unnamed"} />
        <BigField label="Kit Type" value={KIT_LABELS[p.kitType]} />
        <BigField label="Year" value={p.year ? (YEAR_LABELS[p.year] || p.year) : "—"} />
        <BigField label="Phone" value={p.phone || "—"} />
        <BigField label="Payment" value={pay === "verified" ? "Verified" : pay === "issue" ? "Issue" : "Pending"} tone={pay === "verified" ? "success" : pay === "issue" ? "danger" : "warn"} />
      </div>

      {p.teammates.length ? (
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
          Registered with <b style={{ color: "var(--ink)" }}>{p.teammates.join(", ")}</b> — one kit is issued per registration.
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <button className={cx("dk-btn", checked ? "dk-btn-outline" : "dk-btn-success")} style={{ padding: "18px 8px", fontSize: 15 }} onClick={() => onCheckIn(p)}>
          ✅ CHECK IN
        </button>
        <button className={cx("dk-btn", kitG ? "dk-btn-outline" : "dk-btn-marigold")} style={{ padding: "18px 8px", fontSize: 15 }} onClick={() => onKitGive(p)}>
          🎨 KIT GIVEN
        </button>
        <button className="dk-btn dk-btn-danger" style={{ padding: "18px 8px", fontSize: 15 }} onClick={() => onIssue(p)}>
          ❌ MARK ISSUE
        </button>
      </div>
    </div>
  );
}

function BigField({ label, value, tone }) {
  const tones = { success: "var(--success)", danger: "var(--danger)", warn: "#8a5a0f" };
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>{label}</div>
      <div className="dk-display" style={{ fontSize: 19, fontWeight: 600, marginTop: 2, color: tone ? tones[tone] : "var(--ink)" }}>{value}</div>
    </div>
  );
}

// ---------- Kit Manager page ----------
function KitManagerPage({ stats, state, onKitGive, showToast }) {
  const { PARTS } = useData();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [];
    return PARTS.filter((p) => `${p.name} ${p.phone} ${p.email}`.toLowerCase().includes(qq)).slice(0, 6);
  }, [q, PARTS]);

  const cards = KIT_KEYS.map((k) => ({ key: k, label: KIT_LABELS[k], color: KIT_COLORS[k], soft: KIT_SOFT[k] }));

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="One kit per registration (team)" title="Kit Manager" color="var(--marigold)" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14, marginBottom: 18 }}>
        {cards.map((c) => {
          const required = stats.byKit[c.key] || 0;
          const distributed = stats.kitGivenByType[c.key] || 0;
          const remaining = required - distributed;
          const pct = required ? Math.round((distributed / required) * 100) : 0;
          return (
            <div key={c.key} className="dk-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                <div className="dk-display" style={{ fontWeight: 600, fontSize: 17 }}>{c.label}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <Stat label="Required" val={required} />
                <Stat label="Distributed" val={distributed} />
                <Stat label="Remaining" val={remaining} />
              </div>
              <div style={{ height: 9, borderRadius: 999, background: c.soft, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: c.color, transition: "width .3s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      {stats.needsReview > 0 ? (
        <div className="dk-card" style={{ padding: "14px 18px", marginBottom: 18, background: "var(--danger-soft)", border: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} color="var(--danger)" />
          <div style={{ fontSize: 13.5, color: "#7a2b20" }}>
            <b>{stats.needsReview}</b> registration(s) selected more than one kit type on the form and are excluded from required-kit counts until resolved. See Issues.
          </div>
        </div>
      ) : null}

      <div className="dk-card" style={{ padding: 18 }}>
        <SectionTitle eyebrow="Quick action" title="Give a Kit" color="var(--mirror)" />
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink-soft)" }} />
          <input className="dk-input" style={{ width: "100%", paddingLeft: 36 }} placeholder="Search name or phone to give kit…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          {results.map((p) => {
            const kitG = isKitGiven(state, p.regId);
            return (
              <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{p.phone} · {KIT_LABELS[p.kitType]}</div>
                </div>
                <button className={cx("dk-btn", kitG ? "dk-btn-outline" : "dk-btn-marigold")} style={{ padding: "9px 14px", fontSize: 13 }}
                  onClick={() => {
                    if (kitG) { showToast("Kit already given — duplicate blocked.", "danger"); return; }
                    onKitGive(p);
                    showToast(`Kit given for ${p.name}'s registration ✓`, "success");
                  }}>
                  {kitG ? "✓ Given" : "Give Kit"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div>
      <div style={{ color: "var(--ink-soft)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div className="dk-display dk-tabular" style={{ fontSize: 18, fontWeight: 600 }}>{val}</div>
    </div>
  );
}

// ---------- Payments page ----------
function PaymentsPage({ stats, state, onPayment, openProfile }) {
  const { REGS, PARTS } = useData();
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    return REGS.filter((r) => r.price !== null).filter((r) => {
      if (filter === "all") return true;
      return getPaymentStatus(state, r.id) === filter;
    });
  }, [filter, state, REGS]);

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Collection tracker" title="Payments" color="var(--violet)" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="Expected" value={fmtMoney(stats.expectedRevenue)} icon={Wallet} accent="var(--violet)" accentSoft="var(--violet-soft)" />
        <StatCard label="Collected" value={fmtMoney(stats.collectedRevenue)} sub={`${stats.verifiedCount} verified`} icon={ShieldCheck} accent="var(--success)" accentSoft="var(--success-soft)" />
        <StatCard label="Pending" value={fmtMoney(stats.pendingRevenue)} sub={`${stats.pendingCount} awaiting`} icon={ShieldQuestion} accent="var(--marigold)" accentSoft="var(--marigold-soft)" />
        <StatCard label="Flagged" value={stats.issuePayCount} sub="payment issues" icon={ShieldAlert} accent="var(--danger)" accentSoft="var(--danger-soft)" />
      </div>

      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <AlertCircle size={13} />
        The form collects a payment-proof screenshot for every registration, but not a confirmed paid/pending status. Use "Verify" below after checking each proof.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["all", "All"], ["verified", "Verified"], ["pending", "Pending"], ["issue", "Issue"]].map(([v, l]) => (
          <button key={v} className={cx("dk-btn", filter === v ? "dk-btn-primary" : "dk-btn-outline")} style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="dk-card dk-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--line)" }}>
              {["Reg", "Participant(s)", "Kit", "Amount", "Proof", "Status", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pay = getPaymentStatus(state, r.id);
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "9px 12px", color: "var(--ink-soft)" }} className="dk-tabular">{r.id}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 600, cursor: "pointer" }} onClick={() => openProfile(PARTS.find((p) => p.regId === r.id))}>
                    {r.participants.map((p) => p.name).filter(Boolean).join(" & ") || "Unnamed"}
                  </td>
                  <td style={{ padding: "9px 12px" }}><Badge tone={kitTone(r.kitType)}>{KIT_LABELS[r.kitType]}</Badge></td>
                  <td style={{ padding: "9px 12px" }} className="dk-tabular">{fmtMoney(r.price)}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {r.paymentProofLink ? (
                      <a href={proofHref(r.paymentProofLink)} target="_blank" rel="noreferrer" style={{ color: "var(--mirror)", fontWeight: 600, fontSize: 12.5 }}>View</a>
                    ) : (
                      <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{r.isWalkIn ? "Collected at desk" : "—"}</span>
                    )}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {pay === "verified" ? <Badge tone="success" icon={ShieldCheck}>Verified</Badge> : pay === "issue" ? <Badge tone="danger" icon={ShieldAlert}>Issue</Badge> : <Badge tone="ink" icon={ShieldQuestion}>Pending</Badge>}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="dk-btn dk-btn-outline" style={{ padding: "5px 10px", fontSize: 11.5 }} onClick={() => onPayment(r.id, "verified")}>Verify</button>
                      <button className="dk-btn dk-btn-outline" style={{ padding: "5px 10px", fontSize: 11.5 }} onClick={() => onPayment(r.id, "issue")}>Issue</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>No registrations in this filter.</div> : null}
      </div>
    </div>
  );
}

// ---------- Issues page ----------
function IssuesPage({ allIssues, state, onResolve }) {
  const [filter, setFilter] = useState("open");

  const withStatus = allIssues.map((iss) => ({
    ...iss,
    resolved: (state.resolvedIssues || {})[iss.id] || false,
  }));
  const shown = withStatus.filter((i) => (filter === "open" ? !i.resolved : filter === "resolved" ? i.resolved : true));

  const sevStyle = { error: "danger", warn: "warn", info: "ink" };

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow={`${withStatus.filter((i) => !i.resolved).length} unresolved`} title="Issues" color="var(--danger)" />

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["open", "Open"], ["resolved", "Resolved"], ["all", "All"]].map(([v, l]) => (
          <button key={v} className={cx("dk-btn", filter === v ? "dk-btn-primary" : "dk-btn-outline")} style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="dk-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>
          {filter === "open" ? "No open issues. The data looks clean! 🎉" : "Nothing here yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((iss) => (
            <div key={iss.id} className="dk-card" style={{ padding: 16, opacity: iss.resolved ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge tone={sevStyle[iss.severity]} icon={AlertTriangle}>{iss.type}</Badge>
                    {iss.manual ? <Badge tone="violet">Reported at desk</Badge> : null}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{iss.message}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>Registrations: {iss.regIds.join(", ")}</div>
                </div>
                <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => onResolve(iss.id, !iss.resolved)}>
                  {iss.resolved ? "Reopen" : "Resolve"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Reports page (summary + insights + exports) ----------
function ReportsPage({ stats, state, allIssues }) {
  const { REGS, PARTS } = useData();
  const byYear = stats.byYear;
  const maxYearCount = Math.max(1, ...Object.values(byYear));
  const noShowCount = stats.totalParticipants - stats.checkedInCount;
  const attendanceRate = stats.totalParticipants ? Math.round((stats.checkedInCount / stats.totalParticipants) * 100) : 0;
  const collectionRate = stats.expectedRevenue ? Math.round((stats.collectedRevenue / stats.expectedRevenue) * 100) : 0;
  const openIssues = allIssues.filter((i) => !(state.resolvedIssues || {})[i.id]).length;

  const mostPopularKit = [...KIT_KEYS].sort((a, b) => (stats.byKit[b] || 0) - (stats.byKit[a] || 0))[0];
  const mostYear = Object.entries(byYear).sort((a, b) => b[1] - a[1])[0];
  const multiKitRegs = REGS.filter((r) => r.kitType === "Multiple-Flagged").length;

  const exportRows = () => PARTS.map((p) => ({
    RegistrationID: p.regId, Name: p.name, Phone: p.phone, Email: p.email,
    Year: p.year ? (YEAR_LABELS[p.year] || p.year) : "", School: p.school, Programme: p.programme,
    Kit: KIT_LABELS[p.kitType], Amount: p.price ?? "",
    CheckedIn: isCheckedIn(state, p.key) ? "Yes" : "No",
    CheckedInAt: getParticipantState(state, p.key).checkedInAt || "",
    KitGiven: isKitGiven(state, p.regId) ? "Yes" : "No",
    PaymentStatus: getPaymentStatus(state, p.regId),
    Source: p.isWalkIn ? "Walk-in" : "Pre-registered",
  }));

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Post-event report" title="Reports & Insights" color="var(--marigold)" />

      <div className="dk-card" style={{ padding: 22, marginBottom: 18 }}>
        <div className="dk-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".04em", color: "var(--ink-soft)", textTransform: "uppercase" }}>{EVENT_TITLE} — Event Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginTop: 14 }}>
          <SummaryStat label="Total Registrations" val={stats.totalRegs} />
          <SummaryStat label="Participants Attended" val={stats.checkedInCount} />
          {KIT_KEYS.map((k) => <SummaryStat key={k} label={KIT_LABELS[k]} val={stats.byKit[k] || 0} />)}
          <SummaryStat label="Kits Distributed" val={stats.kitsGivenCount} />
          <SummaryStat label="Total Revenue (Verified)" val={fmtMoney(stats.collectedRevenue)} />
          <SummaryStat label="Pending Payments" val={fmtMoney(stats.pendingRevenue)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }} className="dk-grid-2">
        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="By class year" title="Participation by Year" color="var(--mirror)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4].map((y) => {
              const val = byYear[y] || 0;
              const pct = Math.round((val / maxYearCount) * 100);
              return (
                <div key={y}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{YEAR_LABELS[y]}</span>
                    <span className="dk-tabular" style={{ color: "var(--ink-soft)" }}>{val}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--canvas-soft)" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "var(--mirror)" }} />
                  </div>
                </div>
              );
            })}
            {stats.totalParticipants - Object.values(byYear).reduce((a, b) => a + b, 0) > 0 ? (
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>* {stats.totalParticipants - Object.values(byYear).reduce((a, b) => a + b, 0)} participants have no year on file.</div>
            ) : null}
          </div>
        </div>

        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Attendance" title="Rate & No-Shows" color="var(--success)" />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Donut segments={[{ value: stats.checkedInCount, color: "var(--success)" }, { value: noShowCount, color: "var(--canvas-soft)" }]} size={104} thickness={16} />
            <div>
              <div className="dk-display" style={{ fontSize: 26, fontWeight: 600 }}>{attendanceRate}%</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>checked in so far</div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}><b>{noShowCount}</b> not yet checked in</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dk-card" style={{ padding: 20, marginBottom: 18 }}>
        <SectionTitle eyebrow="Based only on this event's data" title="Smart Insights" color="var(--violet)" />
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 7, fontSize: 13.5 }}>
          <li>{mostPopularKit ? <>Most popular kit: <b>{KIT_LABELS[mostPopularKit]}</b> ({stats.byKit[mostPopularKit] || 0} registrations).</> : "No kit types configured."}</li>
          <li>Most represented year: <b>{mostYear ? YEAR_LABELS[mostYear[0]] : "Not enough data"}</b>{mostYear ? ` (${mostYear[1]} participants)` : ""}.</li>
          <li>{multiKitRegs > 0 ? <><b>{multiKitRegs}</b> registration(s) selected multiple kit options and need manual review before counting toward kit stock.</> : "No registrations have ambiguous kit selections."}</li>
          <li>Expected attendance: <b>{stats.totalParticipants}</b> participants across <b>{stats.totalRegs}</b> registrations.</li>
          <li>{stats.checkedInCount === 0 ? "No-show rate isn't meaningful yet — check-in hasn't started." : <>No-show rate so far: <b>{100 - attendanceRate}%</b> ({noShowCount} of {stats.totalParticipants}).</>}</li>
          <li>Payment collection rate: <b>{collectionRate}%</b> of expected revenue verified{stats.pendingCount ? ` — ${stats.pendingCount} registrations still awaiting verification` : ""}.</li>
          <li>Operational concerns: <b>{openIssues}</b> unresolved data issue(s) flagged. {openIssues > 0 ? "Review the Issues page before the desk gets busy." : "No open issues right now."}</li>
          {stats.walkInCount ? <li><b>{stats.walkInCount}</b> registration(s) were added on the spot at the desk, on top of {stats.originalCount} pre-registered.</li> : null}
        </ul>
      </div>

      <div className="dk-card" style={{ padding: 20 }}>
        <SectionTitle eyebrow="Share with the core team" title="Data Export" color="var(--clay)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <ExportBtn label="Full Participant List" onClick={() => downloadCSV(`${FILE_PREFIX}-participants.csv`, exportRows())} />
          <ExportBtn label="Check-In List" onClick={() => downloadCSV(`${FILE_PREFIX}-checkins.csv`, exportRows().filter((r) => r.CheckedIn === "Yes"))} />
          <ExportBtn label="Kit Distribution List" onClick={() => downloadCSV(`${FILE_PREFIX}-kits.csv`, exportRows().filter((r) => r.KitGiven === "Yes"))} />
          <ExportBtn label="Payment Report" onClick={() => downloadCSV(`${FILE_PREFIX}-payments.csv`, exportRows().map((r) => ({ RegistrationID: r.RegistrationID, Name: r.Name, Kit: r.Kit, Amount: r.Amount, PaymentStatus: r.PaymentStatus })))} />
          <ExportBtn label="Issues Report" onClick={() => downloadCSV(`${FILE_PREFIX}-issues.csv`, allIssues.map((i) => ({ Type: i.type, Severity: i.severity, Message: i.message, Registrations: i.regIds.join("; "), Resolved: (state.resolvedIssues || {})[i.id] ? "Yes" : "No" })))} />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, val }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div className="dk-display dk-tabular" style={{ fontSize: 24, fontWeight: 600 }}>{val}</div>
    </div>
  );
}

function ExportBtn({ label, onClick }) {
  return (
    <button className="dk-btn dk-btn-outline" style={{ padding: "12px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }} onClick={onClick}>
      <Download size={15} /> {label}
    </button>
  );
}

// ---------- OC Control Panel (event-day command center) ----------
function OCPanelPage({ stats, allIssues, state, setPage }) {
  const openIssues = allIssues.filter((i) => !(state.resolvedIssues || {})[i.id]).length;
  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Single-screen command center" title="OC Control Panel" color="var(--violet)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 14 }}>
        <PanelBlock title="Registration Desk" color="var(--success)" onClick={() => setPage("checkin")}>
          <PanelRow label="Total expected" val={stats.totalParticipants} />
          <PanelRow label="Checked in" val={stats.checkedInCount} />
          <PanelRow label="Remaining" val={stats.totalParticipants - stats.checkedInCount} />
        </PanelBlock>
        <PanelBlock title="Kit Distribution" color="var(--marigold)" onClick={() => setPage("kits")}>
          {KIT_KEYS.map((k) => <PanelRow key={k} label={`${KIT_LABELS[k]} remaining`} val={(stats.byKit[k] || 0) - (stats.kitGivenByType[k] || 0)} />)}
        </PanelBlock>
        <PanelBlock title="Payment Desk" color="var(--violet)" onClick={() => setPage("payments")}>
          <PanelRow label="Verified" val={stats.verifiedCount} />
          <PanelRow label="Pending" val={stats.pendingCount} />
          <PanelRow label="Flagged" val={stats.issuePayCount} />
        </PanelBlock>
        <PanelBlock title="Issues" color="var(--danger)" onClick={() => setPage("issues")}>
          <PanelRow label="Unresolved" val={openIssues} />
          <PanelRow label="Total flagged" val={allIssues.length} />
        </PanelBlock>
      </div>
    </div>
  );
}

function PanelBlock({ title, color, children, onClick }) {
  return (
    <div className="dk-card" style={{ padding: 18, cursor: "pointer" }} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
        <div className="dk-display" style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
        <ChevronRight size={15} style={{ marginLeft: "auto", color: "var(--ink-soft)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{children}</div>
    </div>
  );
}
function PanelRow({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
      <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      <span className="dk-tabular" style={{ fontWeight: 700 }}>{val}</span>
    </div>
  );
}

// ---------- Settings page ----------
function SettingsPage({ onReset, syncOk, stats, isAdmin }) {
  const { REGS, PARTS } = useData();
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Event configuration" title="Settings" color="var(--ink-soft)" />

      <div className="dk-card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Data source</div>
        <PanelRow label="Pre-registered (imported)" val={stats.originalCount} />
        <PanelRow label="Added on the spot" val={stats.walkInCount} />
        <PanelRow label="Total registrations" val={REGS.length} />
        <PanelRow label="Total participants" val={PARTS.length} />
        <PanelRow label="Event-day sync" val={syncOk ? "Shared across devices" : "This device only"} />
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
          Imported registration data is read-only here (admins can import more from Event Admin). Check-ins, kit distribution, payment verification, and walk-in entries are stored separately and never modify the source list.
        </div>
      </div>

      {isAdmin ? <div className="dk-card" style={{ padding: 20, border: "1.5px solid var(--danger-soft)" }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "var(--danger)" }}>Reset event-day data</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
          Clears all check-ins, kit distributions, payment verifications, issue resolutions, <b>and any walk-in registrations added on the spot</b>, for everyone. Imported registration data is never affected. This cannot be undone.
        </div>
        {!showConfirm ? (
          <button className="dk-btn dk-btn-danger" style={{ padding: "10px 16px", fontSize: 13.5 }} onClick={() => setShowConfirm(true)}>Reset Event-Day Data…</button>
        ) : (
          <div>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>Type <b>RESET</b> to confirm:</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="dk-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} style={{ flex: 1 }} placeholder="RESET" />
              <button className="dk-btn dk-btn-danger" disabled={confirmText !== "RESET"} style={{ padding: "10px 16px", fontSize: 13.5 }}
                onClick={() => { onReset(); setShowConfirm(false); setConfirmText(""); }}>
                Confirm Reset
              </button>
              <button className="dk-btn dk-btn-outline" style={{ padding: "10px 16px", fontSize: 13.5 }} onClick={() => { setShowConfirm(false); setConfirmText(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </div> : null}
    </div>
  );
}

// ---------- Add Walk-in modal (on-the-spot registration) ----------
function emptyWalkInForm(prefillName) {
  return {
    name: prefillName || "", phone: "", email: "", year: "", school: "", programme: "",
    kitType: KIT_KEYS[0] || "", cashCollected: true,
    hasTeammate: false, teammateName: "", teammatePhone: "", teammateYear: "", teammateSchool: "", teammateProgramme: "",
  };
}

function AddWalkInModal({ open, onClose, onSubmit, prefillName }) {
  const [form, setForm] = useState(() => emptyWalkInForm(prefillName));

  useEffect(() => {
    if (open) setForm(emptyWalkInForm(prefillName));
  }, [open, prefillName]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const phoneOk = (p) => /^\d{10}$/.test(p.trim());

  const nameOk = form.name.trim().length > 0;
  const phoneValid = phoneOk(form.phone);
  const teammateOk = !form.hasTeammate || (form.teammateName.trim().length > 0 && phoneOk(form.teammatePhone));
  const canSubmit = nameOk && phoneValid && form.kitType && teammateOk;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--marigold-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UserPlus size={18} color="#8a5a0f" />
        </div>
        <div>
          <div className="dk-display" style={{ fontSize: 18, fontWeight: 600 }}>Add Walk-in Registration</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Stored separately from the uploaded Excel — never overwrites it.</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <FieldRow>
          <Field label="Name *"><input className="dk-input" style={{ width: "100%" }} value={form.name} onChange={set("name")} placeholder="Participant name" /></Field>
          <Field label="Phone *"><input className="dk-input" style={{ width: "100%" }} value={form.phone} onChange={set("phone")} placeholder="10-digit mobile" /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Email"><input className="dk-input" style={{ width: "100%" }} value={form.email} onChange={set("email")} placeholder="optional" /></Field>
          <Field label="Year">
            <select className="dk-input" style={{ width: "100%" }} value={form.year} onChange={set("year")}>
              <option value="">—</option>
              <option value="1">1st Year</option><option value="2">2nd Year</option>
              <option value="3">3rd Year</option><option value="4">4th Year</option>
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="School"><input className="dk-input" style={{ width: "100%" }} value={form.school} onChange={set("school")} placeholder="optional" /></Field>
          <Field label="Programme"><input className="dk-input" style={{ width: "100%" }} value={form.programme} onChange={set("programme")} placeholder="optional" /></Field>
        </FieldRow>

        <Field label="Kit *">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {KIT_KEYS.map((k) => (
              <button key={k} type="button"
                className={cx("dk-btn", form.kitType === k ? "dk-btn-primary" : "dk-btn-outline")}
                style={{ flex: 1, padding: "9px 6px", fontSize: 12.5 }}
                onClick={() => setForm((f) => ({ ...f, kitType: k }))}>
                {KIT_LABELS[k]}<br /><span style={{ fontWeight: 500, opacity: 0.8 }}>{fmtMoney(KIT_PRICES[k])}</span>
              </button>
            ))}
          </div>
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={form.hasTeammate} onChange={(e) => setForm((f) => ({ ...f, hasTeammate: e.target.checked }))} />
          Registering as a team of 2
        </label>

        {form.hasTeammate ? (
          <div style={{ background: "var(--canvas-soft)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <FieldRow>
              <Field label="Teammate name *"><input className="dk-input" style={{ width: "100%" }} value={form.teammateName} onChange={set("teammateName")} /></Field>
              <Field label="Teammate phone *"><input className="dk-input" style={{ width: "100%" }} value={form.teammatePhone} onChange={set("teammatePhone")} /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Year">
                <select className="dk-input" style={{ width: "100%" }} value={form.teammateYear} onChange={set("teammateYear")}>
                  <option value="">—</option>
                  <option value="1">1st Year</option><option value="2">2nd Year</option>
                  <option value="3">3rd Year</option><option value="4">4th Year</option>
                </select>
              </Field>
              <Field label="School"><input className="dk-input" style={{ width: "100%" }} value={form.teammateSchool} onChange={set("teammateSchool")} /></Field>
            </FieldRow>
          </div>
        ) : null}

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 2 }}>
          <input type="checkbox" checked={form.cashCollected} onChange={(e) => setForm((f) => ({ ...f, cashCollected: e.target.checked }))} />
          Payment collected at the desk (marks as verified)
        </label>

        {!phoneValid && form.phone ? <div style={{ fontSize: 11.5, color: "var(--danger)" }}>Phone number should be 10 digits.</div> : null}

        <button className="dk-btn dk-btn-success" disabled={!canSubmit} style={{ padding: "13px 10px", fontSize: 14.5, marginTop: 6 }} onClick={submit}>
          ✅ Add Registration & Check In
        </button>
      </div>
    </Modal>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".02em" }}>{label}</div>
      {children}
    </div>
  );
}

// ---------- Event app (one event, backed by the API) ----------
export function EventApp({ slug, onSwitch, onLogout }) {
  const [snap, setSnap] = useState(null);
  const [fatal, setFatal] = useState(null);
  const [syncOk, setSyncOk] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [profileParticipant, setProfileParticipant] = useState(null);
  const [toast, setToast] = useState(null);
  const [addWalkInOpen, setAddWalkInOpen] = useState(false);
  const [walkInPrefill, setWalkInPrefill] = useState("");
  const toastTimer = useRef(null);
  const inflight = useRef(0);

  const showToast = (message, tone = "info") => {
    setToast({ message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const refresh = async () => {
    try {
      const d = await api("GET", `/events/${slug}/data`);
      if (inflight.current === 0) setSnap(d);
      setSyncOk(true);
    } catch (e) {
      if (e.status === 401) { onLogout(); return; }
      if (e.status === 403 || e.status === 404) { setFatal(e.message); return; }
      setSyncOk(false);
    }
  };

  useEffect(() => {
    setSnap(null); setFatal(null); setPage("dashboard");
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const state = snap?.state || EMPTY_STATE;
  const regs = snap?.registrations;
  const REGS = useMemo(() => regs || [], [regs]);
  const PARTS = useMemo(() => flattenParticipants(REGS), [REGS]);
  const dataCtx = useMemo(() => ({ REGS, PARTS }), [REGS, PARTS]);
  const allIssues = snap?.issues || [];
  const isAdmin = snap?.role === "admin";

  if (snap) {
    applyEventConfig(snap.config, slug);
    EVENT_TITLE = snap.config.name;
    EVENT_EYEBROW = snap.config.branding?.eyebrow || "";
  }

  // optimistic local update + server write; on failure, say so and re-sync
  const act = async (optimistic, method, path, body) => {
    inflight.current++;
    setSnap((s) => (s ? { ...s, state: optimistic(s.state || EMPTY_STATE) } : s));
    try {
      const r = await api(method, `/events/${slug}${path}`, body);
      return r;
    } catch (e) {
      if (e.status === 401) { onLogout(); return null; }
      showToast(e.message, "danger");
      return null;
    } finally {
      inflight.current--;
      refresh();
    }
  };

  const nowIso = () => new Date().toISOString();
  const me = snap?.user;

  const onCheckIn = (p) => act(
    (s) => ({ ...s, participants: { ...s.participants, [p.key]: { ...(s.participants[p.key] || {}), checkedIn: true, checkedInAt: nowIso(), by: me } } }),
    "POST", `/registrations/${encodeURIComponent(p.regId)}/checkin`, { pIndex: p.pIndex });

  const onKitGive = (p) => act(
    (s) => ({ ...s, registrations: { ...s.registrations, [p.regId]: { ...(s.registrations[p.regId] || {}), kitGiven: true, kitGivenAt: nowIso(), kitGivenBy: me } } }),
    "POST", `/registrations/${encodeURIComponent(p.regId)}/kit-give`);

  const onPayment = (regIdOrParticipant, status) => {
    const regId = typeof regIdOrParticipant === "string" ? regIdOrParticipant : regIdOrParticipant.regId;
    return act(
      (s) => ({ ...s, registrations: { ...s.registrations, [regId]: { ...(s.registrations[regId] || {}), paymentStatus: status, paymentAt: nowIso(), paymentBy: me } } }),
      "POST", `/registrations/${encodeURIComponent(regId)}/payment`, { status });
  };

  const onIssue = (p, note) => act(
    (s) => ({ ...s, registrations: { ...s.registrations, [p.regId]: { ...(s.registrations[p.regId] || {}), manualIssue: note, manualIssueAt: nowIso(), manualIssueBy: me } } }),
    "POST", `/registrations/${encodeURIComponent(p.regId)}/issue`, { note });

  const onResolveIssue = (issueId, resolved) => act(
    (s) => ({ ...s, resolvedIssues: { ...(s.resolvedIssues || {}), [issueId]: resolved } }),
    "POST", `/issues/${encodeURIComponent(issueId)}/resolve`, { resolved });

  const onReset = async () => {
    const r = await act(() => ({ ...EMPTY_STATE }), "POST", "/reset", { confirm: "RESET" });
    if (r) showToast("Event-day data cleared", "success");
  };

  const openProfile = (p) => { if (p) setProfileParticipant(p); };
  const openAddWalkIn = (prefillName = "") => { setWalkInPrefill(prefillName); setAddWalkInOpen(true); };

  const onAddWalkIn = async (form) => {
    inflight.current++;
    try {
      const r = await api("POST", `/events/${slug}/registrations/walkin`, { form, cashCollected: !!form.cashCollected });
      setAddWalkInOpen(false);
      showToast(`${r.registration.participants.map((p) => p.name).join(" & ")} added and checked in ✓`, "success");
    } catch (e) {
      showToast(e.message, "danger");
    } finally {
      inflight.current--;
      await refresh();
    }
  };

  const walkInRegs = useMemo(() => REGS.filter((r) => r.isWalkIn), [REGS]);

  const stats = useMemo(() => {
    const byKit = Object.fromEntries(KIT_KEYS.map((k) => [k, 0]));
    let needsReview = 0;
    let expectedRevenue = 0;
    let soloCount = 0, teamCount = 0;
    REGS.forEach((r) => {
      if (r.kitType === "Multiple-Flagged" || r.kitType === "Unknown") { needsReview += r.kitType === "Multiple-Flagged" ? 1 : 0; }
      else byKit[r.kitType] = (byKit[r.kitType] || 0) + 1;
      if (r.price) expectedRevenue += r.price;
      if (r.numParticipants === 1) soloCount++; else teamCount++;
    });

    let checkedInCount = 0;
    PARTS.forEach((p) => { if (isCheckedIn(state, p.key)) checkedInCount++; });

    let kitsGivenCount = 0;
    let kitsGivenParticipants = 0;
    const kitGivenByType = Object.fromEntries(KIT_KEYS.map((k) => [k, 0]));
    REGS.forEach((r) => {
      if (isKitGiven(state, r.id)) {
        kitsGivenCount++;
        kitsGivenParticipants += r.numParticipants;
        if (kitGivenByType[r.kitType] !== undefined) kitGivenByType[r.kitType]++;
      }
    });
    const kitsRequired = Object.values(byKit).reduce((a, b) => a + b, 0);

    let collectedRevenue = 0, pendingRevenue = 0, verifiedCount = 0, pendingCount = 0, issuePayCount = 0;
    REGS.forEach((r) => {
      if (r.price === null) return;
      const st = getPaymentStatus(state, r.id);
      if (st === "verified") { collectedRevenue += r.price; verifiedCount++; }
      else if (st === "issue") { issuePayCount++; }
      else { pendingRevenue += r.price; pendingCount++; }
    });

    const byYear = {};
    PARTS.forEach((p) => { if (p.year) byYear[p.year] = (byYear[p.year] || 0) + 1; });

    const activity = [];
    Object.entries(state.participants || {}).forEach(([key, v]) => {
      if (v.checkedIn) {
        const p = PARTS.find((pp) => pp.key === key);
        if (p) activity.push({ time: v.checkedInAt, icon: "✅", name: p.name, text: "checked in", participant: p });
      }
    });
    Object.entries(state.registrations || {}).forEach(([regId, v]) => {
      if (v.kitGiven) {
        const p = PARTS.find((pp) => pp.regId === regId);
        if (p) activity.push({ time: v.kitGivenAt, icon: "🎨", name: p.name + (p.teammates.length ? ` & ${p.teammates.join(", ")}` : ""), text: "received their kit", participant: p });
      }
      if (v.paymentStatus === "verified") {
        const p = PARTS.find((pp) => pp.regId === regId);
        if (p) activity.push({ time: v.paymentAt, icon: "💰", name: p.name, text: "payment verified", participant: p });
      }
    });
    walkInRegs.forEach((r) => {
      const p = PARTS.find((pp) => pp.regId === r.id);
      if (p) activity.push({ time: r.timestamp, icon: "📝", name: r.participants.map((pp) => pp.name).join(" & "), text: "registered as a walk-in", participant: p });
    });
    activity.sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
      totalRegs: REGS.length, totalParticipants: PARTS.length,
      originalCount: REGS.length - walkInRegs.length, walkInCount: walkInRegs.length,
      byKit, needsReview, expectedRevenue, soloCount, teamCount,
      checkedInCount, kitsGivenCount, kitsGivenParticipants, kitsRequired, kitGivenByType,
      collectedRevenue, pendingRevenue, verifiedCount, pendingCount, issuePayCount, byYear, activity,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, REGS, PARTS, walkInRegs, snap?.config]);

  if (fatal || !snap) {
    return (
      <div className="dk-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--ink-soft)", textAlign: "center" }}>
          {fatal ? (
            <>
              <AlertCircle size={26} />
              <div>{fatal}</div>
              <button className="dk-btn dk-btn-outline" style={{ padding: "8px 14px" }} onClick={onSwitch}>Back to events</button>
            </>
          ) : (
            <>
              <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              Loading event data…
            </>
          )}
        </div>
      </div>
    );
  }

  const navItems = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <DataContext.Provider value={dataCtx}>
      <div className="dk-root" style={{ display: "flex", minHeight: "100vh" }}>
        <GlobalStyles />
        <Sidebar page={page} setPage={setPage} items={navItems} user={snap.user} role={snap.role} onSwitch={onSwitch} onLogout={onLogout}
          issueCount={allIssues.filter((i) => !(state.resolvedIssues || {})[i.id]).length} syncOk={syncOk} />
        <div style={{ flex: 1, minWidth: 0, padding: "22px 24px 90px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6, gap: 8 }}>
            {page === "dashboard" ? (
              <button className="dk-btn dk-btn-outline" style={{ padding: "7px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setPage("ocpanel")}>
                <BarChart3 size={13} /> OC Control Panel
              </button>
            ) : null}
            <button className="dk-btn dk-btn-outline" style={{ padding: "7px 10px", fontSize: 12.5 }} onClick={refresh}>
              <RefreshCw size={13} />
            </button>
          </div>

          {page === "dashboard" && <DashboardPage stats={stats} state={state} setPage={setPage} openProfile={openProfile} openAddWalkIn={openAddWalkIn} />}
          {page === "participants" && <ParticipantsPage state={state} openProfile={openProfile} openAddWalkIn={openAddWalkIn} />}
          {page === "checkin" && <CheckInPage state={state} onCheckIn={onCheckIn} onKitGive={onKitGive} onIssue={onIssue} showToast={showToast} openAddWalkIn={openAddWalkIn} />}
          {page === "kits" && <KitManagerPage stats={stats} state={state} onKitGive={onKitGive} showToast={showToast} />}
          {page === "payments" && <PaymentsPage stats={stats} state={state} onPayment={onPayment} openProfile={openProfile} />}
          {page === "issues" && <IssuesPage allIssues={allIssues} state={state} onResolve={onResolveIssue} />}
          {page === "reports" && <ReportsPage stats={stats} state={state} allIssues={allIssues} />}
          {page === "settings" && <SettingsPage onReset={onReset} syncOk={syncOk} stats={stats} isAdmin={isAdmin} />}
          {page === "admin" && isAdmin && <AdminPage slug={slug} config={snap.config} onChanged={refresh} showToast={showToast} />}
          {page === "forms" && isAdmin && <FormsPage slug={slug} showToast={showToast} />}
          {page === "ocpanel" && <OCPanelPage stats={stats} allIssues={allIssues} state={state} setPage={setPage} />}
        </div>
        <MobileNav page={page} setPage={setPage} items={navItems} />

        <Modal open={!!profileParticipant} onClose={() => setProfileParticipant(null)}>
          <ProfileContent participant={profileParticipant} state={state} onCheckIn={onCheckIn} onKitGive={onKitGive} onPayment={onPayment} />
        </Modal>

        <AddWalkInModal open={addWalkInOpen} onClose={() => setAddWalkInOpen(false)} onSubmit={onAddWalkIn} prefillName={walkInPrefill} />

        <Toast toast={toast} />
      </div>
    </DataContext.Provider>
  );
}

export { GlobalStyles };
