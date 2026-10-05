# Event Control Room

Multi-event check-in / kit-distribution / payment-verification dashboard. Nextcloud is
the only datastore (one service account owns `/EventManagement` and the backend talks
to it over WebDAV + the OCS API); there is no separate application database.

## Run it

```
cp .env.example .env   # edit every CHANGE-ME value
docker compose up -d --build
```

- Nextcloud: http://localhost:8080 (first boot takes a minute — the backend waits for it)
- App: http://localhost:8081

Sign in with the `NEXTCLOUD_ADMIN_USER` / `NEXTCLOUD_ADMIN_PASSWORD` from `.env` — that
account can create events. From the app, create an event, then use **Event Admin → Team**
to add other Nextcloud users as `admin` or `volunteer` for that event (tick "create a new
account" by giving a password, or leave it blank to add someone who already has one).

## Layout

- `backend/` — Node/Express API. `src/storage.js` (WebDAV), `src/identity.js` (Nextcloud
  OCS users/groups), `src/store.js` (event/registration/state files + optimistic-lock
  read-modify-write), `src/domain.js` (issue detection, CSV/XLSX import, ported from the
  original single-event app), `src/app.js` (routes + auth/role checks).
- `frontend/` — the original React dashboard, now driven by `/api/*` instead of baked-in
  data: `Root.jsx` (login/event picker), `AdminPage.jsx` (kit config/import/team),
  `desi-kalakar-dashboard.jsx` (unchanged page logic, now reading `KIT_*` from the event's
  config and talking to the API instead of `localStorage`).

## Nextcloud layout

```
/EventManagement/events.json
/EventManagement/<slug>/config.json
/EventManagement/<slug>/registrations/<regId>.json
/EventManagement/<slug>/state/<regId>.json       # one file per registration, ETag-locked
/EventManagement/<slug>/uploads/<regId>/<file>
/EventManagement/<slug>/imports/<timestamp>-<file>
```

Each event gets two Nextcloud groups, `event-<slug>-admins` and `event-<slug>-volunteers`;
the backend decides access by group membership, not Nextcloud's own file sharing.

## Dev loop without Docker

```
cd backend && BACKEND_MODE=memory JWT_SECRET=dev PORT=4000 npm run dev   # in-memory, no persistence
cd frontend && npm run dev                                               # proxies /api to :4000
```

Default dev login is `admin` / `admin` (override with `DEV_ADMIN_PASSWORD`).

## Tests

```
cd backend && npm test
```
