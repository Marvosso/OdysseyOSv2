'use client';

/**
 * Outline Page
 */

import OutlineBuilder from '@/components/outline/OutlineBuilder';

export default function OutlinePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <OutlineBuilder
        story={null}
        onOutlineComplete={() => {}}
        onSkip={() => {}}
      />
    </div>
  );
}
