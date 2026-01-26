# Minimal Next.js 16+ Setup for Vercel Deployment

This document outlines the minimal Next.js 16+ App Router project structure for OdysseyOS that is ready for Vercel deployment.

## Project Structure

```
odysseyos/
├── src/
│   ├── app/
│   │   └── page.tsx          # Root page component
│   └── lib/
│       └── supabaseClient.ts # Supabase client configuration
├── package.json               # Dependencies and scripts
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── .env.example              # Environment variables template
```

## Files Overview

### 1. `src/app/page.tsx`
- Functional React component
- Displays "OdysseyOS is Live!" heading
- Includes paragraph for testing deployment
- Comments indicating where future components will go
- Minimal inline styling

### 2. `package.json`
- Name: `odysseyos`
- Version: `1.0.0`
- License: `MIT`
- Dependencies:
  - `next ^16.0.0`
  - `react ^18.3.0`
  - `react-dom ^18.3.0`
  - `@supabase/supabase-js ^2.45.0`
  - `typescript ^5.6.0` (dev)
- Scripts: `dev`, `build`, `start`, `lint`

### 3. `next.config.js`
- Default Next.js configuration
- `reactStrictMode: true`
- TypeScript build errors enabled

### 4. `tsconfig.json`
- Minimal TypeScript setup for Next.js 16 App Router
- Path aliases configured: `@/*` → `./src/*`
- JSX: `react-jsx` (React automatic runtime)

### 5. `src/lib/supabaseClient.ts`
- Exports Supabase client singleton
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Includes helper functions for session and user management

### 6. `.env.example`
- Template for Supabase environment variables
- Placeholders for URL and anon key

## Deployment Checklist

### Before Deploying to Vercel:

1. ✅ **Project Structure**: All files are in place
2. ✅ **Dependencies**: `package.json` includes all required packages
3. ✅ **TypeScript**: `tsconfig.json` configured for Next.js 16
4. ✅ **Next.js Config**: `next.config.js` with proper settings
5. ✅ **Root Page**: `src/app/page.tsx` displays correctly
6. ✅ **Supabase Client**: `src/lib/supabaseClient.ts` ready for import

### Vercel Environment Variables:

Add these in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Verification:

After deployment, verify:
- ✅ Root page `/` loads without 404
- ✅ "OdysseyOS is Live!" heading displays
- ✅ No build errors in Vercel logs
- ✅ Supabase client can be imported in components

## Usage

### Local Development:

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Production Build:

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Next Steps

After successful deployment, you can:
1. Add authentication pages using `src/lib/supabaseClient.ts`
2. Integrate StoryCanvas component
3. Add CharacterHub and other OdysseyOS features
4. Configure additional API routes

---

**Status**: ✅ Ready for Vercel deployment
