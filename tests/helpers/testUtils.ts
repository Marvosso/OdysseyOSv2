/**
 * Test Utilities
 * 
 * Common utilities for testing
 */

import type { Story, Chapter, Scene } from '@/types/models';

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock localStorage with cleanup
 */
export function setupLocalStorageMock(): void {
  const storage: Record<string, string> = {};
  
  global.localStorage = {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    }),
  } as any;
}

/**
 * Clear all mocks
 */
export function clearAllMocks(): void {
  jest.clearAllMocks();
  if (global.localStorage) {
    (global.localStorage as any).clear();
  }
}

/**
 * Assert story structure is valid
 */
export function assertStoryStructure(
  story: Story,
  chapters: Chapter[],
  scenes: Scene[]
): void {
  // Check story references chapters
  for (const chapterId of story.chapters) {
    expect(chapters.some(c => c.id === chapterId)).toBe(true);
  }
  
  // Check chapters reference scenes
  for (const chapter of chapters) {
    for (const sceneId of chapter.scenes) {
      expect(scenes.some(s => s.id === sceneId)).toBe(true);
    }
  }
  
  // Check scenes reference chapters
  for (const scene of scenes) {
    expect(chapters.some(c => c.id === scene.chapterId)).toBe(true);
  }
}

/**
 * Assert dates are Date objects
 */
export function assertDatesAreObjects(obj: any, path: string = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (key.toLowerCase().endsWith('at') || 
        key.toLowerCase().endsWith('date') ||
        key.toLowerCase() === 'timestamp') {
      if (value !== null && value !== undefined) {
        expect(value).toBeInstanceOf(Date);
      }
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      assertDatesAreObjects(value, currentPath);
    }
  }
}

/**
 * Create mock file reader
 */
export function createMockFileReader(content: string): FileReader {
  const reader = {
    result: null as any,
    readyState: FileReader.DONE,
    error: null,
    onload: null as any,
    onerror: null as any,
    readAsArrayBuffer: jest.fn((blob: Blob) => {
      blob.arrayBuffer().then(buffer => {
        reader.result = buffer;
        if (reader.onload) {
          reader.onload({ target: { result: buffer } } as any);
        }
      });
    }),
    readAsText: jest.fn((blob: Blob) => {
      blob.text().then(text => {
        reader.result = text;
        if (reader.onload) {
          reader.onload({ target: { result: text } } as any);
        }
      });
    }),
  } as any;
  
  return reader;
}
