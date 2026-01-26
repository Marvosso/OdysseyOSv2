# Encoding Bug Fix - Garbled Text Issue

## Root Cause

The garbled binary-like characters (e.g., "ixj4'8euh") were caused by **incorrect text decoding** when reading files.

### The Problem

1. **`file.text()` assumes UTF-8**: The browser's `File.text()` method assumes all files are UTF-8 encoded
2. **Windows text files**: Many Windows text files are saved in Windows-1252 or ISO-8859-1 encoding
3. **Incorrect decoding**: When a Windows-1252 file is read as UTF-8, bytes that don't map to valid UTF-8 are replaced with the replacement character `` (U+FFFD)
4. **Result**: Text appears garbled with replacement characters scattered throughout

### Why This Happens

```
Original file (Windows-1252): "Café"
Bytes: [0x43, 0x61, 0x66, 0xE9]  (é = 0xE9 in Windows-1252)

Read as UTF-8:
- 0x43, 0x61, 0x66 decode correctly → "Caf"
- 0xE9 is not valid UTF-8 → replaced with
Result: "Caf"
```

## The Fix

### 1. Proper Encoding Detection

Instead of assuming UTF-8, we now:
- Read the file as `ArrayBuffer` to inspect raw bytes
- Detect encoding from BOM (Byte Order Mark) if present
- Try multiple encodings and pick the best match
- Validate the result to ensure no corruption

### 2. Safe Text Decoder

Created `BrowserTextDecoder` class that:
- Detects encoding (UTF-8, Windows-1252, ISO-8859-1, etc.)
- Decodes with the correct encoding
- Normalizes to UTF-8 output
- Validates for corruption

### 3. React Rendering Safety

Created `textSafety.ts` utilities that:
- Sanitize text before rendering
- Remove dangerous control characters
- Validate text before storing
- Provide safe React components

## How to Correctly Decode Text Files

### Browser Environment

```typescript
import { BrowserTextDecoder } from '@/lib/import/textDecoder';

// ✅ CORRECT: Read as ArrayBuffer, detect encoding, decode properly
const decoded = await BrowserTextDecoder.decodeFile(file);
const text = decoded.text; // Always UTF-8, properly decoded

// ❌ WRONG: Assumes UTF-8, may produce garbled text
const text = await file.text();
```

### Node.js Environment

```typescript
import { NodeTextDecoder } from '@/lib/import/textDecoder';
import fs from 'fs';

// ✅ CORRECT: Read buffer, detect encoding, decode properly
const buffer = fs.readFileSync('file.txt');
const decoded = NodeTextDecoder.decodeBuffer(buffer);
const text = decoded.text; // Always UTF-8, properly decoded

// ❌ WRONG: Assumes UTF-8
const text = fs.readFileSync('file.txt', 'utf8');
```

## Updated Code

### Import Pipeline (`importPipeline.ts`)

**Before:**
```typescript
static async readFile(file: File): Promise<{ text: string; encoding: string }> {
  const text = await file.text(); // ❌ Assumes UTF-8
  // ...
}
```

**After:**
```typescript
static async readFile(file: File): Promise<{ text: string; encoding: string }> {
  const decoded = await BrowserTextDecoder.decodeFile(file); // ✅ Proper decoding
  const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
  // ...
}
```

### Story Import Component (`StoryImport.tsx`)

**Before:**
```typescript
const text = await file.text(); // ❌ May produce garbled text
const parsed = StoryParser.parseTextFile(text, title);
```

**After:**
```typescript
const { BrowserTextDecoder } = await import('@/lib/import/textDecoder');
const decoded = await BrowserTextDecoder.decodeFile(file); // ✅ Proper decoding
const parsed = StoryParser.parseTextFile(decoded.text, title);
```

## React Rendering Safety

### Safe Text Rendering

```typescript
import { sanitizeTextForRender, SafeText } from '@/utils/textSafety';

// Option 1: Sanitize before rendering
const safeText = sanitizeTextForRender(scene.content);
<div>{safeText}</div>

// Option 2: Use SafeText component
<SafeText text={scene.content} preserveLineBreaks />
```

### Validation Before Storage

```typescript
import { validateTextForStorage } from '@/utils/textSafety';

const validation = validateTextForStorage(scene.content);
if (!validation.isValid) {
  console.error('Text validation failed:', validation.errors);
  // Handle error
} else {
  // Use validation.sanitized for storage
  localStorage.setItem('scene', JSON.stringify({
    ...scene,
    content: validation.sanitized
  }));
}
```

## Testing the Fix

### Test Cases

1. **UTF-8 file**: Should decode correctly
2. **Windows-1252 file**: Should detect and decode correctly
3. **ISO-8859-1 file**: Should detect and decode correctly
4. **File with BOM**: Should detect BOM and decode correctly
5. **Binary file**: Should detect encoding issues and report errors

### Verification

After importing a file, check:
- No replacement characters (``) in the text
- Special characters (é, ñ, etc.) display correctly
- No garbled binary-like characters
- Console shows encoding detection info

## Common Encodings

| Encoding | Common Use | BOM | Notes |
|----------|-----------|-----|-------|
| UTF-8 | Modern standard | EF BB BF | Most common, handles all Unicode |
| Windows-1252 | Windows text files | None | Common for Windows .txt files |
| ISO-8859-1 | Latin-1 | None | Western European languages |
| UTF-16 LE | Windows Unicode | FF FE | Less common in text files |
| UTF-16 BE | Big-endian Unicode | FE FF | Rare |

## Prevention

1. **Always use proper decoding**: Never assume UTF-8
2. **Validate decoded text**: Check for replacement characters
3. **Sanitize before rendering**: Use text safety utilities
4. **Validate before storage**: Check text integrity
5. **Log encoding info**: Help debug issues

## Migration Guide

If you have existing corrupted data:

1. **Re-import files**: Use the new import pipeline
2. **Clean existing data**: Remove replacement characters
3. **Validate stored data**: Check localStorage for encoding issues

```typescript
import { fixEncodingIssues } from '@/utils/textSafety';

// Fix existing corrupted scenes
const fixedScenes = scenes.map(scene => ({
  ...scene,
  content: fixEncodingIssues(scene.content)
}));
```

## Summary

- **Root cause**: `file.text()` assumes UTF-8, causing incorrect decoding of Windows-1252/ISO-8859-1 files
- **Fix**: Proper encoding detection and decoding using `BrowserTextDecoder`
- **Prevention**: Always validate and sanitize text before rendering/storage
- **Result**: Text files decode correctly regardless of original encoding
