import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";
import { memoryStorage } from "../src/storage.js";
import { memoryIdentity } from "../src/identity.js";

let server, base;
const call = async (method, path, { token, body } = {}) => {
  const r = await fetch(base + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
};
const login = async (u, p) => (await call("POST", "/api/auth/login", { body: { username: u, password: p } })).json?.token;

before(async () => {
  const store = createStore(memoryStorage());
  await store.init();
  const identity = memoryIdentity({
    users: { boss: "pw", vol1: "pw" },
    groups: { "event-creators": ["boss"] },
  });
  const app = createApp({ store, identity, jwtSecret: "test" });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

let boss, v1, formId;

test("setup: event + team", async () => {
  boss = await login("boss", "pw");
  await call("POST", "/api/events", { token: boss, body: { slug: "fest-c", name: "Fest C" } });
  await call("POST", "/api/events/fest-c/team", { token: boss, body: { username: "vol1", role: "volunteer" } });
  v1 = await login("vol1", "pw");
});

test("only admins can create forms; fields are validated", async () => {
  assert.equal((await call("POST", "/api/events/fest-c/forms", { token: v1, body: { title: "x", fields: [] } })).status, 403);
  assert.equal((await call("POST", "/api/events/fest-c/forms", { token: boss, body: { title: "", fields: [] } })).status, 400);
  assert.equal((await call("POST", "/api/events/fest-c/forms", { token: boss, body: { title: "x" } })).status, 400);
  const badType = await call("POST", "/api/events/fest-c/forms", { token: boss, body: { title: "x", fields: [{ id: "a", type: "bogus", label: "A" }] } });
  assert.equal(badType.status, 400);
  const noOptions = await call("POST", "/api/events/fest-c/forms", { token: boss, body: { title: "x", fields: [{ id: "a", type: "dropdown", label: "A" }] } });
  assert.equal(noOptions.status, 400);

  const r = await call("POST", "/api/events/fest-c/forms", { token: boss, body: {
    title: "Workshop RSVP",
    description: "Sign up below",
    fields: [
      { id: "name", type: "text", label: "Full name", required: true },
      { id: "year", type: "dropdown", label: "Year", required: true, options: ["1", "2", "3", "4"] },
      { id: "notes", type: "textarea", label: "Notes" },
      { id: "agree", type: "checkbox", label: "I agree to the rules", required: true },
      { id: "snacks", type: "checkbox", label: "Snacks", options: ["Chips", "Cookies"] },
    ],
  } });
  assert.equal(r.status, 201, r.text);
  assert.equal(r.json.status, "open");
  formId = r.json.id;
});

test("volunteers can't list/view forms or submissions (admin-only per spec)", async () => {
  assert.equal((await call("GET", "/api/events/fest-c/forms", { token: v1 })).status, 403);
  assert.equal((await call("GET", `/api/events/fest-c/forms/${formId}`, { token: v1 })).status, 403);
  assert.equal((await call("GET", `/api/events/fest-c/forms/${formId}/submissions`, { token: v1 })).status, 403);
  assert.equal((await call("GET", "/api/events/fest-c/forms", { token: boss })).status, 200);
});

test("public can fetch the form definition without a token, but not forge/view admin data", async () => {
  const r = await call("GET", `/api/public/forms/fest-c/${formId}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.title, "Workshop RSVP");
  assert.equal(r.json.createdBy, undefined);
  assert.equal((await call("GET", "/api/public/forms/fest-c/nope-does-not-exist")).status, 404);
  assert.equal((await call("GET", "/api/public/forms/no-such-event/" + formId)).status, 404);
});

test("public submit validates required fields and option membership", async () => {
  const missing = await call("POST", `/api/public/forms/fest-c/${formId}/submit`, { body: { answers: { name: "Ann" } } });
  assert.equal(missing.status, 400); // year + agree required

  const badOption = await call("POST", `/api/public/forms/fest-c/${formId}/submit`, { body: { answers: { name: "Ann", year: "9", agree: true } } });
  assert.equal(badOption.status, 400);

  const ok = await call("POST", `/api/public/forms/fest-c/${formId}/submit`, { body: { answers: {
    name: "Ann", year: "2", notes: "  excited!  ", agree: true, snacks: ["Cookies", "Nonexistent"],
  } } });
  assert.equal(ok.status, 201, ok.text);
});

test("admin can list submissions; unknown/bogus answer keys never leak through", async () => {
  const r = await call("GET", `/api/events/fest-c/forms/${formId}/submissions`, { token: boss });
  assert.equal(r.status, 200);
  assert.equal(r.json.submissions.length, 1);
  const a = r.json.submissions[0].answers;
  assert.equal(a.name, "Ann");
  assert.equal(a.notes, "excited!");
  assert.deepEqual(a.snacks, ["Cookies"]);
  assert.equal(a.agree, true);
});

test("closing a form blocks further public submissions", async () => {
  const closed = await call("PUT", `/api/events/fest-c/forms/${formId}`, { token: boss, body: { status: "closed" } });
  assert.equal(closed.status, 200);
  assert.equal(closed.json.status, "closed");

  const pub = await call("GET", `/api/public/forms/fest-c/${formId}`);
  assert.equal(pub.json.status, "closed");

  const blocked = await call("POST", `/api/public/forms/fest-c/${formId}/submit`, { body: { answers: { name: "Bob", year: "1", agree: true } } });
  assert.equal(blocked.status, 409);

  assert.equal((await call("PUT", `/api/events/fest-c/forms/${formId}`, { token: boss, body: { status: "bogus" } })).status, 400);
  assert.equal((await call("PUT", "/api/events/fest-c/forms/does-not-exist", { token: boss, body: { status: "open" } })).status, 404);
});

test("forms and submissions are isolated per event", async () => {
  await call("POST", "/api/events", { token: boss, body: { slug: "fest-d", name: "Fest D" } });
  assert.deepEqual((await call("GET", "/api/events/fest-d/forms", { token: boss })).json, []);
  assert.equal((await call("GET", `/api/public/forms/fest-d/${formId}`)).status, 404);
});
