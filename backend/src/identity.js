// Identity providers. Interface:
//   verify(user, pass) -> bool; groupsOf(user) -> string[]; createGroup(g); addToGroup(user, g);
//   removeFromGroup(user, g); membersOf(g) -> string[]; createUser(user, pass, displayName)

export function memoryIdentity(seed = {}) {
  const users = new Map(Object.entries(seed.users || {})); // user -> password
  const groups = new Map(Object.entries(seed.groups || {}).map(([g, m]) => [g, new Set(m)]));
  return {
    async verify(u, p) { return users.get(u) === p; },
    async groupsOf(u) { return [...groups].filter(([, m]) => m.has(u)).map(([g]) => g); },
    async createGroup(g) { if (!groups.has(g)) groups.set(g, new Set()); },
    async addToGroup(u, g) { (groups.get(g) || groups.set(g, new Set()).get(g)).add(u); },
    async removeFromGroup(u, g) { groups.get(g)?.delete(u); },
    async membersOf(g) { return [...(groups.get(g) || [])]; },
    async createUser(u, p) { if (users.has(u)) throw Object.assign(new Error("exists"), { code: 409 }); users.set(u, p); },
  };
}

export function nextcloudIdentity({ baseUrl, adminUser, adminPassword }) {
  const base = baseUrl.replace(/\/$/, "");
  const adminAuth = "Basic " + Buffer.from(`${adminUser}:${adminPassword}`).toString("base64");

  async function ocs(method, path, { form, auth = adminAuth } = {}) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`${base}/ocs/v1.php${path}${sep}format=json`, {
      method,
      headers: {
        Authorization: auth,
        "OCS-APIRequest": "true",
        Accept: "application/json",
        ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: form ? new URLSearchParams(form).toString() : undefined,
    });
    let json = null;
    try { json = await r.json(); } catch { /* non-json */ }
    return { status: r.status, meta: json?.ocs?.meta, data: json?.ocs?.data };
  }
  const ok = (r) => r.meta?.statuscode === 100 || r.meta?.statuscode === 200;

  return {
    async verify(u, p) {
      const auth = "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
      const r = await ocs("GET", "/cloud/user", { auth });
      return r.status === 200 && ok(r) && r.data?.id?.toLowerCase() === u.toLowerCase();
    },
    async groupsOf(u) {
      const r = await ocs("GET", `/cloud/users/${encodeURIComponent(u)}/groups`);
      return ok(r) ? r.data?.groups || [] : [];
    },
    async createGroup(g) {
      const r = await ocs("POST", "/cloud/groups", { form: { groupid: g } });
      if (!ok(r) && r.meta?.statuscode !== 102) throw new Error(`createGroup ${g}: ${r.meta?.message}`);
    },
    async addToGroup(u, g) {
      const r = await ocs("POST", `/cloud/users/${encodeURIComponent(u)}/groups`, { form: { groupid: g } });
      if (!ok(r)) throw new Error(`addToGroup ${u}/${g}: ${r.meta?.message}`);
    },
    async removeFromGroup(u, g) {
      await ocs("DELETE", `/cloud/users/${encodeURIComponent(u)}/groups`, { form: { groupid: g } });
    },
    async membersOf(g) {
      const r = await ocs("GET", `/cloud/groups/${encodeURIComponent(g)}`);
      return ok(r) ? r.data?.users || [] : [];
    },
    async createUser(u, p, displayName) {
      const r = await ocs("POST", "/cloud/users", { form: { userid: u, password: p, displayName: displayName || u } });
      if (!ok(r)) throw Object.assign(new Error(r.meta?.message || "createUser failed"), { code: r.meta?.statuscode === 102 ? 409 : 400 });
    },
  };
}
