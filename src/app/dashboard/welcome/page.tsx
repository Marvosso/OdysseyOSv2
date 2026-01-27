'use client';

/**
 * Welcome / Feature Tour Page
 * 
 * Interactive tour of all OdysseyOS features
 */

import FeatureTour from '@/components/welcome/FeatureTour';

export default function WelcomePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <FeatureTour />
    </div>
  );
}
