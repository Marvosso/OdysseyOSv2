'use client';

/**
 * World Building Page
 */

import WorldBuilder from '@/components/world-builder/WorldBuilder';

export default function WorldPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <WorldBuilder
        story={null}
        onUpdate={() => {}}
      />
    </div>
  );
}
