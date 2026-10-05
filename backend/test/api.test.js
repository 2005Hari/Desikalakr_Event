import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";
import { memoryStorage } from "../src/storage.js";
import { memoryIdentity } from "../src/identity.js";

let server, base, store;
const call = async (method, path, { token, body, form } = {}) => {
  const r = await fetch(base + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
};
const login = async (u, p) => (await call("POST", "/api/auth/login", { body: { username: u, password: p } })).json?.token;

before(async () => {
  store = createStore(memoryStorage());
  await store.init();
  const identity = memoryIdentity({
    users: { boss: "pw", vol1: "pw", vol2: "pw", outsider: "pw" },
    groups: { "event-creators": ["boss"] },
  });
  const app = createApp({ store, identity, jwtSecret: "test" });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

let boss, v1, out;

test("login works and rejects bad creds", async () => {
  assert.equal((await call("POST", "/api/auth/login", { body: { username: "boss", password: "x" } })).status, 401);
  boss = await login("boss", "pw"); v1 = await login("vol1", "pw"); out = await login("outsider", "pw");
  assert.ok(boss && v1 && out);
});

test("only creators can create events; slug validated", async () => {
  assert.equal((await call("POST", "/api/events", { token: v1, body: { slug: "fest-a", name: "A" } })).status, 403);
  assert.equal((await call("POST", "/api/events", { token: boss, body: { slug: "A!", name: "A" } })).status, 400);
  const r = await call("POST", "/api/events", { token: boss, body: { slug: "fest-a", name: "Fest A", kitTypes: [{ key: "Mirror", label: "Mirror Painting", price: 119 }, { key: "Canvas", label: "Canvas and Stand", price: 99 }, { key: "Combo", label: "Combo", price: 199 }] } });
  assert.equal(r.status, 201);
  assert.equal((await call("POST", "/api/events", { token: boss, body: { slug: "fest-a", name: "dup" } })).status, 409);
  await call("POST", "/api/events", { token: boss, body: { slug: "fest-b", name: "Fest B" } });
});

test("event visibility is per-team", async () => {
  await call("POST", "/api/events/fest-a/team", { token: boss, body: { username: "vol1", role: "volunteer" } });
  await call("POST", "/api/events/fest-b/team", { token: boss, body: { username: "vol2", role: "volunteer" } });
  v1 = await login("vol1", "pw");
  const mine = (await call("GET", "/api/events", { token: v1 })).json;
  assert.deepEqual(mine.map((e) => e.slug), ["fest-a"]);
  assert.equal((await call("GET", "/api/events/fest-b/data", { token: v1 })).status, 403);
  assert.equal((await call("GET", "/api/events/fest-a/data", { token: out })).status, 403);
  assert.equal((await call("PUT", "/api/events/fest-a/config", { token: v1, body: { name: "x" } })).status, 403);
});

test("import xlsx with configurable kits, issues detected", async () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Timestamp", "Email Address", "Name", "Phone Number", "Year", "School", "Programme", "Name of Participant 2", "Phone Number 2", "Which kit?", "Payment Screenshot"],
    ["2026-08-06 01:00", "a@x.com", "Aarav T", "9870015949", "2nd Year", "MPSTME", "MBA Tech", "Anushka G", "9399968315", "Combo [Rs.199]", "http://p/1"],
    ["2026-08-06 02:00", "a@x.com", "Rudra", "7426815935", "2", "MPSTME", "B.Tech", "", "", "Mirror Painting [Rs.119], Canvas and Stand [Rs.99]", ""],
    ["2026-08-06 03:00", "c@x.com", "Bad", "123", "3", "S", "P", "", "", "Mirror Painting [Rs.119]", ""],
  ]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "R");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const form = new FormData(); form.append("file", new Blob([buf]), "regs.xlsx");
  const r = await call("POST", "/api/events/fest-a/registrations/import", { token: boss, form });
  assert.equal(r.status, 201, r.text);
  assert.equal(r.json.imported, 3);
  const d = (await call("GET", "/api/events/fest-a/data", { token: boss })).json;
  const [r1, r2, r3] = d.registrations;
  assert.equal(r1.kitType, "Combo"); assert.equal(r1.price, 199); assert.equal(r1.participants.length, 2);
  assert.equal(r1.participants[1].name, "Anushka G"); assert.equal(r1.participants[0].year, 2);
  assert.equal(r2.kitType, "Multiple-Flagged");
  assert.equal(r3.kitType, "Mirror");
  const types = d.issues.map((i) => i.type);
  assert.ok(types.includes("Duplicate email")); assert.ok(types.includes("Multiple kits selected")); assert.ok(types.includes("Incomplete registration"));
  // re-import does not clobber existing ids
  const form2 = new FormData(); form2.append("file", new Blob([buf]), "regs.xlsx");
  const again = await call("POST", "/api/events/fest-a/registrations/import", { token: boss, form: form2 });
  assert.equal(again.status, 201);
  assert.equal((await call("GET", "/api/events/fest-a/data", { token: boss })).json.registrations.length, 6);
});

test("check-in / kit / payment / issue / resolve + attribution", async () => {
  const d0 = (await call("GET", "/api/events/fest-a/data", { token: v1 })).json;
  const id = d0.registrations[0].id;
  assert.equal((await call("POST", `/api/events/fest-a/registrations/${id}/checkin`, { token: v1, body: { pIndex: 0 } })).status, 200);
  assert.equal((await call("POST", `/api/events/fest-a/registrations/${id}/checkin`, { token: v1, body: { pIndex: 9 } })).status, 400);
  await call("POST", `/api/events/fest-a/registrations/${id}/kit-give`, { token: v1 });
  await call("POST", `/api/events/fest-a/registrations/${id}/payment`, { token: v1, body: { status: "verified" } });
  assert.equal((await call("POST", `/api/events/fest-a/registrations/${id}/payment`, { token: v1, body: { status: "bogus" } })).status, 400);
  await call("POST", `/api/events/fest-a/registrations/${id}/issue`, { token: v1, body: { note: "wrong kit" } });
  const issueId = d0.issues[0].id;
  await call("POST", `/api/events/fest-a/issues/${encodeURIComponent(issueId)}/resolve`, { token: v1, body: { resolved: true } });
  const s = (await call("GET", "/api/events/fest-a/data", { token: v1 })).json.state;
  assert.equal(s.participants[`${id}:0`].checkedIn, true);
  assert.equal(s.participants[`${id}:0`].by, "vol1");
  assert.equal(s.registrations[id].kitGiven, true);
  assert.equal(s.registrations[id].paymentStatus, "verified");
  assert.equal(s.registrations[id].manualIssue, "wrong kit");
  assert.equal(s.resolvedIssues[issueId], true);
});

test("concurrent check-ins on the same registration never lose writes", async () => {
  const id = (await call("GET", "/api/events/fest-a/data", { token: v1 })).json.registrations[1].id;
  // two participants + kit + payment all at once
  const res = await Promise.all([
    call("POST", `/api/events/fest-a/registrations/${id}/checkin`, { token: v1, body: { pIndex: 0 } }),
    call("POST", `/api/events/fest-a/registrations/${id}/kit-give`, { token: v1 }),
    call("POST", `/api/events/fest-a/registrations/${id}/payment`, { token: v1, body: { status: "verified" } }),
    call("POST", `/api/events/fest-a/registrations/${id}/issue`, { token: v1, body: { note: "n" } }),
  ]);
  res.forEach((r) => assert.equal(r.status, 200));
  const s = (await call("GET", "/api/events/fest-a/data", { token: v1 })).json.state;
  assert.equal(s.participants[`${id}:0`].checkedIn, true);
  assert.equal(s.registrations[id].kitGiven, true);
  assert.equal(s.registrations[id].paymentStatus, "verified");
  assert.equal(s.registrations[id].manualIssue, "n");
});

test("walk-in registers, checks in, and verifies cash payment", async () => {
  const r = await call("POST", "/api/events/fest-a/registrations/walkin", { token: v1, body: { form: { name: "Walk Inn", phone: "9000000001", kitType: "Canvas", hasTeammate: true, teammateName: "Mate", teammatePhone: "9000000002" }, cashCollected: true } });
  assert.equal(r.status, 201, r.text);
  const reg = r.json.registration;
  assert.equal(reg.price, 99); assert.equal(reg.isWalkIn, true);
  const d = (await call("GET", "/api/events/fest-a/data", { token: v1 })).json;
  assert.ok(d.registrations.find((x) => x.id === reg.id));
  assert.equal(d.state.participants[`${reg.id}:1`].checkedIn, true);
  assert.equal(d.state.registrations[reg.id].paymentStatus, "verified");
  assert.equal((await call("POST", "/api/events/fest-a/registrations/walkin", { token: v1, body: { form: { name: "X", phone: "12" } } })).status, 400);
});

test("kit config edit, team mgmt, proofs, reset are admin-gated and isolated per event", async () => {
  const put = await call("PUT", "/api/events/fest-a/config", { token: boss, body: { kitTypes: [{ key: "Tee", label: "T-shirt", price: 250 }] } });
  assert.equal(put.json.kitTypes[0].key, "Tee");
  assert.equal((await call("PUT", "/api/events/fest-a/config", { token: boss, body: { kitTypes: [{ key: "Unknown", price: 1 }] } })).status, 400);
  assert.equal((await call("GET", "/api/events/fest-b/data", { token: boss })).json.registrations.length, 0);

  const id = (await call("GET", "/api/events/fest-a/data", { token: v1 })).json.registrations[0].id;
  const form = new FormData(); form.append("file", new Blob(["PNGDATA"], { type: "image/png" }), "pay.png");
  const up = await call("POST", `/api/events/fest-a/registrations/${id}/proof`, { token: v1, form });
  assert.equal(up.status, 201, up.text);
  const got = await call("GET", up.json.paymentProofLink + `?token=${v1}`);
  assert.equal(got.text, "PNGDATA");

  assert.equal((await call("POST", "/api/events/fest-a/reset", { token: v1, body: { confirm: "RESET" } })).status, 403);
  assert.equal((await call("POST", "/api/events/fest-a/reset", { token: boss, body: { confirm: "nope" } })).status, 400);
  await call("POST", "/api/events/fest-a/reset", { token: boss, body: { confirm: "RESET" } });
  const s = (await call("GET", "/api/events/fest-a/data", { token: boss })).json.state;
  assert.deepEqual(s.participants, {});
});
