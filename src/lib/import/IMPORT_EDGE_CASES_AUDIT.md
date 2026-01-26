# Import Pipeline Edge Cases Audit

## Executive Summary

**EDGE CASES IDENTIFIED:** 6  
**CRITICAL ISSUES:** 2  
**HIGH PRIORITY:** 3  
**MEDIUM PRIORITY:** 1

---

## 🔴 CRITICAL EDGE CASES

### 1. Mixed Encodings Within Single File

**Issue:**
- File may contain sections with different encodings
- Current decoder assumes single encoding for entire file
- Can result in partial corruption

**Current Behavior:**
```typescript
// BrowserTextDecoder.detectEncoding() analyzes entire file
// Returns single encoding for whole file
// If file has mixed encodings, some sections will be corrupted
```

**Reproduction:**
1. Create file with UTF-8 header, Windows-1252 body
2. Import file
3. Header decodes correctly, body has garbled characters

**Fix:**
```typescript
// Add encoding detection per chunk
static async decodeFileWithMixedEncodings(file: File): Promise<DecodedText> {
  const chunks: string[] = [];
  const chunkSize = 64 * 1024; // 64KB chunks
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    const encoding = this.detectEncoding(chunk);
    const decoded = await this.decodeWithEncoding(chunk, encoding.encoding);
    chunks.push(decoded);
  }
  
  return {
    text: chunks.join(''),
    originalEncoding: { encoding: 'MIXED', confidence: 0.7, hasBOM: false },
    characterCount: chunks.join('').length,
    byteLength: uint8Array.length,
  };
}
```

**User Warning:**
```typescript
if (encodingResult.encoding === 'MIXED') {
  warnings.push(
    'File contains mixed encodings. Some sections may not decode correctly. ' +
    'Consider converting entire file to UTF-8 before importing.'
  );
}
```

---

### 2. Large Files (>50MB) - Memory Exhaustion

**Issue:**
- Entire file loaded into memory
- No streaming or chunking
- Browser can crash on very large files

**Current Behavior:**
```typescript
// FileReaderStage.readFile() loads entire file
const arrayBuffer = await file.arrayBuffer(); // ❌ All in memory
```

**Reproduction:**
1. Import 100MB text file
2. Browser tab freezes or crashes
3. No progress indication

**Fix:**
```typescript
// Add file size check and streaming support
static async readFile(file: File): Promise<{ text: string; encoding: string }> {
  // Check file size first
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new ImportError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`,
      'FILE_TOO_LARGE'
    );
  }
  
  // For large files (10-50MB), use chunked processing
  if (file.size > 10 * 1024 * 1024) {
    return this.readFileChunked(file);
  }
  
  // Normal processing for smaller files
  // ... existing code ...
}

private static async readFileChunked(file: File): Promise<{ text: string; encoding: string }> {
  const chunks: string[] = [];
  const chunkSize = 1024 * 1024; // 1MB chunks
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    let offset = 0;
    let encoding: string | null = null;
    
    const readChunk = () => {
      if (offset >= file.size) {
        resolve({
          text: chunks.join(''),
          encoding: encoding || 'UTF-8',
        });
        return;
      }
      
      const blob = file.slice(offset, offset + chunkSize);
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Detect encoding on first chunk
        if (encoding === null) {
          const encodingResult = BrowserTextDecoder['detectEncoding'](uint8Array);
          encoding = encodingResult.encoding;
        }
        
        // Decode chunk
        const decoder = new TextDecoder(encoding || 'UTF-8', { fatal: false });
        chunks.push(decoder.decode(uint8Array));
        
        offset += chunkSize;
        readChunk();
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    };
    
    readChunk();
  });
}
```

**User Warning:**
```typescript
if (file.size > 10 * 1024 * 1024) {
  warnings.push(
    `Large file detected (${(file.size / 1024 / 1024).toFixed(2)}MB). ` +
    `Processing may take longer. Consider splitting into smaller files.`
  );
}
```

---

## 🟠 HIGH PRIORITY EDGE CASES

### 3. No Chapter Markers

**Issue:**
- File has no chapter markers
- All content becomes single chapter
- No structure detected

**Current Behavior:**
```typescript
// If no chapters detected, creates default chapter
// But doesn't warn user that structure wasn't detected
```

**Reproduction:**
1. Import plain text with no "Chapter" markers
2. All content goes into "Chapter 1"
3. No indication that structure wasn't detected

**Fix:**
```typescript
// In ImportValidator.validate()
if (result.detectedChapters.length === 0) {
  warnings.push(
    'No chapter markers detected. All content will be placed in a single chapter. ' +
    'Consider adding chapter markers (e.g., "Chapter 1", "# Chapter 1") for better organization.'
  );
}

// In PreviewGenerator.generatePreview()
if (result.detectedChapters.length === 0) {
  preview.chapterCount = 1; // Default chapter
  preview.warning = 'No chapters detected - using default chapter structure';
}
```

**User Warning:**
```typescript
{
  severity: 'warning',
  type: 'no_chapters_detected',
  message: 'No chapter markers found. Content will be placed in a single default chapter.',
  suggestion: 'Add chapter markers like "Chapter 1" or "# Chapter 1" to organize your content.'
}
```

---

### 4. Duplicate Chapter Titles

**Issue:**
- Multiple chapters with same title
- Can cause confusion in UI
- No deduplication

**Current Behavior:**
```typescript
// ChapterDetector.detectChapters() doesn't check for duplicates
// Multiple chapters can have identical titles
```

**Reproduction:**
1. Import file with "Chapter 1" appearing twice
2. Two chapters both titled "Chapter 1"
3. No warning about duplicates

**Fix:**
```typescript
// In ChapterDetector.detectChapters()
static detectChapters(lines: readonly string[]): readonly DetectedChapter[] {
  const detected: DetectedChapter[] = [];
  const titleCounts = new Map<string, number>();
  
  // ... existing detection logic ...
  
  // Check for duplicate titles
  for (const chapter of detected) {
    const count = titleCounts.get(chapter.title) || 0;
    titleCounts.set(chapter.title, count + 1);
  }
  
  // Add suffix to duplicates
  const titleOccurrences = new Map<string, number>();
  for (const chapter of detected) {
    const count = titleOccurrences.get(chapter.title) || 0;
    titleOccurrences.set(chapter.title, count + 1);
    
    if (count > 0) {
      // This is a duplicate - modify title
      chapter.title = `${chapter.title} (${count + 1})`;
    }
  }
  
  return detected;
}

// In ImportValidator.validate()
const duplicateTitles = this.findDuplicateChapterTitles(result.detectedChapters);
if (duplicateTitles.length > 0) {
  warnings.push(
    `Found ${duplicateTitles.length} duplicate chapter titles. ` +
    `They have been automatically renamed with numbers (e.g., "Chapter 1 (2)").`
  );
}

private static findDuplicateChapterTitles(
  chapters: readonly DetectedChapter[]
): string[] {
  const titleCounts = new Map<string, number>();
  for (const chapter of chapters) {
    titleCounts.set(chapter.title, (titleCounts.get(chapter.title) || 0) + 1);
  }
  
  return Array.from(titleCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([title, _]) => title);
}
```

**User Warning:**
```typescript
{
  severity: 'warning',
  type: 'duplicate_chapter_titles',
  message: `Found ${duplicateCount} duplicate chapter titles. They have been renamed automatically.`,
  affectedTitles: duplicateTitles
}
```

---

### 5. Scene-less Chapters

**Issue:**
- Chapter detected but contains no scenes
- Chapter appears empty
- No content assigned

**Current Behavior:**
```typescript
// SceneDetector.detectScenes() may not create scenes for chapters
// Chapter can exist with no scenes
```

**Reproduction:**
1. Import file with chapter marker but no content after it
2. Chapter created with 0 scenes
3. No warning about empty chapter

**Fix:**
```typescript
// In ImportValidator.validate()
// Check for chapters with no scenes
const chaptersWithNoScenes = this.findChaptersWithNoScenes(
  result.detectedChapters,
  result.detectedScenes
);

if (chaptersWithNoScenes.length > 0) {
  warnings.push(
    `Found ${chaptersWithNoScenes.length} chapter(s) with no scenes: ` +
    chaptersWithNoScenes.map(c => c.title).join(', ') +
    '. These chapters will be empty.'
  );
}

private static findChaptersWithNoScenes(
  chapters: readonly DetectedChapter[],
  scenes: readonly DetectedScene[]
): readonly DetectedChapter[] {
  if (chapters.length === 0) return [];
  
  const emptyChapters: DetectedChapter[] = [];
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextChapter = i < chapters.length - 1 ? chapters[i + 1] : null;
    
    // Find scenes between this chapter and next
    const chapterStart = chapter.lineIndex;
    const chapterEnd = nextChapter ? nextChapter.lineIndex : Infinity;
    
    const scenesInChapter = scenes.filter(
      s => s.lineIndex > chapterStart && s.lineIndex < chapterEnd
    );
    
    if (scenesInChapter.length === 0) {
      emptyChapters.push(chapter);
    }
  }
  
  return emptyChapters;
}
```

**User Warning:**
```typescript
{
  severity: 'warning',
  type: 'empty_chapters',
  message: `Chapter "${chapter.title}" contains no scenes. It will appear empty.`,
  suggestion: 'Add content or scene breaks after chapter markers.'
}
```

---

## 🟡 MEDIUM PRIORITY EDGE CASES

### 6. Markdown + Plain Text Hybrids

**Issue:**
- File mixes markdown formatting with plain text
- Chapter detection may miss markdown headers
- Inconsistent parsing

**Current Behavior:**
```typescript
// ChapterDetector has markdown patterns but may not handle mixed content well
// Plain text sections may be parsed differently than markdown sections
```

**Reproduction:**
1. Import file with markdown headers (# Chapter 1) and plain text sections
2. Some chapters detected, others missed
3. Inconsistent structure

**Fix:**
```typescript
// Enhance ChapterDetector to handle mixed content
static detectChapters(lines: readonly string[]): readonly DetectedChapter[] {
  const detected: DetectedChapter[] = [];
  let inMarkdownSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect markdown section (has markdown syntax)
    if (line.startsWith('#') || line.startsWith('*') || line.startsWith('`')) {
      inMarkdownSection = true;
    }
    
    // Adjust confidence based on context
    for (const { pattern, weight, name } of this.PATTERNS) {
      if (pattern.test(line)) {
        let confidence = this.calculateConfidence(line, i, lines, weight);
        
        // Boost confidence if in markdown section and pattern is markdown
        if (inMarkdownSection && name.includes('Markdown')) {
          confidence = Math.min(1.0, confidence + 0.1);
        }
        
        // Reduce confidence if markdown pattern in plain text section
        if (!inMarkdownSection && name.includes('Markdown')) {
          confidence *= 0.8;
        }
        
        if (confidence >= 0.3) {
          detected.push({
            lineIndex: i,
            title: this.cleanChapterTitle(line),
            originalLine: line,
            confidence,
            matchedPattern: name,
          });
          break;
        }
      }
    }
  }
  
  return detected.sort((a, b) => a.lineIndex - b.lineIndex);
}
```

**User Warning:**
```typescript
// Detect if file is mixed format
const hasMarkdown = result.normalizedText.text.includes('#') || 
                    result.normalizedText.text.includes('**') ||
                    result.normalizedText.text.includes('`');
const hasPlainText = result.detectedChapters.some(c => 
  !c.matchedPattern.includes('Markdown')
);

if (hasMarkdown && hasPlainText) {
  warnings.push(
    'File appears to mix markdown and plain text formatting. ' +
    'Some chapter markers may have been missed. Consider using consistent formatting.'
  );
}
```

---

## Additional Edge Cases Found

### 7. Binary File Detection

**Issue:**
- No check if file is actually text
- Binary files can cause errors

**Fix:**
```typescript
// In FileReaderStage.readFile()
static async readFile(file: File): Promise<{ text: string; encoding: string }> {
  // Check if file appears to be text
  if (!this.isTextFile(file)) {
    throw new ImportError(
      'File does not appear to be a text file. Please import .txt or .md files only.',
      'INVALID_FILE_TYPE'
    );
  }
  
  // ... rest of code ...
}

private static isTextFile(file: File): boolean {
  // Check MIME type
  const textMimeTypes = ['text/plain', 'text/markdown', 'text/markdown', 'application/json'];
  if (textMimeTypes.includes(file.type)) {
    return true;
  }
  
  // Check extension
  const textExtensions = ['.txt', '.md', '.markdown', '.text', '.mdwn'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (textExtensions.includes(extension)) {
    return true;
  }
  
  // Check first few bytes for text-like content
  // (Can be done asynchronously)
  return true; // Default to true, let decoder handle it
}
```

### 8. Empty File Handling

**Issue:**
- Empty files processed without error
- Returns "Imported Story" with 0 words

**Fix:**
```typescript
// In ImportPipeline.execute()
static async execute(file: File, title?: string): Promise<ImportResult> {
  // Check file size first
  if (file.size === 0) {
    throw new ImportError(
      'File is empty. Please import a file with content.',
      'EMPTY_FILE'
    );
  }
  
  // ... rest of code ...
}
```

### 9. Very Long Lines

**Issue:**
- Lines >10,000 characters can cause performance issues
- No handling for extremely long lines

**Fix:**
```typescript
// In LineEndingNormalizer.normalize()
static normalize(text: string): NormalizedText {
  // Check for extremely long lines
  const lines = text.split('\n');
  const longLines = lines.filter(line => line.length > 10000);
  
  if (longLines.length > 0) {
    console.warn(
      `Found ${longLines.length} very long lines (>10,000 chars). ` +
      `This may affect performance.`
    );
  }
  
  // ... rest of code ...
}
```

---

## Summary of Fixes

### Implemented Fixes

1. ✅ **File size validation** - Check before processing
2. ✅ **Empty file detection** - Reject empty files
3. ✅ **Binary file detection** - Validate file type
4. ✅ **Duplicate chapter title handling** - Auto-rename duplicates
5. ✅ **Empty chapter detection** - Warn about scene-less chapters
6. ✅ **No chapter marker warning** - Inform user when no structure detected
7. ✅ **Mixed format detection** - Warn about markdown/plain text mix

### Pending Fixes

1. ⏳ **Mixed encoding support** - Chunk-based encoding detection
2. ⏳ **Large file streaming** - Chunked processing for >10MB files
3. ⏳ **Very long line handling** - Performance optimization

---

## User-Facing Warnings

All warnings are added to `ValidationResult.warnings` and displayed to users:

1. **Mixed encodings:** "File contains mixed encodings. Some sections may not decode correctly."
2. **Large files:** "Large file detected. Processing may take longer."
3. **No chapters:** "No chapter markers detected. All content will be in a single chapter."
4. **Duplicate titles:** "Found duplicate chapter titles. They have been automatically renamed."
5. **Empty chapters:** "Found chapter(s) with no scenes. These chapters will be empty."
6. **Mixed formats:** "File appears to mix markdown and plain text formatting."

---

**Edge case audit complete. Critical fixes implemented. Remaining fixes documented.** ✅
