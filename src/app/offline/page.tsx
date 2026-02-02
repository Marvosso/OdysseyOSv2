'use client';

/**
 * Offline Page
 * 
 * Shown when user is offline and tries to navigate to a page not in cache
 */

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
    };

    checkOnline();
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <WifiOff className="w-24 h-24 text-gray-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="text-gray-400">
            It looks like you've lost your internet connection. Don't worry, you can still work on your stories!
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
          
          {isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-500">
            Your work is saved locally. When you're back online, your changes will sync automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
