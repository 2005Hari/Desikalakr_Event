import express from "express";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { SLUG_RE } from "./store.js";
import { flattenParticipants, computeIssues, buildWalkInRegistration, parseRegistrationSheet, sanitizeFormFields, validateAnswers } from "./domain.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const httpErr = (code, message) => Object.assign(new Error(message), { code });

const adminsGroup = (slug) => `event-${slug}-admins`;
const volunteersGroup = (slug) => `event-${slug}-volunteers`;

export function createApp({ store, identity, jwtSecret, creatorGroup = "event-creators", superAdmins = [] }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // ---- groups cache (short TTL so role changes apply quickly without hammering Nextcloud) ----
  const groupCache = new Map();
  async function groupsOf(user) {
    const hit = groupCache.get(user);
    if (hit && Date.now() - hit.at < 30_000) return hit.groups;
    const groups = await identity.groupsOf(user);
    groupCache.set(user, { at: Date.now(), groups });
    return groups;
  }
  const dropGroups = (user) => groupCache.delete(user);

  const roleFor = (groups, slug, user) => {
    if (groups.includes(adminsGroup(slug))) return "admin";
    if (groups.includes(volunteersGroup(slug))) return "volunteer";
    if (superAdmins.includes(user)) return "admin";
    return null;
  };

  // ---- auth ----
  const auth = wrap(async (req, _res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : req.query.token;
    if (!token) throw httpErr(401, "Not signed in");
    try {
      req.user = jwt.verify(token, jwtSecret).sub;
    } catch {
      throw httpErr(401, "Session expired, please sign in again");
    }
    next();
  });

  async function eventsFor(user) {
    const groups = await groupsOf(user);
    const all = await store.listEvents();
    return all
      .map((e) => ({ ...e, role: roleFor(groups, e.slug, user) }))
      .filter((e) => e.role);
  }

  const eventAccess = (minRole = "volunteer") =>
    wrap(async (req, _res, next) => {
      const { slug } = req.params;
      const config = await store.getConfig(slug);
      if (!config) throw httpErr(404, "Event not found");
      const role = roleFor(await groupsOf(req.user), slug, req.user);
      if (!role) throw httpErr(403, "You don't have access to this event");
      if (minRole === "admin" && role !== "admin") throw httpErr(403, "Admin access required");
      req.config = config;
      req.role = role;
      next();
    });

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/auth/login", wrap(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) throw httpErr(400, "Username and password required");
    if (!(await identity.verify(username, password))) throw httpErr(401, "Wrong username or password");
    dropGroups(username);
    const token = jwt.sign({ sub: username }, jwtSecret, { expiresIn: "12h" });
    const groups = await groupsOf(username);
    res.json({ token, user: { username, canCreateEvents: groups.includes(creatorGroup) || superAdmins.includes(username) }, events: await eventsFor(username) });
  }));

  app.get("/api/me", auth, wrap(async (req, res) => {
    const groups = await groupsOf(req.user);
    res.json({ user: { username: req.user, canCreateEvents: groups.includes(creatorGroup) || superAdmins.includes(req.user) }, events: await eventsFor(req.user) });
  }));

  // ---- events ----
  app.get("/api/events", auth, wrap(async (req, res) => res.json(await eventsFor(req.user))));

  app.post("/api/events", auth, wrap(async (req, res) => {
    const groups = await groupsOf(req.user);
    if (!groups.includes(creatorGroup) && !superAdmins.includes(req.user)) throw httpErr(403, "You can't create events");
    const { slug, name, kitTypes = [], branding = {} } = req.body || {};
    if (!SLUG_RE.test(slug || "")) throw httpErr(400, "Slug must be 3-40 chars: lowercase letters, digits, hyphens");
    if (!name?.trim()) throw httpErr(400, "Event name required");
    const config = { name: name.trim(), branding, kitTypes: sanitizeKits(kitTypes), createdBy: req.user };
    await identity.createGroup(adminsGroup(slug));
    await identity.createGroup(volunteersGroup(slug));
    await store.createEvent(slug, config);
    await identity.addToGroup(req.user, adminsGroup(slug));
    dropGroups(req.user);
    res.status(201).json({ slug, config });
  }));

  app.get("/api/events/:slug/config", auth, eventAccess(), (req, res) => res.json(req.config));

  app.put("/api/events/:slug/config", auth, eventAccess("admin"), wrap(async (req, res) => {
    const patch = {};
    if (req.body.name) patch.name = String(req.body.name).trim();
    if (req.body.branding) patch.branding = req.body.branding;
    if (req.body.kitTypes) patch.kitTypes = sanitizeKits(req.body.kitTypes);
    res.json(await store.updateConfig(req.params.slug, patch));
  }));

  // ---- team ----
  app.get("/api/events/:slug/team", auth, eventAccess("admin"), wrap(async (req, res) => {
    const { slug } = req.params;
    const [admins, volunteers] = await Promise.all([identity.membersOf(adminsGroup(slug)), identity.membersOf(volunteersGroup(slug))]);
    res.json({ admins, volunteers });
  }));

  app.post("/api/events/:slug/team", auth, eventAccess("admin"), wrap(async (req, res) => {
    const { username, role = "volunteer", password, displayName } = req.body || {};
    if (!username || !/^[\w.@-]{2,64}$/.test(username)) throw httpErr(400, "Valid username required");
    if (!["admin", "volunteer"].includes(role)) throw httpErr(400, "Role must be admin or volunteer");
    if (password) await identity.createUser(username, password, displayName);
    const { slug } = req.params;
    const other = role === "admin" ? volunteersGroup(slug) : adminsGroup(slug);
    await identity.removeFromGroup(username, other);
    await identity.addToGroup(username, role === "admin" ? adminsGroup(slug) : volunteersGroup(slug));
    dropGroups(username);
    res.status(201).json({ username, role });
  }));

  app.delete("/api/events/:slug/team/:username", auth, eventAccess("admin"), wrap(async (req, res) => {
    const { slug, username } = req.params;
    if (username === req.user) throw httpErr(400, "You can't remove yourself");
    await identity.removeFromGroup(username, adminsGroup(slug));
    await identity.removeFromGroup(username, volunteersGroup(slug));
    dropGroups(username);
    res.status(204).end();
  }));

  // ---- forms (admin) ----
  app.post("/api/events/:slug/forms", auth, eventAccess("admin"), wrap(async (req, res) => {
    const { title, description = "" } = req.body || {};
    if (!title?.trim()) throw httpErr(400, "Title required");
    const fields = sanitizeFormFields(req.body?.fields);
    const form = await store.createForm(req.params.slug, {
      title: title.trim(), description: String(description).slice(0, 2000), fields, status: "open", createdBy: req.user,
    });
    res.status(201).json(form);
  }));

  app.get("/api/events/:slug/forms", auth, eventAccess("admin"), wrap(async (req, res) => {
    res.json(await store.listForms(req.params.slug));
  }));

  app.get("/api/events/:slug/forms/:formId", auth, eventAccess("admin"), wrap(async (req, res) => {
    const form = await store.getForm(req.params.slug, req.params.formId);
    if (!form) throw httpErr(404, "Form not found");
    res.json(form);
  }));

  app.put("/api/events/:slug/forms/:formId", auth, eventAccess("admin"), wrap(async (req, res) => {
    const patch = { updatedAt: new Date().toISOString() };
    if (req.body?.title !== undefined) {
      if (!req.body.title.trim()) throw httpErr(400, "Title required");
      patch.title = req.body.title.trim();
    }
    if (req.body?.description !== undefined) patch.description = String(req.body.description).slice(0, 2000);
    if (req.body?.fields !== undefined) patch.fields = sanitizeFormFields(req.body.fields);
    if (req.body?.status !== undefined) {
      if (!["open", "closed"].includes(req.body.status)) throw httpErr(400, "Invalid status");
      patch.status = req.body.status;
    }
    const next = await store.updateForm(req.params.slug, req.params.formId, patch);
    if (!next) throw httpErr(404, "Form not found");
    res.json(next);
  }));

  app.get("/api/events/:slug/forms/:formId/submissions", auth, eventAccess("admin"), wrap(async (req, res) => {
    const form = await store.getForm(req.params.slug, req.params.formId);
    if (!form) throw httpErr(404, "Form not found");
    res.json({ form, submissions: await store.listSubmissions(req.params.slug, req.params.formId) });
  }));

  // ---- forms (public — no login; students fill these out from a shared link) ----
  app.get("/api/public/forms/:slug/:formId", wrap(async (req, res) => {
    const { slug, formId } = req.params;
    if (!SLUG_RE.test(slug)) throw httpErr(404, "Not found");
    const config = await store.getConfig(slug);
    const form = config && (await store.getForm(slug, formId));
    if (!form) throw httpErr(404, "Not found");
    res.json({ eventName: config.name, id: form.id, title: form.title, description: form.description, status: form.status, fields: form.fields });
  }));

  app.post("/api/public/forms/:slug/:formId/submit", wrap(async (req, res) => {
    const { slug, formId } = req.params;
    if (!SLUG_RE.test(slug)) throw httpErr(404, "Not found");
    const config = await store.getConfig(slug);
    const form = config && (await store.getForm(slug, formId));
    if (!form) throw httpErr(404, "Not found");
    if (form.status !== "open") throw httpErr(409, "This form is no longer accepting responses");
    const answers = validateAnswers(form.fields, req.body?.answers || {});
    const submission = { id: `sub_${crypto.randomBytes(8).toString("hex")}`, formId, submittedAt: new Date().toISOString(), answers };
    await store.addSubmission(slug, formId, submission);
    res.status(201).json({ ok: true });
  }));

  // ---- data ----
  async function snapshot(slug, config) {
    const [registrations, state] = await Promise.all([store.listRegistrations(slug), store.getState(slug)]);
    const participants = flattenParticipants(registrations);
    return { config, registrations, state, issues: computeIssues(registrations, participants) };
  }

  app.get("/api/events/:slug/data", auth, eventAccess(), wrap(async (req, res) => {
    res.json({ ...(await snapshot(req.params.slug, req.config)), role: req.role, user: req.user });
  }));

  app.post("/api/events/:slug/registrations/import", auth, eventAccess("admin"), upload.single("file"), wrap(async (req, res) => {
    const { slug } = req.params;
    const existing = await store.listRegistrations(slug);
    let regs, skipped = 0, columns;
    if (req.file) {
      await store.stageImport(slug, req.file.originalname, req.file.buffer, req.file.mimetype);
      const startAt = existing.filter((r) => !r.isWalkIn).length + 1;
      ({ registrations: regs, skipped, columns } = parseRegistrationSheet(req.file.buffer, req.config, { startAt }));
    } else if (Array.isArray(req.body?.registrations)) {
      regs = req.body.registrations;
    } else {
      throw httpErr(400, "Upload a CSV/XLSX file (field 'file') or send {registrations: []}");
    }
    if (!regs.length) throw httpErr(400, "No registrations found in the file");
    const taken = new Set(existing.map((r) => r.id));
    regs = regs.filter((r) => !taken.has(r.id));
    await store.addRegistrations(slug, regs);
    res.status(201).json({ imported: regs.length, skipped, columns });
  }));

  app.post("/api/events/:slug/registrations/walkin", auth, eventAccess(), wrap(async (req, res) => {
    const { slug } = req.params;
    const { form = {}, cashCollected = false } = req.body || {};
    if (!form.name?.trim()) throw httpErr(400, "Name required");
    if (!/^\d{10}$/.test((form.phone || "").trim())) throw httpErr(400, "Phone must be 10 digits");
    const id = `W-${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    const reg = buildWalkInRegistration(form, req.config, id);
    await store.addRegistrations(slug, [reg]);
    const at = new Date().toISOString();
    await store.mutateReg(slug, id, (s) => {
      reg.participants.forEach((_, i) => { s.participants[i] = { checkedIn: true, checkedInAt: at, by: req.user }; });
      if (cashCollected) s.reg = { ...s.reg, paymentStatus: "verified", paymentAt: at, paymentBy: req.user };
    });
    res.status(201).json({ registration: reg });
  }));

  const regAction = (handler) => [auth, eventAccess(), wrap(async (req, res) => {
    const { slug, regId } = req.params;
    const regs = await store.listRegistrations(slug);
    const reg = regs.find((r) => r.id === regId);
    if (!reg) throw httpErr(404, "Registration not found");
    const at = new Date().toISOString();
    await store.mutateReg(slug, regId, (s) => handler({ s, reg, at, body: req.body || {}, user: req.user }));
    res.json({ ok: true, at });
  })];

  app.post("/api/events/:slug/registrations/:regId/checkin", ...regAction(({ s, reg, at, body, user }) => {
    const i = Number(body.pIndex);
    if (!Number.isInteger(i) || i < 0 || i >= reg.participants.length) throw httpErr(400, "Invalid participant");
    if (s.participants[i]?.checkedIn) return;
    s.participants[i] = { checkedIn: true, checkedInAt: at, by: user };
  }));

  app.post("/api/events/:slug/registrations/:regId/kit-give", ...regAction(({ s, at, user }) => {
    if (s.reg.kitGiven) return;
    s.reg = { ...s.reg, kitGiven: true, kitGivenAt: at, kitGivenBy: user };
  }));

  app.post("/api/events/:slug/registrations/:regId/payment", ...regAction(({ s, at, body, user }) => {
    if (!["pending", "verified", "issue"].includes(body.status)) throw httpErr(400, "Invalid status");
    s.reg = { ...s.reg, paymentStatus: body.status, paymentAt: at, paymentBy: user };
  }));

  app.post("/api/events/:slug/registrations/:regId/issue", ...regAction(({ s, at, body, user }) => {
    s.reg = { ...s.reg, manualIssue: String(body.note || "").slice(0, 500), manualIssueAt: at, manualIssueBy: user };
  }));

  app.post("/api/events/:slug/issues/:issueId/resolve", auth, eventAccess(), wrap(async (req, res) => {
    await store.setResolved(req.params.slug, req.params.issueId, !!req.body?.resolved);
    res.json({ ok: true });
  }));

  app.post("/api/events/:slug/registrations/:regId/proof", auth, eventAccess(), upload.single("file"), wrap(async (req, res) => {
    const { slug, regId } = req.params;
    if (!req.file) throw httpErr(400, "File required");
    const reg = (await store.listRegistrations(slug)).find((r) => r.id === regId);
    if (!reg) throw httpErr(404, "Registration not found");
    const rel = await store.saveProof(slug, regId, req.file.originalname, req.file.buffer, req.file.mimetype);
    const link = `/api/events/${slug}/proofs/${rel}`;
    await store.addRegistrations(slug, [{ ...reg, paymentProofLink: link }], { overwrite: true });
    res.status(201).json({ paymentProofLink: link });
  }));

  app.get("/api/events/:slug/proofs/:regId/:file", auth, eventAccess(), wrap(async (req, res) => {
    const f = await store.getProof(req.params.slug, `${req.params.regId}/${req.params.file}`);
    if (!f) throw httpErr(404, "Not found");
    res.type(f.contentType || "application/octet-stream").send(f.buf);
  }));

  app.post("/api/events/:slug/reset", auth, eventAccess("admin"), wrap(async (req, res) => {
    if (req.body?.confirm !== "RESET") throw httpErr(400, 'Send {"confirm":"RESET"}');
    await store.resetState(req.params.slug);
    res.json({ ok: true });
  }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const code = Number.isInteger(err.code) && err.code >= 400 && err.code < 600 ? err.code : 500;
    if (code === 500) console.error(err);
    res.status(code).json({ error: code === 500 ? "Internal error" : err.message });
  });

  return app;
}

function sanitizeKits(kits) {
  if (!Array.isArray(kits)) throw httpErr(400, "kitTypes must be an array");
  const seen = new Set();
  return kits.map((k) => {
    const key = String(k.key || "").trim();
    if (!/^[\w-]{1,30}$/.test(key) || ["Multiple-Flagged", "Unknown"].includes(key)) throw httpErr(400, `Invalid kit key "${key}"`);
    if (seen.has(key)) throw httpErr(400, `Duplicate kit key "${key}"`);
    seen.add(key);
    const price = Number(k.price);
    if (!Number.isFinite(price) || price < 0) throw httpErr(400, `Invalid price for "${key}"`);
    return { key, label: String(k.label || key).trim(), price, color: k.color || null };
  });
}
