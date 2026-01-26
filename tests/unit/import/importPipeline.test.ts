/**
 * Import Pipeline Tests
 * 
 * Tests for import edge cases and data integrity
 */

import { ImportPipeline, ImportError } from '@/lib/import/importPipeline';
import { createTestFile, createLargeFile } from '../../helpers/testFactories';

describe('ImportPipeline - Edge Cases', () => {
  describe('Empty File', () => {
    it('should reject empty files', async () => {
      const emptyFile = createTestFile('', 'empty.txt');

      await expect(ImportPipeline.execute(emptyFile)).rejects.toThrow(ImportError);
      await expect(ImportPipeline.execute(emptyFile)).rejects.toThrow('empty');
    });
  });

  describe('Large File', () => {
    it('should reject files over 50MB', async () => {
      const largeFile = createLargeFile(51); // 51MB

      await expect(ImportPipeline.execute(largeFile)).rejects.toThrow(ImportError);
      await expect(ImportPipeline.execute(largeFile)).rejects.toThrow('too large');
    });

    it('should warn for files over 10MB', async () => {
      const largeFile = createLargeFile(11); // 11MB

      const result = await ImportPipeline.execute(largeFile);
      expect(result.validation.warnings.some(w => 
        w.includes('Large file detected')
      )).toBe(true);
    });
  });

  describe('No Chapter Markers', () => {
    it('should warn when no chapters detected', async () => {
      const content = 'Just some text with no chapter markers.';
      const file = createTestFile(content, 'test.txt');

      const result = await ImportPipeline.execute(file);
      
      expect(result.validation.warnings.some(w => 
        w.includes('No chapter markers detected')
      )).toBe(true);
      expect(result.detectedChapters.length).toBe(0);
    });
  });

  describe('Duplicate Chapter Titles', () => {
    it('should auto-rename duplicate chapter titles', async () => {
      const content = 'Chapter 1\n\nContent\n\nChapter 1\n\nMore content';
      const file = createTestFile(content, 'test.txt');

      const result = await ImportPipeline.execute(file);
      const titles = result.detectedChapters.map(c => c.title);

      expect(titles).toContain('Chapter 1');
      expect(titles.some(t => t.includes('Chapter 1 (2)'))).toBe(true);
      expect(result.validation.warnings.some(w => 
        w.includes('duplicate chapter title')
      )).toBe(true);
    });
  });

  describe('Scene-less Chapters', () => {
    it('should detect chapters with no scenes', async () => {
      const content = 'Chapter 1\n\nChapter 2\n\nContent here';
      const file = createTestFile(content, 'test.txt');

      const result = await ImportPipeline.execute(file);
      
      expect(result.validation.warnings.some(w => 
        w.includes('chapter(s) with no scenes')
      )).toBe(true);
    });
  });

  describe('Mixed Markdown/Plain Text', () => {
    it('should detect mixed markdown and plain text', async () => {
      const content = '# Chapter 1\n\nContent\n\nChapter 2\n\nMore content';
      const file = createTestFile(content, 'test.txt');

      const result = await ImportPipeline.execute(file);
      
      expect(result.validation.warnings.some(w => 
        w.includes('mix markdown and plain text')
      )).toBe(true);
    });
  });
});
