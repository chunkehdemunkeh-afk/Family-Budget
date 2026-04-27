# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Budget is a **mobile-first Progressive Web App (PWA)** for household budget tracking. It is a **zero-dependency, vanilla JS, single-file app** — no build tools, no npm, no framework. All app logic, styles, and HTML live in `index.html` (≈2,294 lines). The service worker (`sw.js`) handles caching and push notifications.

### Household context
The app is configured for a specific household: **2 adults, 4 children, 3 dogs, 3 lizards**. The Insights tab's savings plan and recommended budget figures are hardcoded to this household size (see `RECOMMENDED` array in `renderSavingsPlan()`). Income sources in `DEFAULT_DATA` reflect their actual benefits schedule.

---

## Running & Deployment

There is no build step. The app is deployed as static files.

- **Local testing:** `npx serve .` or VS Code Live Server (must be HTTP, not `file:///`)
- **Production:** Drag-drop to Netlify. See `SETUP.md` for user-facing guide.
- **After every deploy:** increment `CACHE_NAME` in `sw.js` (currently `'family-budget-v11'`) to force clients to pick up updated files.

There are no tests, no linting, and no CI pipeline.

---

## Architecture

### Single-file design
All HTML, CSS, and JavaScript are in `index.html`. This is **intentional** — it simplifies offline PWA caching. Do **not** split into separate files.

### Files
| File | Purpose |
|------|---------|
| `index.html` | Entire app — HTML structure, CSS (`:root` tokens + component styles), JS |
| `sw.js` | Service worker: cache-first for assets, network-first for HTML, bill reminder notifications |
| `manifest.json` | PWA manifest |
| `SETUP.md` | User-facing deployment and setup guide |

### Data model
Data is stored in `localStorage` under the key `'familyBudget'`. Root object shape:

```js
{
  profile:        { name, household },
  settings:       { notifDays: 3 },
  bills:          [{ id, name, amount, dueDay, icon, paid: [monthKeys] }],
  income:         [{ id, name, amount, day, anchorDate, freq, weekDay, note }],
  spending:       [{ id, amount, date, cat, note }],
  oneoffs:        [{ id, name, amount, date, icon, note, paid: bool }],
  openingBalance: null | { amount: number, date: 'YYYY-MM-DD' },
  firebaseConfig: { ... },  // always set to FIREBASE_CONFIG constant at init
  _setupDone:     bool,
  _ts:            number,   // Unix ms timestamp — used for Firebase conflict resolution
}
```

### Six tabs
| Tab | ID | Description |
|-----|----|-------------|
| Home | `tab-home` | Dashboard: balance hero, week forecast, upcoming bills, recent spend, month progress |
| Bills | `tab-bills` | Regular bills/direct debits + one-off/variable bills (toggled view) |
| Spend | `tab-spend` | Add spending log entry; view by week/month/all |
| Income | `tab-income` | Income sources — monthly, 4-weekly, weekly, fortnightly, irregular |
| Insights | `tab-insights` | Financial health score, spending trends, smart tips, savings plan, recommended budget |
| Settings | `tab-settings` | Firebase config UI, notifications, export/import/reset |

### Rendering pattern
All rendering is **imperative DOM manipulation** via `innerHTML` / `createElement`. There is no virtual DOM or framework.

The global `db` object is the **single source of truth**. The flow is always:
1. Mutate `db`
2. Call `save()` — persists to `localStorage` and syncs to Firebase
3. Call the relevant `render*()` function(s) to update the DOM

`renderAll()` calls only `renderHome()` and `renderSettings()`. Each tab's render function is called explicitly when `showTab(name)` is triggered.

---

## Firebase

Firebase is **built-in and hardcoded** — users do not configure it manually (the Settings UI for entering a JSON config exists but is pre-populated from `FIREBASE_CONFIG` constant).

```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDN_Gx0P5TiZWX9H4dMG_Gx2yxpIUjDfYY",
  authDomain: "kimbahsbudget-8f0a0.firebaseapp.com",
  projectId: "kimbahsbudget-8f0a0",
  ...
};
```

The Firebase SDK is loaded from CDN lazily at `initFirebase()` call time. Sync key is the household name, lowercased and slugified: `households/{householdId}`. Conflict resolution uses `_ts` — whichever device has the higher timestamp wins.

---

## Key Functions Reference

| Function | Location (approx line) | Purpose |
|----------|------------------------|---------|
| `init()` | ~2245 | App entry point — loads data, inits Firebase, registers SW |
| `load()` | ~843 | Reads localStorage, merges with `DEFAULT_DATA`, runs `migrateData()` |
| `save()` | ~855 | Writes localStorage + triggers `syncToFirebase()` |
| `migrateData()` | ~822 | Applies `INCOME_CORRECTIONS` to income sources; deduplicates bills by ID |
| `renderHome()` | ~1059 | Main dashboard including balance calculation |
| `renderWeekForecast(openingBalance)` | ~1212 | 7-day event forecast with prev/next week navigation |
| `getDayEvents(d, dStr)` | ~1308 | Returns income + bill + oneoff events for a given day |
| `renderBills()` | ~1342 | Regular bills list |
| `renderOneoffs()` | ~1510 | One-off/variable bills list |
| `renderSpend()` | ~1589 | Spending log (filtered by currentSpendView) |
| `renderIncome()` | ~1627 | Income list with next payment dates |
| `renderInsights()` | ~1822 | Health score, trends, tips |
| `renderSavingsPlan()` | ~1984 | Savings tiers + recommended budget breakdown |
| `renderSettings()` | ~2112 | Settings tab |
| `fourWeeklyDatesInMonth(anchorDate, year, month)` | ~968 | Returns all 4-weekly payment dates falling in a given month |
| `nextFourWeeklyDate(anchorDate, fromDate)` | ~988 | Next 4-weekly payment on or after a given date |
| `thursdaysInMonth(weekDay, yr, mo, upToDay)` | ~1001 | Counts weekday occurrences in a month |
| `incomeReceivedByDate(cutoffDate)` | ~1064 | Total income received up to a cutoff date (inner fn of renderHome) |
| `billAfterOB(b)` | ~1103 | Excludes bills whose dueDay predates the opening balance (inner fn) |

### Global state variables
| Variable | Purpose |
|----------|---------|
| `db` | The live data object |
| `firebaseDb` | Firestore instance (null if not connected) |
| `weekOffset` | Int offset for week forecast navigation (0 = current week) |
| `currentSpendView` | `'week'` \| `'month'` \| `'all'` |
| `billsView` | `'regular'` \| `'oneoff'` |

---

## Data Migration System

`INCOME_CORRECTIONS` (defined near line 811) is a map of income ID → authoritative field values. `migrateData()` applies these **every time data is loaded**, including when pulled from Firebase. This ensures stale data from older app versions or Firebase is always corrected without manual intervention.

If income schedules change, update both `DEFAULT_DATA` and `INCOME_CORRECTIONS`.

---

## Income Frequency Types

| `freq` value | Behaviour |
|-------------|-----------|
| `'monthly'` | Paid on `day` of month |
| `'fourweekly'` | Paid every 28 days from `anchorDate` — may produce 2 payments in some months |
| `'weekly'` | Paid every `weekDay` (JS `getDay()` — 0=Sun, 4=Thu) |
| `'fortnightly'` | Simple: paid once/twice a month (simplified logic) |
| `'irregular'` | Uses flat `amount` — not date-projected |

---

## Balance Calculation

The balance formula in `renderHome()` is:

```
balance = openingBalance.amount
        + (incomeReceived since OB date)
        - (bills paid this month that are after OB date)
        - (one-offs marked paid this month after OB date)
        - (spending logged this month after OB date)
```

When no opening balance is set, the formula drops the OB amount and counts from zero.

The **opening balance modal** has a "Reconcile right now" shortcut (`reconcileNow()`) that snaps the date to today, making it easy to sync the app to the actual bank balance.

---

## Gotchas

### ⚠️ Date formatting must use local time, not UTC
`fmtDate(d)` uses `getFullYear()` / `getMonth()` / `getDate()` — **never `toISOString().slice(0,10)`**. In the UK during BST (UTC+1), a `Date` at midnight has a UTC timestamp of the previous day. `toISOString()` will return the wrong date for any Date built with `setHours(0,0,0,0)`.

### ⚠️ 4-weekly income: always use noon-based Dates
All 4-weekly date arithmetic uses `new Date(y, m, d, 12, 0, 0)` (noon) to avoid DST boundary issues. Never use midnight (`new Date(y, m, d)`) for 4-weekly calculations.

### ⚠️ Opening balance: bills must be filtered by OB date
`billsPaid` must exclude bills whose `dueDay` is before the opening balance date — those payments are captured in the OB amount. The helper `billAfterOB(b)` enforces this. Do not remove this filter.

### ⚠️ `migrateData()` always runs
Both on `load()` and when Firebase pushes remote data. This is intentional to ensure `INCOME_CORRECTIONS` are always applied, even to data coming from another device.

### ⚠️ `renderAll()` only renders Home + Settings
Tabs other than Home and Settings are rendered lazily when the user navigates to them via `showTab()`. Don't rely on `renderAll()` to refresh other tabs.

### ⚠️ Week forecast `weekOffset` is a global
`shiftWeek(dir)` mutates `weekOffset` and calls `renderWeekForecast()` without arguments (the balance is re-projected from the current hero balance). If `renderHome()` hasn't run first, the opening balance estimate may be stale.

---

## Service Worker (`sw.js`)

- Cache version: `'family-budget-v11'` — **increment on every deploy**
- Cache strategy: network-first for HTML navigation, cache-first for all other assets
- On activate: deletes old caches, claims all clients, posts `SW_UPDATED` message to open tabs
- Handles `SCHEDULE_REMINDERS` message: reads bill list and fires OS notifications for upcoming bills
- `notificationclick` opens `./index.html#bills`
