# Quick Vercel Setup Guide

## 🚀 Fast Setup Steps

### 1. Set Environment Variables in Vercel

Go to: **Your Project → Settings → Environment Variables**

Add these two variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://ldrbsfuohtmwxhphyngv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmJzZnVvaHRtd3hocGh5bmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE0MTgsImV4cCI6MjA4NTAxNzQxOH0.lhlJmp4ucI2GZrybAW-oVN_NROtVEHlvYUjNYXJkyzk
```

**Important:** Select all environments (Production, Preview, Development)

### 2. Commit and Push

All deployment fixes are ready. Just push:

```bash
git add .
git commit -m "Fix Vercel deployment - Add layout, Tailwind config, fix versions"
git push origin main
```

### 3. Monitor Deployment

Vercel will automatically deploy. Check the build logs - it should succeed now!

---

## ✅ What's Fixed

- ✅ Root layout file created
- ✅ Tailwind CSS configured
- ✅ Node.js version updated (20.9+)
- ✅ ESLint version fixed
- ✅ API routes verified
- ✅ Environment variables template ready

---

## 📝 Next Steps After Deployment

1. Test the homepage loads: `https://your-app.vercel.app`
2. Test API routes if needed
3. Verify Supabase connection works

---

**You're all set!** 🎉
