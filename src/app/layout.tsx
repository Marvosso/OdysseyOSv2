import type { Metadata } from 'next';
import './globals.css';
import PWAInitializer from '@/components/pwa/PWAInitializer';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'OdysseyOS - Story Writing Platform',
  description: 'A comprehensive story writing platform with AI-powered features, character management, and world building',
  manifest: '/manifest.json',
  themeColor: '#9333EA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OdysseyOS',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
      icons: {
        icon: [
          { url: '/api/og/icon?size=192', sizes: '192x192', type: 'image/png' },
          { url: '/api/og/icon?size=512', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
          { url: '/api/og/icon?size=192', sizes: '192x192', type: 'image/png' },
        ],
      },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){document.documentElement.setAttribute('data-theme','dark');})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var f=window.fetch;if(!f)return;window.fetch=function(u,o){var s=typeof u==='string'?u:(u&&u.url||'');if(s.indexOf('7242/ingest')!==-1||s.indexOf('127.0.0.1:7242')!==-1)return Promise.resolve(new Response('',{status:200}));return f.apply(this,arguments);};})();`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#9333EA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OdysseyOS" />
        {/* ResponsiveVoice disabled - narration feature temporarily disabled */}
      </head>
      <body data-build="odysseyos-v5-2025-02-09">
        <ThemeProvider>
          {children}
          <PWAInitializer />
        </ThemeProvider>
      </body>
    </html>
  );
}
