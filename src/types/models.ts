/**
 * Core Type Definitions for OdysseyOS
 * 
 * Design Principles:
 * - Immutable IDs using readonly and branded types
 * - Explicit ordering with position/order fields
 * - Dual word count: stored (for performance) and computed (for accuracy)
 * - UTF-8 safe text handling via TypeScript string type
 * - Versioning support for future change tracking
 */

// ============================================================================
// ID Types - Immutable and Branded for Type Safety
// ============================================================================

/**
 * Branded type for Story IDs - ensures type safety and immutability
 */
export type StoryId = string & { readonly __brand: 'StoryId' };

/**
 * Branded type for Chapter IDs
 */
export type ChapterId = string & { readonly __brand: 'ChapterId' };

/**
 * Branded type for Scene IDs
 */
export type SceneId = string & { readonly __brand: 'SceneId' };

/**
 * Branded type for Character IDs
 */
export type CharacterId = string & { readonly __brand: 'CharacterId' };

/**
 * Branded type for Beat IDs
 */
export type BeatId = string & { readonly __brand: 'BeatId' };

/**
 * Helper function to create a StoryId from a string
 */
export const createStoryId = (id: string): StoryId => id as StoryId;

/**
 * Helper function to create a ChapterId from a string
 */
export const createChapterId = (id: string): ChapterId => id as ChapterId;

/**
 * Helper function to create a SceneId from a string
 */
export const createSceneId = (id: string): SceneId => id as SceneId;

/**
 * Helper function to create a CharacterId from a string
 */
export const createCharacterId = (id: string): CharacterId => id as CharacterId;

/**
 * Helper function to create a BeatId from a string
 */
export const createBeatId = (id: string): BeatId => id as BeatId;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Version information for change tracking
 */
export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly createdAt: Readonly<Date>;
  readonly updatedAt: Readonly<Date>;
}

/**
 * Word count information - stored for performance, computed for accuracy
 */
export interface WordCount {
  /** Stored word count (cached for performance) */
  readonly stored: number;
  /** Computed word count (calculated from actual content) */
  readonly computed: number;
  /** Timestamp of last computation */
  readonly computedAt: Readonly<Date>;
}

/**
 * UTF-8 safe text content with metadata
 */
export interface TextContent {
  /** The actual text content (TypeScript strings are UTF-16, but handle UTF-8 correctly) */
  readonly text: string;
  /** Character count (including multi-byte characters) */
  readonly characterCount: number;
  /** Byte length if needed for UTF-8 encoding */
  readonly byteLength: number;
}

// ============================================================================
// Beat Model
// ============================================================================

/**
 * Type of story beat in narrative structure
 */
export type BeatType =
  | 'setup'
  | 'inciting-incident'
  | 'rising-action'
  | 'midpoint'
  | 'twist'
  | 'climax'
  | 'resolution'
  | 'character-moment'
  | 'theme'
  | 'world-building'
  | 'conflict'
  | 'revelation';

/**
 * Story Beat - represents a narrative moment or structural element
 */
export interface Beat {
  /** Immutable unique identifier */
  readonly id: BeatId;
  
  /** Reference to the scene this beat belongs to */
  readonly sceneId: SceneId;
  
  /** Type of beat in the narrative structure */
  readonly beatType: BeatType;
  
  /** Title/name of the beat */
  readonly title: string;
  
  /** Description or content of the beat */
  readonly description: TextContent;
  
  /** Explicit ordering within the scene (1-based) */
  readonly order: number;
  
  /** Position within scene as percentage (0-100) */
  readonly position: number;
  
  /** Word count (stored and computed) */
  readonly wordCount: WordCount;
  
  /** Emotional impact rating (1-10) */
  readonly emotionalImpact: number;
  
  /** Importance rating (1-10) */
  readonly importance: number;
  
  /** Associated conflicts */
  readonly conflicts: readonly string[];
  
  /** Associated resolutions */
  readonly resolutions: readonly string[];
  
  /** Version information */
  readonly version: Version;
  
  /** Metadata */
  readonly metadata: {
    readonly tags: readonly string[];
    readonly notes: string;
  };
}

// ============================================================================
// Scene Model
// ============================================================================

/**
 * Emotional tone/type for scenes
 */
export type EmotionType =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'neutral'
  | 'anticipation'
  | 'trust';

/**
 * Scene - a discrete unit of narrative action
 */
export interface Scene {
  /** Immutable unique identifier */
  readonly id: SceneId;
  
  /** Reference to the chapter this scene belongs to */
  readonly chapterId: ChapterId;
  
  /** Title of the scene */
  readonly title: string;
  
  /** Main content of the scene */
  readonly content: TextContent;
  
  /** Explicit ordering within the chapter (1-based) */
  readonly order: number;
  
  /** Word count (stored and computed) */
  readonly wordCount: WordCount;
  
  /** Emotional tone of the scene */
  readonly emotion: EmotionType;
  
  /** Emotional intensity (1-10) */
  readonly emotionalIntensity: number;
  
  /** POV character ID (if applicable) */
  readonly pointOfViewCharacterId?: CharacterId;
  
  /** Location/setting description */
  readonly setting: string;
  
  /** Beats within this scene */
  readonly beats: readonly BeatId[];
  
  /** Version information */
  readonly version: Version;
  
  /** Metadata */
  readonly metadata: {
    readonly tags: readonly string[];
    readonly notes: string;
    readonly draftStatus: 'draft' | 'revising' | 'final';
  };
}

// ============================================================================
// Chapter Model
// ============================================================================

/**
 * Chapter - a major division of the story
 */
export interface Chapter {
  /** Immutable unique identifier */
  readonly id: ChapterId;
  
  /** Reference to the story this chapter belongs to */
  readonly storyId: StoryId;
  
  /** Title of the chapter */
  readonly title: string;
  
  /** Chapter description/summary */
  readonly description: TextContent;
  
  /** Explicit ordering within the story (1-based) */
  readonly order: number;
  
  /** Word count (stored and computed) - aggregated from scenes */
  readonly wordCount: WordCount;
  
  /** Scenes within this chapter */
  readonly scenes: readonly SceneId[];
  
  /** Chapter number (may differ from order if chapters are renumbered) */
  readonly chapterNumber: number;
  
  /** Version information */
  readonly version: Version;
  
  /** Metadata */
  readonly metadata: {
    readonly tags: readonly string[];
    readonly notes: string;
    readonly status: 'outline' | 'draft' | 'revising' | 'final';
  };
}

// ============================================================================
// Character Model
// ============================================================================

/**
 * Character role in the story
 */
export type CharacterRole =
  | 'protagonist'
  | 'antagonist'
  | 'supporting'
  | 'mentor'
  | 'love-interest'
  | 'comic-relief'
  | 'foil'
  | 'narrator'
  | 'other';

/**
 * Character arc status
 */
export type ArcStatus = 'unstarted' | 'beginning' | 'middle' | 'crisis' | 'resolution' | 'complete';

/**
 * Character relationship information
 */
export interface CharacterRelationship {
  /** ID of the related character */
  readonly characterId: CharacterId;
  
  /** Type of relationship */
  readonly relationshipType: string;
  
  /** Intensity of relationship (1-10) */
  readonly intensity: number;
  
  /** Notes about the relationship */
  readonly notes: string;
}

/**
 * Character - a person or entity in the story
 */
export interface Character {
  /** Immutable unique identifier */
  readonly id: CharacterId;
  
  /** Character's name */
  readonly name: string;
  
  /** Character's role in the story */
  readonly role: CharacterRole;
  
  /** Age (if applicable) */
  readonly age?: number;
  
  /** Physical appearance description */
  readonly appearance: TextContent;
  
  /** Personality description */
  readonly personality: TextContent;
  
  /** Background/history */
  readonly background: TextContent;
  
  /** Motivation/goals */
  readonly motivation: TextContent;
  
  /** Flaws/weaknesses */
  readonly flaws: readonly string[];
  
  /** Strengths */
  readonly strengths: readonly string[];
  
  /** Current arc status */
  readonly arcStatus: ArcStatus;
  
  /** Relationships with other characters */
  readonly relationships: readonly CharacterRelationship[];
  
  /** Explicit ordering for display/listing purposes */
  readonly order: number;
  
  /** Word count of all character-related content */
  readonly wordCount: WordCount;
  
  /** Version information */
  readonly version: Version;
  
  /** Metadata */
  readonly metadata: {
    readonly tags: readonly string[];
    readonly notes: string;
    readonly imageUrl?: string;
  };
}

// ============================================================================
// Story Model
// ============================================================================

/**
 * Story status/workflow state
 */
export type StoryStatus =
  | 'outline'
  | 'draft'
  | 'revising'
  | 'beta-reading'
  | 'final'
  | 'published'
  | 'archived';

/**
 * Genre classification
 */
export type Genre =
  | 'fiction'
  | 'non-fiction'
  | 'fantasy'
  | 'sci-fi'
  | 'mystery'
  | 'thriller'
  | 'romance'
  | 'horror'
  | 'literary'
  | 'young-adult'
  | 'historical'
  | 'other';

/**
 * Story - the top-level narrative container
 */
export interface Story {
  /** Immutable unique identifier */
  readonly id: StoryId;
  
  /** Title of the story */
  readonly title: string;
  
  /** Story description/synopsis */
  readonly description: TextContent;
  
  /** Genre classification */
  readonly genre: Genre;
  
  /** Target audience */
  readonly targetAudience: string;
  
  /** Theme(s) of the story */
  readonly themes: readonly string[];
  
  /** Story status */
  readonly status: StoryStatus;
  
  /** Chapters in the story */
  readonly chapters: readonly ChapterId[];
  
  /** Characters in the story */
  readonly characters: readonly CharacterId[];
  
  /** Word count (stored and computed) - aggregated from all chapters */
  readonly wordCount: WordCount;
  
  /** Estimated word count goal */
  readonly estimatedWordCount?: number;
  
  /** Version information */
  readonly version: Version;
  
  /** Metadata */
  readonly metadata: {
    readonly tags: readonly string[];
    readonly notes: string;
    readonly coverImageUrl?: string;
    readonly author?: string;
  };
}

// ============================================================================
// Helper Functions for Word Count Computation
// ============================================================================

/**
 * Computes word count from text content (UTF-8 safe)
 * Handles multi-byte characters and various whitespace patterns
 * FIXED: Improved accuracy for edge cases
 */
export function computeWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Normalize whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');
  
  // Split on whitespace and filter
  const words = normalized
    .split(/\s+/)
    .filter(word => {
      // Remove empty strings
      if (word.length === 0) return false;
      
      // A word must contain at least one letter or number (Unicode-aware)
      // This handles hyphenated words, contractions, etc. as single words
      return /[\p{L}\p{N}]/u.test(word);
    });
  
  return words.length;
}

/**
 * Computes character count (including multi-byte characters)
 */
export function computeCharacterCount(text: string): number {
  return text.length; // TypeScript string.length handles UTF-16 correctly
}

/**
 * Computes byte length for UTF-8 encoding
 */
export function computeByteLength(text: string): number {
  // Encode to UTF-8 and get byte length
  return new TextEncoder().encode(text).length;
}

/**
 * Creates a TextContent object from a string
 */
export function createTextContent(text: string): TextContent {
  return {
    text,
    characterCount: computeCharacterCount(text),
    byteLength: computeByteLength(text),
  } as const;
}

/**
 * Creates a WordCount object with both stored and computed values
 */
export function createWordCount(text: string, storedCount?: number): WordCount {
  const computed = computeWordCount(text);
  return {
    stored: storedCount ?? computed,
    computed,
    computedAt: new Date(),
  } as const;
}

/**
 * Creates a Version object
 */
export function createVersion(
  major: number = 1,
  minor: number = 0,
  patch: number = 0
): Version {
  const now = new Date();
  return {
    major,
    minor,
    patch,
    createdAt: now,
    updatedAt: now,
  } as const;
}

/**
 * Updates version (increments patch by default)
 */
export function updateVersion(
  version: Version,
  type: 'major' | 'minor' | 'patch' = 'patch'
): Version {
  const now = new Date();
  switch (type) {
    case 'major':
      return {
        major: version.major + 1,
        minor: 0,
        patch: 0,
        createdAt: version.createdAt,
        updatedAt: now,
      } as const;
    case 'minor':
      return {
        major: version.major,
        minor: version.minor + 1,
        patch: 0,
        createdAt: version.createdAt,
        updatedAt: now,
      } as const;
    case 'patch':
    default:
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
        createdAt: version.createdAt,
        updatedAt: now,
      } as const;
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a string is a valid StoryId
 */
export function isStoryId(id: unknown): id is StoryId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid ChapterId
 */
export function isChapterId(id: unknown): id is ChapterId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid SceneId
 */
export function isSceneId(id: unknown): id is SceneId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid CharacterId
 */
export function isCharacterId(id: unknown): id is CharacterId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid BeatId
 */
export function isBeatId(id: unknown): id is BeatId {
  return typeof id === 'string' && id.length > 0;
}
