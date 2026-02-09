# How to see the latest updates (wizard gone, “Signed in”, tabs)

If you still see the **migration wizard** after login, **“Guest Session”** in the sidebar, or **tabs stopping** — the app you’re opening is almost certainly an **old build** or **cached**. The code in this repo has already been updated.

## What “latest” looks like

When you’re on the **latest** deployment you will see **all** of this:

1. **Browser tab title:** `OdysseyOS · latest`
2. **Sidebar header:** `OdysseyOS · latest` (not just “OdysseyOS”)
3. **Amber/yellow banner** at the top of the main area:  
   `✓ LATEST BUILD — No migration wizard when signed in. Sidebar shows your email...`
4. **Sidebar:** “Signed in” and your **email** (no “Guest Session”, no guest ID)
5. **No migration wizard** after you log in

If **any** of these are missing, you’re on an old deployment or cache.

---

## Option 1: Vercel production URL (your main domain)

1. **Push** this repo to your **production** branch (usually `main`):
   ```bash
   git add -A && git commit -m "Latest: no wizard, signed in, cache headers" && git push origin main
   ```
2. In **Vercel** → your project → **Deployments**: wait for the **Production** deployment for that branch to finish (status **Ready**).
3. Open your **production URL** (e.g. `https://yourapp.vercel.app`) in an **incognito/private** window (or clear site data for that domain).
4. Log in and check: tab title “OdysseyOS · latest”, sidebar “OdysseyOS · latest” + “Signed in” + email, amber banner, no wizard.

If the production URL still shows the old UI, use **Vercel** → **Deployments** → latest production deployment → **⋯** → **Redeploy** (no cache), then try again in incognito.

---

## Option 2: Run locally from this folder

Use this to confirm the repo you have is the one with the fixes:

1. **Open a terminal in this project folder** (the one that contains `SHIP_AND_SEE_UPDATES.md`).
2. **Delete the build cache:**
   - Windows PowerShell: `Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue`
   - Mac/Linux: `rm -rf .next`
3. **Start the app:** `npm run dev`
4. **Open the URL from the terminal** (e.g. `http://localhost:3000`) in your browser. Don’t use an old tab or bookmark.
5. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac).
6. Log in. You should see the **amber “LATEST BUILD” banner**, **“OdysseyOS · latest”** in the sidebar, **“Signed in”** and your email, and **no migration wizard**.

If you see all of that **locally** but **not** on the Vercel URL, the problem is deployment/cache (Option 1). If you don’t see it **locally** either, you’re likely in a different folder or a different repo.

---

## Why the main Vercel URL was behind

- The **main domain** always serves the **current production** deployment. Preview links are per-commit.
- The app uses a **PWA/service worker** that caches pages; the browser can keep showing an old bundle until cache is cleared or you use incognito.
- **Cache-Control** headers were added for `/dashboard` so the server can tell the browser not to reuse old dashboard pages. After redeploying and loading in incognito (or after clearing site data), the production URL should show the latest build.
