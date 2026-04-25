# Family Budget App — Setup Guide

## Why it needs to be hosted online

The app is a **Progressive Web App (PWA)**. PWAs only work properly when served over HTTPS — not as a local file. This means:

- ✅ Opened from a `https://` URL → installs properly, syncs, updates automatically
- ❌ Opened as a file (`file:///...`) → no service worker, no sync, no real installation

---

## Step 1 — Deploy to Netlify (free, 2 minutes)

1. Go to **https://app.netlify.com** and sign in (or create a free account)
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop the entire **`budget-app`** folder onto the upload area
4. Netlify gives you a URL like `https://random-name-123.netlify.app`
5. **Optional:** click "Site settings → Change site name" to give it a memorable name, e.g. `kimbah-budget.netlify.app`

That's it. The app is now live on HTTPS. 🎉

---

## Step 2 — Install on Android (both phones)

Do this on **each phone** using the **same Netlify URL**:

1. Open **Chrome** on Android
2. Go to your Netlify URL
3. Tap the **three-dot menu (⋮) → "Add to Home screen"**
4. Tap "Add" — the app icon appears on your home screen
5. Open it from the home screen icon (not from the browser tab)

> **Important:** always open the app from the home screen icon, not from a Chrome tab. The home screen version is the installed PWA.

---

## Step 3 — Deploying updates

When the app is updated (new features, bug fixes):

1. Go back to your Netlify site dashboard
2. Drag the updated `budget-app` folder onto the **"Deploys"** tab
3. Netlify deploys the new version in seconds

The app will show a blue **"New version available — Update now"** banner the next time you open it. Tap it to get the latest version. Both phones update this way — no reinstalling.

---

## Firebase Sync (already configured)

Firebase is already built into the app — no extra steps needed. Both phones sync automatically through your Firebase project as long as:

- Both phones are using the same Netlify URL
- Both have completed the setup screen (entered a name + household name)
- Both use the **exact same household name** (it's case-sensitive when used as the sync key)

Check Settings in the app — the sync badge should say **"Live"**. If it says "Local only", check your internet connection.

---

## Bill Notifications

1. Open the app from the home screen icon
2. Tap the notification bar at the top, or go to **Settings → Enable** next to Bill Reminders
3. Allow notifications when Android prompts you
4. You'll be reminded 3 days before each bill (adjustable in Settings)

---

## Troubleshooting

**Updates not appearing on phone after redeploy**
Close the app fully (swipe it away in recents) and reopen. A blue "New version available" banner should appear — tap "Update now".

**Sync showing "Local only"**
Both devices must have the same household name. Check Settings. If still stuck, close and reopen the app — Firebase reconnects on open.

**App not installing**
Use Chrome (not Firefox or Samsung Browser). You must be visiting the `https://` Netlify URL, not a local file.

**Still showing old version after tapping "Update now"**
In Chrome go to Settings → Privacy → Clear browsing data → check "Cached images and files" → Clear.
