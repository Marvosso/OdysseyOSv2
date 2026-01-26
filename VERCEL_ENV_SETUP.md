# Vercel Environment Variables Setup

## ⚠️ IMPORTANT: Security Notice

**DO NOT commit these credentials to git!** They are already in `.gitignore` and should only be set in:
1. Vercel Dashboard (for production)
2. Local `.env.local` file (for development, not committed)

---

## Vercel Dashboard Setup

### Step 1: Go to Vercel Project Settings
1. Open your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**

### Step 2: Add Environment Variables

Add these two variables for **Production**, **Preview**, and **Development**:

#### Variable 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://ldrbsfuohtmwxhphyngv.supabase.co`
- **Environment:** Select all (Production, Preview, Development)

#### Variable 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmJzZnVvaHRtd3hocGh5bmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE0MTgsImV4cCI6MjA4NTAxNzQxOH0.lhlJmp4ucI2GZrybAW-oVN_NROtVEHlvYUjNYXJkyzk`
- **Environment:** Select all (Production, Preview, Development)

### Step 3: Redeploy
After adding the variables, trigger a new deployment or wait for the next automatic deployment.

---

## Local Development Setup (Optional)

If you want to run the app locally, create a `.env.local` file in the project root:

```bash
# .env.local (DO NOT COMMIT THIS FILE)
NEXT_PUBLIC_SUPABASE_URL=https://ldrbsfuohtmwxhphyngv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmJzZnVvaHRtd3hocGh5bmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE0MTgsImV4cCI6MjA4NTAxNzQxOH0.lhlJmp4ucI2GZrybAW-oVN_NROtVEHlvYUjNYXJkyzk
```

**Note:** `.env.local` is already in `.gitignore`, so it won't be committed.

---

## Verification

After setting up environment variables:

1. **In Vercel:** Check build logs to ensure variables are available
2. **Locally:** Restart your dev server after creating `.env.local`
3. **Test:** The Supabase client should initialize without warnings

---

## Security Best Practices

✅ **DO:**
- Set variables in Vercel dashboard
- Use `.env.local` for local development (not committed)
- Rotate keys if they're ever exposed

❌ **DON'T:**
- Commit `.env` files to git
- Share credentials in public channels
- Hardcode credentials in source code

---

**Status:** Ready to configure in Vercel dashboard
