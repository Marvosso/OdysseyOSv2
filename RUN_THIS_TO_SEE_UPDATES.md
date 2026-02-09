# Run this to see the latest updates

If you still see the **Narrate** button, no version text, or tabs stopping after a few clicks, the app you're opening is **not** running the code from this folder. Use these steps so the updates actually load.

---

## Option A: You run the app locally (npm run dev)

Do this in the **exact folder** that contains this file (OdysseyOS):

1. **Close the running app**  
   Stop the dev server (Ctrl+C in the terminal where `npm run dev` is running).

2. **Delete the build cache**  
   In PowerShell, in this folder, run:
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```

3. **Start the app again**
   ```powershell
   npm run dev
   ```

4. **Open the URL from the terminal**  
   Use the URL it prints (e.g. `http://localhost:3000`). Do **not** use a bookmark or an old tab.

5. **Hard refresh**  
   Press **Ctrl+Shift+R** (or Cmd+Shift+R on Mac).

6. **Check that you're on the latest**
   - The **browser tab title** should say: **OdysseyOS (build 2.0)**.
   - A **green banner** at the top of the dashboard should say:  
     **"Build 2.0 — you are on the latest update..."**
   - On the **Stories** tab you should see only: **Collaborate**, **Sprint**, **Consistency** — **no Narrate** button.

If you do **not** see the green banner and the tab title "OdysseyOS (build 2.0)", you are still on an old build (wrong folder, wrong URL, or cache).

---

## Option B: You use a deployed site (Vercel, Netlify, etc.)

The code in this folder only affects:

- What runs when you do **Option A** (local `npm run dev`).
- What gets deployed **after** you push to Git and the host rebuilds.

So if you usually open something like `https://your-app.vercel.app`:

1. **Push** your latest code: `git add -A && git commit -m "Build 2.0" && git push`.
2. **Wait** for the deployment to finish (e.g. Vercel dashboard).
3. **Open the deployed URL** and do a **hard refresh** (Ctrl+Shift+R).

Until the host rebuilds from your latest push, the deployed site will keep showing the old version (Narrate button, no build 2.0 banner).

---

## Summary

- **Local:** Run from this folder, delete `.next`, `npm run dev`, open the URL from the terminal, Ctrl+Shift+R. You should see the green Build 2.0 banner and no Narrate button.
- **Deployed:** Push, wait for rebuild, then open the deployed URL and hard refresh.
- If you still don’t see **"OdysseyOS (build 2.0)"** in the tab and the green banner, the app you’re looking at is not this codebase’s build.
