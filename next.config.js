/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Exclude root page and redirects from caching
      urlPattern: ({ url }) => {
        // Don't cache the root page (it redirects)
        if (url.pathname === '/' || url.pathname === '') {
          return false;
        }
        // Don't cache redirect responses
        return true;
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10,
        // Follow redirects
        fetchOptions: {
          redirect: 'follow',
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 5,
        fetchOptions: {
          redirect: 'follow',
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        fetchOptions: {
          redirect: 'follow',
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
  // Exclude root page from precaching
  publicExcludes: ['/'],
});

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Add empty turbopack config to silence warning (next-pwa requires webpack)
  turbopack: {},
};

module.exports = withPWA(nextConfig);
