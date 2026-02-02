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
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/export/page.tsx:20',message:'ExportPage rendered',data:{defaultStoryId:defaultStory.id,defaultStoryTitle:defaultStory.title,scenesCount:defaultStory.scenes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{console.log('[DEBUG] ExportPage rendered');});
  }
  // #endregion
  
  return (
    <div className="max-w-7xl mx-auto">
      <ExportManager story={defaultStory} />
    </div>
  );
}
