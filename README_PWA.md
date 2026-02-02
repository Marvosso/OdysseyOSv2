# PWA Setup Guide

OdysseyOS has been configured as a Progressive Web App (PWA). This guide explains how to complete the setup.

## What's Included

✅ **next-pwa Configuration** - Service worker and caching strategies
✅ **Manifest.json** - App metadata and icons
✅ **Service Worker** - Offline support, background sync, push notifications
✅ **Offline Page** - Fallback page when offline
✅ **PWA Manager** - Utilities for managing PWA features
✅ **Background Sync** - Automatic sync when coming online
✅ **Install Prompt** - UI for installing the app

## Required: Generate App Icons

The manifest.json references icon files that need to be generated. You can:

1. **Use an online tool:**
   - Visit https://realfavicongenerator.net/
   - Upload your app icon (recommended: 512x512px)
   - Download the generated icons
   - Place them in `public/icons/` directory

2. **Use @vercel/og (as suggested):**
   ```bash
   npm install @vercel/og
   ```
   Then create a script to generate icons from your logo.

3. **Manual creation:**
   Create the following icon sizes in `public/icons/`:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

## Testing PWA Features

### 1. Install the App
- Open the app in Chrome/Edge
- Look for the install prompt (or use browser menu)
- Click "Install" to add to home screen

### 2. Test Offline Mode
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Navigate around the app
4. Verify offline page appears for uncached pages

### 3. Test Background Sync
1. Go offline
2. Make changes to your story
3. Go online
4. Changes should sync automatically

### 4. Test Push Notifications
1. Grant notification permission when prompted
2. Use `PWAManager.scheduleWritingReminder()` to test
3. Notifications should appear even when app is closed

## Configuration

### Cache Strategies

The service worker uses different cache strategies:

- **NetworkFirst** - For API calls (5 min cache)
- **CacheFirst** - For images (30 day cache)
- **NetworkFirst** - For general requests (24 hour cache)

### Background Sync Tags

- `sync-story-data` - Syncs story changes
- `sync-characters` - Syncs character data
- `sync-scenes` - Syncs scene data

## Production Deployment

1. **Generate icons** (see above)
2. **Build the app:**
   ```bash
   npm run build
   ```
3. **Verify service worker:**
   - Check `public/sw.js` exists
   - Check `public/workbox-*.js` files exist
4. **Deploy to hosting:**
   - Ensure HTTPS (required for PWA)
   - Service worker will be registered automatically

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari iOS (limited - no background sync)
- ✅ Safari macOS (limited - no background sync)

## Troubleshooting

### Service Worker Not Registering
- Ensure you're on HTTPS (or localhost)
- Check browser console for errors
- Verify `next.config.js` has PWA config

### Icons Not Showing
- Verify icons exist in `public/icons/`
- Check manifest.json paths are correct
- Clear browser cache

### Offline Not Working
- Check service worker is registered (DevTools → Application)
- Verify cache is populated
- Check network tab for failed requests

## Next Steps

1. Generate and add app icons
2. Test on mobile devices
3. Configure push notification server (if needed)
4. Set up backend API for background sync
5. Add analytics for PWA usage
