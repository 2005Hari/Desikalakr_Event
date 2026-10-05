import * as XLSX from "xlsx";

// ---- Form builder -------------------------------------------------------

const FIELD_TYPES = ["text", "textarea", "number", "email", "phone", "date", "dropdown", "radio", "checkbox"];
const CHOICE_TYPES = ["dropdown", "radio"];
const fail = (msg) => { throw Object.assign(new Error(msg), { code: 400 }); };

export function sanitizeFormFields(fields) {
  if (!Array.isArray(fields) || !fields.length) fail("Add at least one field");
  if (fields.length > 40) fail("Too many fields (max 40)");
  const seen = new Set();
  return fields.map((f, i) => {
    const type = String(f.type || "").trim();
    if (!FIELD_TYPES.includes(type)) fail(`Field ${i + 1}: invalid type "${type}"`);
    const label = String(f.label || "").trim().slice(0, 200);
    if (!label) fail(`Field ${i + 1}: label required`);
    const id = String(f.id || "").trim();
    if (!/^[\w-]{1,40}$/.test(id)) fail(`Field ${i + 1} ("${label}"): invalid field id`);
    if (seen.has(id)) fail(`Field ${i + 1} ("${label}"): duplicate field id`);
    seen.add(id);
    let options;
    if (type === "dropdown" || type === "radio" || type === "checkbox") {
      options = (Array.isArray(f.options) ? f.options : []).map((o) => String(o).trim().slice(0, 200)).filter(Boolean).slice(0, 30);
      if (CHOICE_TYPES.includes(type) && !options.length) fail(`Field ${i + 1} ("${label}"): needs at least one option`);
    }
    return { id, type, label, required: !!f.required, ...(options?.length ? { options } : {}) };
  });
}

// Validates submitted answers against a form's fields and returns a clean
// answers object keyed the same way — unknown keys in the submission are
// dropped, so a form can only ever record what it was built to ask for.
export function validateAnswers(fields, answers) {
  const out = {};
  for (const f of fields) {
    const raw = answers?.[f.id];
    if (f.type === "checkbox" && f.options) {
      const arr = Array.isArray(raw) ? raw.filter((v) => f.options.includes(v)) : [];
      if (f.required && !arr.length) fail(`"${f.label}" is required`);
      out[f.id] = arr;
    } else if (f.type === "checkbox") {
      const v = !!raw;
      if (f.required && !v) fail(`"${f.label}" is required`);
      out[f.id] = v;
    } else if (CHOICE_TYPES.includes(f.type)) {
      const v = String(raw ?? "").trim();
      if (f.required && !v) fail(`"${f.label}" is required`);
      if (v && !f.options.includes(v)) fail(`"${f.label}": invalid option`);
      out[f.id] = v;
    } else if (f.type === "number") {
      if (raw === "" || raw === null || raw === undefined) {
        if (f.required) fail(`"${f.label}" is required`);
        out[f.id] = null;
      } else {
        const n = Number(raw);
        if (!Number.isFinite(n)) fail(`"${f.label}" must be a number`);
        out[f.id] = n;
      }
    } else {
      const v = String(raw ?? "").trim().slice(0, 2000);
      if (f.required && !v) fail(`"${f.label}" is required`);
      out[f.id] = v;
    }
  }
  return out;
}

export function flattenParticipants(registrations) {
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

export function computeIssues(registrations, participants) {
  const issues = [];

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

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function matchKit(kitRaw, kitTypes) {
  const raw = norm(kitRaw);
  if (!raw) return { kitType: "Unknown", price: null };
  const hits = kitTypes.filter((k) => raw.includes(norm(k.label)) || raw.split(" ").includes(norm(k.key)));
  if (hits.length === 1) return { kitType: hits[0].key, price: hits[0].price };
  if (hits.length > 1) return { kitType: "Multiple-Flagged", price: null };
  return { kitType: "Unknown", price: null };
}

export function buildWalkInRegistration(form, config, id) {
  const kit = (config.kitTypes || []).find((k) => k.key === form.kitType);
  const participants = [{
    name: (form.name || "").trim(),
    phone: (form.phone || "").trim(),
    year: form.year ? Number(form.year) : null,
    school: (form.school || "").trim(),
    programme: (form.programme || "").trim(),
  }];
  if (form.hasTeammate) {
    participants.push({
      name: (form.teammateName || "").trim(),
      phone: (form.teammatePhone || "").trim(),
      year: form.teammateYear ? Number(form.teammateYear) : null,
      school: (form.teammateSchool || "").trim(),
      programme: (form.teammateProgramme || "").trim(),
    });
  }
  return {
    id,
    timestamp: new Date().toISOString(),
    email: (form.email || "").trim().toLowerCase(),
    numParticipants: participants.length,
    kitRaw: kit?.label || form.kitType || "",
    kitType: kit ? kit.key : "Unknown",
    price: kit ? kit.price : null,
    paymentProofLink: null,
    isWalkIn: true,
    participants,
  };
}

// ---- Spreadsheet import -------------------------------------------------

const FIELD_KEYWORDS = [
  ["email", ["email"]],
  ["timestamp", ["timestamp", "submitted"]],
  ["kit", ["kit", "workshop", "choose", "select", "package", "item", "ticket"]],
  ["proof", ["proof", "screenshot", "receipt", "payment"]],
  ["phone", ["phone", "mobile", "contact", "whatsapp"]],
  ["year", ["year"]],
  ["school", ["school", "college", "institute", "department"]],
  ["programme", ["programme", "program", "course", "branch"]],
  ["name", ["name"]],
];

function classifyHeader(h) {
  const n = norm(h);
  for (const [field, kws] of FIELD_KEYWORDS) if (kws.some((k) => n.includes(k))) return field;
  return null;
}

function participantIndex(h) {
  const n = norm(h);
  const m = n.match(/\b([1-9])\b/);
  if (m) return Number(m[1]) - 1;
  if (/\b(second|teammate|partner|member 2)\b/.test(n)) return 1;
  if (/\b(third)\b/.test(n)) return 2;
  return 0;
}

const cellStr = (v) => (v === undefined || v === null ? "" : String(v).trim());
const digits = (v) => cellStr(v).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

export function parseRegistrationSheet(buffer, config, { idPrefix = "R", startAt = 1 } = {}) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  if (!rows.length) return { registrations: [], skipped: 0, columns: {} };

  const headers = Object.keys(rows[0]);
  const columns = headers.map((h) => ({ h, field: classifyHeader(h), idx: participantIndex(h) }));
  const emailCol = columns.find((c) => c.field === "email")?.h;
  const tsCol = columns.find((c) => c.field === "timestamp")?.h;
  const kitCol = columns.find((c) => c.field === "kit")?.h;
  const proofCol = columns.find((c) => c.field === "proof" && !/amount|status/i.test(c.h))?.h;

  const regs = [];
  let skipped = 0;
  rows.forEach((row) => {
    const byIdx = {};
    for (const c of columns) {
      if (!["name", "phone", "year", "school", "programme"].includes(c.field)) continue;
      (byIdx[c.idx] = byIdx[c.idx] || {})[c.field] = row[c.h];
    }
    const participants = Object.keys(byIdx)
      .sort((a, b) => a - b)
      .map((k) => ({
        name: cellStr(byIdx[k].name),
        phone: digits(byIdx[k].phone),
        year: Number(cellStr(byIdx[k].year).match(/\d/)?.[0]) || null,
        school: cellStr(byIdx[k].school),
        programme: cellStr(byIdx[k].programme),
      }))
      .filter((p) => p.name || p.phone);
    if (!participants.length) { skipped++; return; }
    const kitRaw = cellStr(row[kitCol]);
    const { kitType, price } = matchKit(kitRaw, config.kitTypes || []);
    const ts = new Date(row[tsCol]);
    regs.push({
      id: `${idPrefix}${String(startAt + regs.length).padStart(3, "0")}`,
      timestamp: isNaN(ts) ? new Date().toISOString() : ts.toISOString(),
      email: cellStr(row[emailCol]).toLowerCase(),
      numParticipants: participants.length,
      kitRaw,
      kitType,
      price: price === null ? null : price * 1,
      paymentProofLink: cellStr(row[proofCol]) || null,
      isWalkIn: false,
      participants,
    });
  });
  return { registrations: regs, skipped, columns: Object.fromEntries(columns.map((c) => [c.h, c.field ? `${c.field}${c.idx ? ` #${c.idx + 1}` : ""}` : null])) };
}
