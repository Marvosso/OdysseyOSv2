# Speech Synthesis Conflicts Audit

## Problem
Multiple components are directly using `window.speechSynthesis` and creating `SpeechSynthesisUtterance` instances, bypassing the `SpeechManager` singleton. This causes conflicts and "interrupted" errors.

## Components with Direct Usage

### 1. `src/lib/export/audioGenerator.ts` ⚠️ CRITICAL
- **Lines 299-365**: Direct `window.speechSynthesis` usage
- **Line 313**: Creates `SpeechSynthesisUtterance` directly
- **Line 365**: Calls `window.speechSynthesis.speak()` directly
- **Impact**: High - Used by AudioExportPanel (though we updated it, this is still in the codebase)

### 2. `src/components/player/NarrativePlayer.tsx` ⚠️ HIGH
- **Lines 66-104**: Direct `window.speechSynthesis` usage
- **Line 69**: Creates `SpeechSynthesisUtterance` directly
- **Line 99**: Has `onerror` handler
- **Line 104**: Calls `window.speechSynthesis.speak()` directly
- **Impact**: High - Active component that could conflict with narration

### 3. `src/components/voice-trainer/VoiceTrainer.tsx` ⚠️ MEDIUM
- **Lines 154-156**: Direct `window.speechSynthesis` usage
- **Line 155**: Creates `SpeechSynthesisUtterance` directly
- **Impact**: Medium - Less frequently used

### 4. `src/lib/narration/speechController.ts` ⚠️ MEDIUM
- **Lines 158-172**: Direct `speechSynthesis` usage for pause/resume
- **Impact**: Medium - Should delegate to SpeechManager but has some direct calls

## Solution
All components should use `SpeechManager.getInstance()` instead of direct `speechSynthesis` access.

## Priority
1. **NarrativePlayer.tsx** - Most likely to conflict with active narration
2. **audioGenerator.ts** - Legacy code, should be deprecated or updated
3. **VoiceTrainer.tsx** - Less critical but should be fixed
4. **speechController.ts** - Already mostly using SpeechManager, just needs cleanup
