import type { Metadata } from 'next';
import './globals.css';
import PWAInitializer from '@/components/pwa/PWAInitializer';
import SpeechFixInterceptor from '@/components/audio/SpeechFixInterceptor';

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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333EA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OdysseyOS" />
      </head>
      <body>
        <SpeechFixInterceptor />
        {children}
        <PWAInitializer />
      </body>
    </html>
  );
}
