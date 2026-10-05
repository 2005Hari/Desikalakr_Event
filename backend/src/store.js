const MAX_RETRIES = 6;
const CACHE_TTL_MS = 30_000;

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

export function createStore(storage) {
  const cache = new Map(); // key -> {at, value}
  const cached = async (key, loader) => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
    const value = await loader();
    cache.set(key, { at: Date.now(), value });
    return value;
  };
  const invalidate = (prefix) => {
    for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
  };

  // read-modify-write with optimistic concurrency (ETag / If-Match)
  async function rmw(path, fn, empty) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const cur = await storage.getJson(path);
      const next = fn(cur ? structuredClone(cur.data) : structuredClone(empty));
      try {
        await storage.putJson(path, next, cur ? { ifMatch: cur.etag } : { ifNoneMatch: "*" });
        return next;
      } catch (e) {
        if (e.code !== 412) throw e;
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 60));
      }
    }
    throw Object.assign(new Error("Too many concurrent edits, please retry"), { code: 409 });
  }

  const evDir = (slug) => `/${slug}`;

  return {
    storage,

    async init() {
      await storage.mkdirp("/");
      if (!(await storage.getJson("/events.json"))) {
        try { await storage.putJson("/events.json", [], { ifNoneMatch: "*" }); } catch (e) { if (e.code !== 412) throw e; }
      }
    },

    async listEvents() {
      return (await storage.getJson("/events.json"))?.data || [];
    },

    async getConfig(slug) {
      return (await storage.getJson(`${evDir(slug)}/config.json`))?.data || null;
    },

    async createEvent(slug, config) {
      if (await this.getConfig(slug)) throw Object.assign(new Error("Event already exists"), { code: 409 });
      for (const d of ["", "/registrations", "/state", "/uploads", "/imports"]) await storage.mkdirp(evDir(slug) + d);
      await storage.putJson(`${evDir(slug)}/config.json`, config);
      await rmw("/events.json", (list) => [...list.filter((e) => e.slug !== slug), { slug, name: config.name, createdAt: new Date().toISOString() }], []);
    },

    async updateConfig(slug, patch) {
      const next = await rmw(`${evDir(slug)}/config.json`, (c) => ({ ...c, ...patch }), {});
      await rmw("/events.json", (list) => list.map((e) => (e.slug === slug ? { ...e, name: next.name } : e)), []);
      return next;
    },

    async listRegistrations(slug) {
      return cached(`regs:${slug}`, async () => {
        const names = (await storage.list(`${evDir(slug)}/registrations`)).filter((n) => n.endsWith(".json"));
        const regs = await pool(names, 10, async (n) => (await storage.getJson(`${evDir(slug)}/registrations/${n}`))?.data);
        return regs.filter(Boolean).sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
      });
    },

    async addRegistrations(slug, regs, { overwrite = false } = {}) {
      await pool(regs, 10, (r) =>
        storage.putJson(`${evDir(slug)}/registrations/${r.id}.json`, r, overwrite ? {} : { ifNoneMatch: "*" })
      );
      invalidate(`regs:${slug}`);
    },

    async stageImport(slug, filename, buf, contentType) {
      const safe = filename.replace(/[^\w.\-]+/g, "_");
      await storage.putBinary(`${evDir(slug)}/imports/${Date.now()}-${safe}`, buf, contentType);
    },

    async getState(slug) {
      return cached(`state:${slug}`, async () => {
        const names = (await storage.list(`${evDir(slug)}/state`)).filter((n) => n.endsWith(".json"));
        const files = await pool(names, 10, async (n) => ({ n, d: (await storage.getJson(`${evDir(slug)}/state/${n}`))?.data }));
        const out = { participants: {}, registrations: {}, resolvedIssues: {} };
        for (const { n, d } of files) {
          if (!d) continue;
          if (n === "_resolved.json") { out.resolvedIssues = d; continue; }
          const regId = n.replace(/\.json$/, "");
          for (const [idx, ps] of Object.entries(d.participants || {})) out.participants[`${regId}:${idx}`] = ps;
          if (d.reg && Object.keys(d.reg).length) out.registrations[regId] = d.reg;
        }
        return out;
      });
    },

    async mutateReg(slug, regId, fn) {
      const next = await rmw(`${evDir(slug)}/state/${regId}.json`, (s) => {
        s.participants ||= {};
        s.reg ||= {};
        fn(s);
        return s;
      }, { participants: {}, reg: {} });
      invalidate(`state:${slug}`);
      return next;
    },

    async setResolved(slug, issueId, resolved) {
      await rmw(`${evDir(slug)}/state/_resolved.json`, (m) => ({ ...m, [issueId]: resolved }), {});
      invalidate(`state:${slug}`);
    },

    async resetState(slug) {
      const names = await storage.list(`${evDir(slug)}/state`);
      await pool(names, 10, (n) => storage.remove(`${evDir(slug)}/state/${n}`));
      invalidate(`state:${slug}`);
    },

    async saveProof(slug, regId, filename, buf, contentType) {
      const safe = filename.replace(/[^\w.\-]+/g, "_");
      await storage.mkdirp(`${evDir(slug)}/uploads/${regId}`);
      const path = `${evDir(slug)}/uploads/${regId}/${Date.now()}-${safe}`;
      await storage.putBinary(path, buf, contentType);
      return path.slice(`${evDir(slug)}/uploads/`.length);
    },

    async getProof(slug, rel) {
      return storage.getBinary(`${evDir(slug)}/uploads/${rel}`);
    },
  };
}
