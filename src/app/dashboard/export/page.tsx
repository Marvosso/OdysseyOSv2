'use client';

/**
 * Export Page
 */

import ExportManager from '@/components/export/ExportManager';

export default function ExportPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <ExportManager story={null} />
    </div>
  );
}
