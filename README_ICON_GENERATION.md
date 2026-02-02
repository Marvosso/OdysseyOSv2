# Icon Generation Guide

This guide explains how to generate PWA icons using @vercel/og.

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, generate icons:**
   ```bash
   npm run generate-icons
   ```

   Or on Windows PowerShell:
   ```powershell
   .\scripts\generate-icons.ps1
   ```

3. **Icons will be generated in `public/icons/`**

## How It Works

The icon generation uses Vercel's OG Image API to programmatically create PNG images:

1. **API Route** (`src/app/api/og/icon/route.tsx`):
   - Accepts a `size` parameter
   - Generates a styled icon with the OdysseyOS logo
   - Returns a PNG image

2. **Generation Script** (`scripts/generate-icons.js`):
   - Fetches icons from the API route
   - Generates all required sizes (72px to 512px)
   - Saves them to `public/icons/`

## Customization

### Change Icon Design

Edit `src/app/api/og/icon/route.tsx` to customize:
- Colors (currently purple gradient)
- Logo/text
- Background
- Border radius
- Font styles

### Change Icon Sizes

Edit the `iconSizes` array in `scripts/generate-icons.js`:
```javascript
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
```

## Manual Generation

If you prefer to generate icons manually:

1. Visit each URL in your browser:
   - http://localhost:3000/api/og/icon?size=72
   - http://localhost:3000/api/og/icon?size=96
   - etc.

2. Right-click and "Save image as..." to `public/icons/`

## Alternative: Use Online Tools

If you prefer not to use @vercel/og:

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload a 512x512px icon
   - Download generated icons
   - Place in `public/icons/`

2. **PWA Asset Generator**: https://github.com/onderceylan/pwa-asset-generator
   ```bash
   npx pwa-asset-generator logo.png public/icons
   ```

## Verification

After generation, verify icons exist:
```bash
ls public/icons/
```

You should see:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Troubleshooting

### "Connection refused" error
- Make sure the dev server is running on port 3000
- Check if another process is using port 3000

### Icons not generating
- Check browser console for API errors
- Verify the API route is accessible: http://localhost:3000/api/og/icon?size=192

### Icons look wrong
- Clear browser cache
- Check the API route code for styling issues
- Verify image format is PNG

## Production

In production, the API route will work the same way. You can:
1. Generate icons during build
2. Pre-generate and commit to repo
3. Use a CI/CD step to generate icons

For best performance, pre-generate icons and commit them to the repository.
