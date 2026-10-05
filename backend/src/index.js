import { createApp } from "./app.js";
import { createStore } from "./store.js";
import { memoryStorage, webdavStorage } from "./storage.js";
import { memoryIdentity, nextcloudIdentity } from "./identity.js";

const env = process.env;
const useMemory = env.BACKEND_MODE === "memory";

let storage, identity;
if (useMemory) {
  console.warn("[backend] BACKEND_MODE=memory: data is NOT persisted. Dev only.");
  storage = memoryStorage();
  identity = memoryIdentity({
    users: { admin: env.DEV_ADMIN_PASSWORD || "admin" },
    groups: { "event-creators": ["admin"] },
  });
} else {
  for (const k of ["NEXTCLOUD_URL", "NEXTCLOUD_SERVICE_USER", "NEXTCLOUD_SERVICE_PASSWORD", "JWT_SECRET"]) {
    if (!env[k]) { console.error(`Missing required env var ${k}`); process.exit(1); }
  }
  storage = webdavStorage({ baseUrl: env.NEXTCLOUD_URL, user: env.NEXTCLOUD_SERVICE_USER, password: env.NEXTCLOUD_SERVICE_PASSWORD });
  identity = nextcloudIdentity({ baseUrl: env.NEXTCLOUD_URL, adminUser: env.NEXTCLOUD_SERVICE_USER, adminPassword: env.NEXTCLOUD_SERVICE_PASSWORD });
}

const store = createStore(storage);

async function initWithRetry() {
  for (let i = 1; i <= 30; i++) {
    try { await store.init(); return; } catch (e) {
      console.warn(`[backend] waiting for storage (${i}/30): ${e.message}`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  throw new Error("Storage never became ready");
}
await initWithRetry();

if (!useMemory && env.BOOTSTRAP_CREATOR_GROUP !== "false") {
  try { await identity.createGroup(env.CREATOR_GROUP || "event-creators"); } catch (e) { console.warn("[backend] creator group:", e.message); }
}

const app = createApp({
  store,
  identity,
  jwtSecret: env.JWT_SECRET || "dev-secret-change-me",
  creatorGroup: env.CREATOR_GROUP || "event-creators",
  superAdmins: (env.SUPER_ADMINS || env.NEXTCLOUD_SERVICE_USER || "").split(",").map((s) => s.trim()).filter(Boolean),
});

const port = Number(env.PORT || 4000);
app.listen(port, () => console.log(`[backend] listening on :${port} (${useMemory ? "memory" : "nextcloud"})`));
