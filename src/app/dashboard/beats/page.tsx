'use client';

/**
 * Beats Page
 */

import BeatEditor from '@/components/beat-editor/BeatEditor';

export default function BeatsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <BeatEditor
        sceneId="scene-1"
        sceneTitle="Scene"
        sceneContent=""
        onBeatChange={() => {}}
      />
    </div>
  );
}
