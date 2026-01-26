# Expected Directory Structure for odysseyos-v2

This document shows the expected structure after migration.

## Complete Directory Tree

```
odysseyos-v2/
└── src/
    ├── components/
    │   ├── ai/
    │   │   └── StructureDetection.tsx
    │   ├── beat-editor/
    │   │   └── BeatEditor.tsx
    │   ├── block-breaker/
    │   ├── branching/
    │   │   └── BranchManager.tsx
    │   ├── characters/
    │   │   ├── CharacterBuilder.tsx
    │   │   ├── CharacterCard.tsx
    │   │   ├── CharacterForm.tsx
    │   │   └── CharacterHub.tsx
    │   ├── collaboration/
    │   │   └── CollaborationHub.tsx
    │   ├── dna-analyzer/
    │   │   └── StoryDNA.tsx
    │   ├── export/
    │   │   └── ExportManager.tsx
    │   ├── guidance/
    │   │   └── GuidanceEngine.tsx
    │   ├── import/                    ⚠️ REVIEW: May need removal
    │   │   └── StoryImport.tsx
    │   ├── music/
    │   │   └── MusicPlayer.tsx
    │   ├── outline/
    │   │   └── OutlineBuilder.tsx
    │   ├── player/
    │   │   └── NarrativePlayer.tsx
    │   ├── publishing/
    │   │   └── PublishingHub.tsx
    │   ├── stories/
    │   │   └── StoryCanvas.tsx
    │   ├── story-dna/
    │   ├── streaks/
    │   │   └── StreakTracker.tsx
    │   ├── ui/
    │   ├── visualization/
    │   │   └── EmotionTimeline.tsx
    │   ├── voice-trainer/
    │   │   └── VoiceTrainer.tsx
    │   ├── world-builder/
    │   │   └── WorldBuilder.tsx
    │   ├── world-building/
    │   └── writing-coach/
    │       └── WritingCoach.tsx
    │
    ├── lib/
    │   ├── ai/
    │   │   └── structureDetector.ts
    │   ├── data/
    │   │   ├── beatTemplates.ts
    │   │   ├── guidanceQuestions.ts
    │   │   ├── musicLibrary.ts
    │   │   ├── outlineTemplates.ts
    │   │   ├── storyArchetypes.ts
    │   │   └── writingCoach.ts
    │   └── storage/                   ⚠️ REVIEW: May need removal
    │       ├── storyParser.ts
    │       └── storyStorage.ts
    │
    ├── types/
    │   ├── ai.ts
    │   ├── analysis.ts
    │   ├── beat.ts
    │   ├── branch.ts
    │   ├── characters.ts
    │   ├── collab.ts
    │   ├── guidance.ts
    │   ├── music.ts
    │   ├── outline.ts
    │   ├── publish.ts
    │   ├── story.ts
    │   ├── streak.ts
    │   ├── voice.ts
    │   └── world.ts
    │
    ├── utils/                         (may be empty)
    │
    └── styles/                        (only if present in original)
        └── [style files]
```

## Directory Counts

Based on the current structure:

- **components/**: ~20+ subdirectories
- **lib/**: 3 subdirectories (ai, data, storage*)
- **types/**: 13 TypeScript definition files
- **utils/**: May be empty
- **styles/**: Only if exists in original

*storage/ may need to be removed per requirements

## Files to Review/Remove

### ⚠️ Potential Exclusions

1. **src/components/import/**
   - Contains: `StoryImport.tsx`
   - Action: Review if this is "import logic" that should be excluded

2. **src/lib/storage/**
   - Contains: `storyParser.ts`, `storyStorage.ts`
   - Action: Review if this is "storage logic" that should be excluded

## What Should NOT Be Present

- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.git/`
- ❌ `app/`
- ❌ `pages/`
- ❌ `api/`
- ❌ Any build artifacts
- ❌ Configuration files (unless specifically needed)

## Verification

After migration, verify:
1. All expected directories exist
2. File counts match original (excluding excluded items)
3. No excluded directories are present
4. Review flagged directories (import/, storage/)
