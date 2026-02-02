# Archived Speech Synthesis Files

This directory contains old browser SpeechSynthesis API implementations that have been replaced with ResponsiveVoice.

## Files Archived

- `safeSpeechService.ts` - Old safe speech service wrapper
- `speechManager.ts` - Old singleton speech manager
- `speechErrorInterceptor.ts` - Old error interceptor
- `voiceLoader.ts` - Old voice loading utility
- `textChunker.ts` - Old text chunking utility
- `debugSpeech.ts` - Old debug wrapper
- `globalSpeechLock.ts` - Old global lock mechanism
- `errorRecovery.ts` - Old error recovery utilities
- `devSpeechDisabler.ts` - Old dev disabler
- `SpeechDebugger.tsx` - Old debug component
- `SpeechServiceTester.tsx` - Old test component
- `SpeechErrorFix.tsx` - Old error fix component
- `SpeechFixInterceptor.tsx` - Old interceptor component

## Migration

All voice narration now uses:
- `ResponsiveVoiceService` (`src/lib/audio/responsiveVoiceService.ts`)
- `SimpleVoicePlayer` (`src/components/voice/SimpleVoicePlayer.tsx`)
- `NarrationControls` (updated to use ResponsiveVoice)

## Status

These files are kept for reference only and should not be imported or used in new code.
