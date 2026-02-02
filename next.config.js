/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Cache pages (root page is excluded in service worker)
      urlPattern: /^https?.*/,
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
  // Webpack configuration for speech synthesis fix
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Inject speech fix into all client bundles
      const webpack = require('webpack');
      
      // Add DefinePlugin for speech fix flag
      config.plugins.push(
        new webpack.DefinePlugin({
          'window.__SPEECH_FIX': JSON.stringify(true),
        })
      );
      
      // Add banner with fix code that runs before any other code
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `
// SPEECH SYNTHESIS AUTO-FIX (injected at build time)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.__speechFixInstalled = true;
  const origSpeak = window.speechSynthesis.speak;
  window.speechSynthesis.speak = function(utterance) {
    if (window.speechSynthesis.speaking) {
      console.warn('[Auto-Fix] Speech already active, cancelling previous');
      window.speechSynthesis.cancel();
      setTimeout(() => origSpeak.call(this, utterance), 100);
      return;
    }
    return origSpeak.call(this, utterance);
  };
}
          `,
          raw: true,
          entryOnly: true,
          include: /\.js$/,
        })
      );
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
