const TOKEN_KEY = "ems:token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

export async function api(method, path, body) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
  } catch {
    throw Object.assign(new Error("Can't reach the server"), { status: 0 });
  }
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(json?.error || `Request failed (${res.status})`), { status: res.status });
  return json;
}

export const proofHref = (link) => (link && link.startsWith("/api/") ? `${link}?token=${encodeURIComponent(getToken() || "")}` : link);
