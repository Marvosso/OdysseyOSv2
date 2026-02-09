# Why the main Vercel URL doesn’t show new changes

## What’s going on

- **Production URL** (e.g. `your-project.vercel.app` or your custom domain) always shows the **latest production deployment**.
- **Preview URLs** (e.g. `your-project-abc123-username.vercel.app`) are created for each git push or PR and show that specific commit.

So:

- If you only see new changes when you “click one of the deployment links,” you’re opening a **preview** deployment for the latest commit.
- The **main domain** will only show those changes after they become the **production** deployment.

## When does the main domain update?

1. You push to the **production branch** (usually `main`).
2. Vercel builds that branch and creates a new deployment.
3. When that deployment is the **production** one (same branch as in Project Settings → Git → Production Branch), the **production domain** is updated to point to it.

So the main URL can be “behind” if:

- You’re looking at a preview link for a new commit, but the latest **production** deployment is still from an older commit, or  
- The production build is still in progress or failed, or  
- The browser or a CDN is serving a cached version of the old deployment.

## What to do

1. **Confirm production branch**  
   In Vercel: **Project → Settings → Git → Production Branch**. Usually `main`. Push your changes to that branch.

2. **Wait for the production build**  
   In **Deployments**, find the deployment for that branch and wait until it’s **Ready**. The deployment marked as **Production** is what the main URL serves.

3. **Force the main URL to use the latest production build**  
   - In Vercel: open the latest **production** deployment → **⋯** → **Promote to Production** (if it isn’t already).  
   - Or trigger a redeploy: **Deployments** → latest production → **⋯** → **Redeploy**.

4. **Avoid cache**  
   Do a hard refresh (e.g. Ctrl+Shift+R) or open the site in an incognito window. This app uses a PWA/service worker that caches pages; if the main URL still looks old, try **Application** → **Storage** → **Clear site data** (or unregister the service worker) and reload.

## Summary

- **Preview links** = one per commit, show that commit’s build.  
- **Main domain** = always shows the **current production** deployment (from the production branch).  
- To see new changes on the main URL: push to the production branch, wait for that deployment to be production, then hard refresh (or redeploy/promote if needed).
