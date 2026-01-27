'use client';

/**
 * Export Page
 */

import ExportManager from '@/components/export/ExportManager';
import type { Story } from '@/types/story';

// Default empty story for export page
const defaultStory: Story = {
  id: 'default',
  title: 'Untitled Story',
  scenes: [],
  characters: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function ExportPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <ExportManager story={defaultStory} />
    </div>
  );
}
