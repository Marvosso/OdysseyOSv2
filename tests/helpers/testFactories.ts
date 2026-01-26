/**
 * Test Factories
 * 
 * Helper functions to create test data
 */

import type {
  Story,
  Chapter,
  Scene,
  StoryId,
  ChapterId,
  SceneId,
} from '@/types/models';
import {
  createStoryId,
  createChapterId,
  createSceneId,
  createTextContent,
  createWordCount,
  createVersion,
} from '@/types/models';

/**
 * Create mock story
 */
export function createMockStory(overrides?: Partial<Story>): Story {
  const id = createStoryId(overrides?.id || `story-${Date.now()}`);
  const version = createVersion();
  
  return {
    id,
    title: overrides?.title || 'Test Story',
    description: createTextContent(overrides?.description?.text || 'Test description'),
    genre: overrides?.genre || 'fiction',
    targetAudience: overrides?.targetAudience || 'adults',
    themes: overrides?.themes || [],
    status: overrides?.status || 'draft',
    chapters: overrides?.chapters || [],
    characters: overrides?.characters || [],
    wordCount: createWordCount('Test content'),
    version,
    metadata: {
      tags: [],
      notes: '',
      ...overrides?.metadata,
    },
    ...overrides,
  };
}

/**
 * Create mock chapter
 */
export function createMockChapter(
  idOrOverrides?: string | Partial<Chapter>,
  order?: number
): Chapter {
  const isString = typeof idOrOverrides === 'string';
  const id = isString
    ? createChapterId(idOrOverrides)
    : createChapterId(idOrOverrides?.id || `chapter-${Date.now()}`);
  const overrides = isString ? {} : (idOrOverrides || {});
  
  const storyId = createStoryId(overrides.storyId || 'story-1');
  const version = createVersion();
  
  return {
    id,
    storyId,
    title: overrides.title || `Chapter ${order || 1}`,
    description: createTextContent(overrides.description?.text || 'Chapter description'),
    order: order ?? overrides.order ?? 1,
    wordCount: createWordCount('Chapter content'),
    scenes: overrides.scenes || [],
    chapterNumber: overrides.chapterNumber ?? (order || 1),
    version,
    metadata: {
      tags: [],
      notes: '',
      status: 'draft',
      ...overrides.metadata,
    },
    ...overrides,
  } as Chapter;
}

/**
 * Create mock scene
 */
export function createMockScene(
  idOrOverrides?: string | Partial<Scene>,
  chapterId?: ChapterId,
  order?: number
): Scene {
  const isString = typeof idOrOverrides === 'string';
  const id = isString
    ? createSceneId(idOrOverrides)
    : createSceneId(idOrOverrides?.id || `scene-${Date.now()}`);
  const overrides = isString ? {} : (idOrOverrides || {});
  
  const sceneChapterId = chapterId || createChapterId('chapter-1');
  const version = createVersion();
  
  return {
    id,
    chapterId: sceneChapterId,
    title: overrides.title || `Scene ${order || 1}`,
    content: createTextContent(overrides.content?.text || 'Scene content'),
    order: order ?? overrides.order ?? 1,
    wordCount: createWordCount('Scene content'),
    emotion: overrides.emotion || 'neutral',
    emotionalIntensity: overrides.emotionalIntensity ?? 5,
    setting: overrides.setting || 'Unknown location',
    beats: overrides.beats || [],
    version,
    metadata: {
      tags: [],
      draftStatus: 'draft',
      ...overrides.metadata,
    },
    ...overrides,
  } as Scene;
}

/**
 * Create mock story with chapters and scenes
 */
export function createMockStoryWithStructure(options?: {
  chapterCount?: number;
  scenesPerChapter?: number;
}): {
  story: Story;
  chapters: Chapter[];
  scenes: Scene[];
} {
  const { chapterCount = 3, scenesPerChapter = 2 } = options || {};
  const story = createMockStory();
  const chapters: Chapter[] = [];
  const scenes: Scene[] = [];
  
  for (let i = 0; i < chapterCount; i++) {
    const chapterScenes: SceneId[] = [];
    for (let j = 0; j < scenesPerChapter; j++) {
      const scene = createMockScene(
        `scene-${i + 1}-${j + 1}`,
        createChapterId(`chapter-${i + 1}`),
        j + 1
      );
      scenes.push(scene);
      chapterScenes.push(scene.id);
    }
    
    // Create chapter with storyId and scenes already set
    const chapter = createMockChapter({
      id: createChapterId(`chapter-${i + 1}`),
      storyId: story.id,
      scenes: chapterScenes,
      order: i + 1,
    });
    chapters.push(chapter);
  }
  
  // Create story with chapters already set
  const storyWithChapters = createMockStory({
    ...story,
    chapters: chapters.map(c => c.id),
  });
  
  return { story: storyWithChapters, chapters, scenes };
}

/**
 * Create corrupted JSON string
 */
export function createCorruptedJSON(): string {
  return 'invalid json{';
}

/**
 * Create file with content
 */
export function createTestFile(
  content: string,
  filename: string = 'test.txt',
  mimeType: string = 'text/plain'
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Create large file (for testing)
 */
export function createLargeFile(
  sizeMB: number,
  filename: string = 'large.txt'
): File {
  const content = 'x'.repeat(sizeMB * 1024 * 1024);
  return createTestFile(content, filename);
}

/**
 * Create file with encoding
 */
export async function createFileWithEncoding(
  content: string,
  encoding: 'UTF-8' | 'Windows-1252' | 'ISO-8859-1',
  filename: string = 'test.txt'
): Promise<File> {
  let bytes: Uint8Array;
  
  if (encoding === 'UTF-8') {
    bytes = new TextEncoder().encode(content);
  } else {
    // For other encodings, simulate with TextEncoder
    // In real tests, you might use iconv-lite or similar
    bytes = new TextEncoder().encode(content);
  }
  
  const blob = new Blob([bytes]);
  return new File([blob], filename, { type: 'text/plain' });
}
