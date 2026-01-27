'use client';

/**
 * AI Tools Page
 */

import StructureDetection from '@/components/ai/StructureDetection';

export default function AIPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <StructureDetection
        onConfirm={() => {}}
        onCancel={() => {}}
        initialText=""
      />
    </div>
  );
}
