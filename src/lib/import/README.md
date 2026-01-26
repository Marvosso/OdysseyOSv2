# Import Pipeline Documentation

## Overview

The import pipeline is a deterministic, multi-stage processor for importing `.txt` and `.md` files into OdysseyOS. It ensures text integrity, handles encoding variations, and provides confidence-scored structure detection.

## Pipeline Stages

### Stage 1: File Read + UTF-8 Normalization
**Class:** `FileReaderStage`

- Reads file content using browser File API
- Detects encoding (UTF-8, UTF-8-BOM, etc.)
- Normalizes to UTF-8, removing BOM markers
- Validates text integrity (no replacement characters)
- **Never corrupts:** All transformations are reversible or safe

### Stage 2: Line Ending Normalization
**Class:** `LineEndingNormalizer`

- Detects original line endings (CRLF, LF, CR, or MIXED)
- Normalizes all line endings to LF (Unix standard)
- Preserves original format information in metadata
- **Preserves formatting:** Original structure maintained, only line endings changed

### Stage 3: Chapter Detection (Confidence Scored)
**Class:** `ChapterDetector`

- Detects chapter markers using pattern matching
- Assigns confidence scores (0-1) to each detection
- Considers context (isolated lines, length, content)
- Supports multiple formats:
  - Markdown headers (`# Chapter 1`)
  - Plain text (`Chapter 1`)
  - Roman numerals (`Chapter IV`)
  - Parts, Acts, Books
- **Deterministic:** Same input always produces same detections

### Stage 4: Scene Detection
**Class:** `SceneDetector`

- Detects explicit scene breaks (`***`, `---`, etc.)
- Detects paragraph breaks (multiple empty lines)
- Marks chapter boundaries as scene breaks
- **Preserves structure:** All scene breaks identified and preserved

### Stage 5: Word Counting (Accurate)
**Class:** `WordCounter`

- UTF-8 safe word counting
- Handles multi-byte characters correctly
- Counts words for:
  - Entire document
  - Each chapter
  - Each scene
- Uses the word counting utilities from `models.ts`
- **Accurate:** Handles Unicode, contractions, hyphenated words

### Stage 6: Validation & Preview
**Classes:** `ImportValidator`, `PreviewGenerator`

- Validates text integrity
- Checks for encoding issues
- Validates word counts
- Checks chapter consistency
- Generates preview data for UI
- **Safe:** Never proceeds with corrupted data

## Usage

```typescript
import { ImportPipeline } from '@/lib/import/importPipeline';

// In a file input handler
const file = event.target.files[0];
if (file) {
  try {
    const result = await ImportPipeline.execute(file, 'My Story');
    
    // Access results
    console.log('Title:', result.title);
    console.log('Chapters:', result.detectedChapters);
    console.log('Scenes:', result.detectedScenes);
    console.log('Word count:', result.totalWordCount.computed);
    console.log('Validation:', result.validation);
    console.log('Preview:', result.preview);
    
    // Check if valid
    if (result.validation.isValid) {
      // Proceed with import
    } else {
      // Handle errors
      console.error('Errors:', result.validation.errors);
    }
  } catch (error) {
    if (error instanceof ImportError) {
      console.error('Import error:', error.message, error.code);
    }
  }
}
```

## Design Decisions

### Deterministic Behavior
- Same input always produces same output
- No randomness or non-deterministic operations
- All transformations are predictable

### Text Integrity
- Never corrupts text during processing
- Validates encoding at each stage
- Preserves original formatting
- Detects and reports encoding issues

### Confidence Scoring
- Chapter detection uses confidence scores (0-1)
- Allows UI to show uncertain detections
- Enables user review of low-confidence matches
- Threshold: 0.3 minimum confidence

### Separation of Concerns
- Each stage is a separate class
- No interdependencies between stages
- Easy to test each stage independently
- Can be extended or replaced individually

### No UI Code
- Pure business logic
- Returns data structures, not UI components
- UI layer handles presentation
- Can be used in any context (CLI, API, etc.)

## Error Handling

The pipeline uses custom `ImportError` class:

```typescript
try {
  const result = await ImportPipeline.execute(file);
} catch (error) {
  if (error instanceof ImportError) {
    // Handle import-specific errors
    switch (error.code) {
      case 'FILE_READ_ERROR':
        // File couldn't be read
        break;
      case 'ENCODING_ERROR':
        // Encoding issues detected
        break;
      case 'PIPELINE_ERROR':
        // General pipeline error
        break;
    }
  }
}
```

## Output Structure

### ImportResult
```typescript
{
  title: string;
  normalizedText: NormalizedText;
  detectedChapters: DetectedChapter[];
  detectedScenes: DetectedScene[];
  totalWordCount: WordCount;
  chapterWordCounts: Map<number, WordCount>;
  sceneWordCounts: Map<number, WordCount>;
  validation: ValidationResult;
  preview: PreviewData;
}
```

### DetectedChapter
```typescript
{
  lineIndex: number;
  title: string;
  originalLine: string;
  confidence: number; // 0-1
  matchedPattern: string;
}
```

### ValidationResult
```typescript
{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  textIntegrity: boolean;
  encodingIssues: string[];
}
```

## Testing Considerations

Each stage can be tested independently:

```typescript
// Test line ending normalization
const normalized = LineEndingNormalizer.normalize('Line1\r\nLine2\rLine3\n');

// Test chapter detection
const chapters = ChapterDetector.detectChapters(['Chapter 1', 'Content', 'Chapter 2']);

// Test word counting
const wordCount = WordCounter.countWords('Hello world');
```

## Performance

- Efficient line-by-line processing
- No unnecessary string copies
- Lazy evaluation where possible
- Handles large files (warns if >10MB)

## Future Extensions

- Custom chapter detection patterns
- Scene break pattern customization
- Language-specific word counting
- Parallel processing for large files
- Streaming for very large files
