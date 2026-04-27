# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Budget is a mobile-first Progressive Web App (PWA) for household budget tracking. It is a **zero-dependency, vanilla JS, single-file app** — no build tools, no npm, no framework. All app logic, styles, and HTML live in `index.html` (≈2,300 lines). The service worker (`sw.js`) handles caching and push notifications.

## Running & Deployment

There is no build step. The app is deployed as static files (e.g. drag-drop to Netlify). It **must be served over HTTPS** — the PWA service worker will not register on `file:///`.

- Local testing: use any static HTTP server, e.g. `npx serve .` or VS Code Live Server extension
- Production: deploy to Netlify (or similar). See `SETUP.md` for the user-facing deployment guide.

There are no tests, no linting, and no CI pipeline.

## Architecture

### Single-file design
All HTML structure, CSS, and JavaScript are in `index.html`. This is intentional — it simplifies offline caching and avoids asset-loading complexity for a PWA. Do not split this into separate files without good reason.

### Data model
Data is stored in `localStorage` under a single key and synced optionally to Firebase Firestore. The root object shape:

```js
{
  profile: { name, household },
  settings: { notifDays: 3 },
  bills: [{ id, name, amount, dueDay, icon, paid: [monthKeys] }],
  income: [{ id, name, amount, day, anchorDate, freq, weekDay, note }],
  spending: [{ id, amount, date, category, note }],
  oneoffs: [{ id, name, amount, date, icon, note }],
  openingBalance: { amount, date },
  firebaseConfig: null   // populated if user sets up sync
}
```

### Six main tabs
Home (dashboard), Bills (direct debits + one-offs), Spend (transaction log), Income (income sources), Insights (analytics + health score), Settings (Firebase sync, notifications, export/import).

### Service Worker (`sw.js`)
Cache-first for static assets; network-first for HTML. Also handles bill reminder notifications and in-app update banners. Version is hardcoded as a cache key — bump it when deploying to force cache refresh.

### Firebase sync
Firebase SDK is loaded from CDN dynamically only if the user has configured a `firebaseConfig`. Conflict resolution uses a `_ts` timestamp field. No Firebase project is bundled — users bring their own.

### Key patterns
- All rendering is imperative DOM manipulation via `innerHTML` / `createElement`
- No state management library — `data` object is the single source of truth, `save()` persists it, then the active tab re-renders
- Date arithmetic for 4-weekly income uses DST-aware calculations; take care when editing income frequency logic
