// Storage adapters. Interface:
//   mkdirp(path), getJson(path) -> {data, etag}|null, putJson(path, data, {ifMatch, ifNoneMatch}) -> etag,
//   putBinary(path, buf, contentType), getBinary(path) -> {buf, contentType}|null, list(path) -> names[], remove(path)
// Conflict => throws Error with .code === 412

import crypto from "node:crypto";

const conflict = () => Object.assign(new Error("Precondition failed"), { code: 412 });
const etagOf = (s) => crypto.createHash("md5").update(s).digest("hex");

export function memoryStorage() {
  const files = new Map(); // path -> {body: Buffer, etag, contentType}
  const dirs = new Set(["/"]);
  return {
    async mkdirp(p) {
      let cur = "";
      for (const seg of p.split("/").filter(Boolean)) {
        cur += "/" + seg;
        dirs.add(cur);
      }
    },
    async getJson(p) {
      const f = files.get(p);
      if (!f) return null;
      return { data: JSON.parse(f.body.toString("utf8")), etag: f.etag };
    },
    async putJson(p, data, { ifMatch, ifNoneMatch } = {}) {
      const cur = files.get(p);
      if (ifMatch && (!cur || cur.etag !== ifMatch)) throw conflict();
      if (ifNoneMatch === "*" && cur) throw conflict();
      const body = Buffer.from(JSON.stringify(data));
      const etag = etagOf(body.toString("utf8") + Math.random());
      files.set(p, { body, etag, contentType: "application/json" });
      return etag;
    },
    async putBinary(p, buf, contentType = "application/octet-stream") {
      files.set(p, { body: buf, etag: etagOf(String(Math.random())), contentType });
    },
    async getBinary(p) {
      const f = files.get(p);
      return f ? { buf: f.body, contentType: f.contentType } : null;
    },
    async list(p) {
      const prefix = p.endsWith("/") ? p : p + "/";
      const out = new Set();
      for (const k of files.keys()) {
        if (k.startsWith(prefix)) out.add(k.slice(prefix.length).split("/")[0]);
      }
      for (const d of dirs) {
        if (d.startsWith(prefix)) out.add(d.slice(prefix.length).split("/")[0]);
      }
      out.delete("");
      return [...out];
    },
    async remove(p) {
      for (const k of [...files.keys()]) if (k === p || k.startsWith(p + "/")) files.delete(k);
    },
  };
}

export function webdavStorage({ baseUrl, user, password, root = "/EventManagement" }) {
  const auth = "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
  const davBase = `${baseUrl.replace(/\/$/, "")}/remote.php/dav/files/${encodeURIComponent(user)}`;
  const url = (p) => davBase + root + p.split("/").map(encodeURIComponent).join("/").replace(/%2F/g, "/");

  async function req(method, p, { headers = {}, body } = {}) {
    return fetch(url(p), { method, headers: { Authorization: auth, ...headers }, body });
  }

  async function mkdirp(p) {
    // ensure root then each segment
    await fetch(davBase + root, { method: "MKCOL", headers: { Authorization: auth } });
    let cur = "";
    for (const seg of p.split("/").filter(Boolean)) {
      cur += "/" + seg;
      const r = await req("MKCOL", cur);
      if (![201, 405].includes(r.status)) throw new Error(`MKCOL ${cur} -> ${r.status}`);
    }
  }

  return {
    mkdirp,
    async getJson(p) {
      const r = await req("GET", p);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
      return { data: await r.json(), etag: r.headers.get("etag") };
    },
    async putJson(p, data, { ifMatch, ifNoneMatch } = {}) {
      const headers = { "Content-Type": "application/json" };
      if (ifMatch) headers["If-Match"] = ifMatch;
      if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
      const r = await req("PUT", p, { headers, body: JSON.stringify(data) });
      if (r.status === 412) throw conflict();
      if (!r.ok) throw new Error(`PUT ${p} -> ${r.status}`);
      return r.headers.get("etag");
    },
    async putBinary(p, buf, contentType = "application/octet-stream") {
      const r = await req("PUT", p, { headers: { "Content-Type": contentType }, body: buf });
      if (!r.ok) throw new Error(`PUT ${p} -> ${r.status}`);
    },
    async getBinary(p) {
      const r = await req("GET", p);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
      return { buf: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get("content-type") };
    },
    async list(p) {
      const r = await req("PROPFIND", p, {
        headers: { Depth: "1", "Content-Type": "application/xml" },
        body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>`,
      });
      if (r.status === 404) return [];
      if (r.status !== 207) throw new Error(`PROPFIND ${p} -> ${r.status}`);
      const xml = await r.text();
      const self = (davBase + root + p).replace(/\/$/, "");
      const names = [];
      for (const m of xml.matchAll(/<d:href>([^<]+)<\/d:href>/gi)) {
        let href = decodeURIComponent(m[1]);
        try { href = new URL(href, davBase).pathname; } catch { /* keep */ }
        href = decodeURIComponent(href).replace(/\/$/, "");
        const selfPath = decodeURIComponent(new URL(self).pathname).replace(/\/$/, "");
        if (href === selfPath) continue;
        names.push(href.split("/").pop());
      }
      return names;
    },
    async remove(p) {
      const r = await req("DELETE", p);
      if (![204, 404].includes(r.status)) throw new Error(`DELETE ${p} -> ${r.status}`);
    },
  };
}
