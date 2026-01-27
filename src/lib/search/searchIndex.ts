/**
 * Search Index
 * 
 * Fast, case-insensitive search across stories, scenes, and characters
 */

import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Story, Scene, Character } from '@/types/story';

export interface SearchResult {
  type: 'story' | 'scene' | 'character';
  id: string;
  title: string;
  content?: string;
  matchText: string;
  relevance: number;
}

export interface SearchResults {
  stories: SearchResult[];
  scenes: SearchResult[];
  characters: SearchResult[];
  total: number;
}

/**
 * Search match structure
 */
type SearchMatch = {
  index: number;
  relevance: number;
};

/**
 * Search indexer for OdysseyOS content
 */
export class SearchIndex {
  /**
   * Normalize text for searching (lowercase, trim)
   */
  private static normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * Calculate relevance score based on match position and type
   */
  private static calculateRelevance(
    query: string,
    text: string,
    matchIndex: number,
    isTitle: boolean = false
  ): number {
    const normalizedText = this.normalizeText(text);
    const normalizedQuery = this.normalizeText(query);
    
    // Base relevance
    let relevance = 1.0;

    // Title matches are more relevant
    if (isTitle) {
      relevance *= 2.0;
    }

    // Exact match is more relevant
    if (normalizedText === normalizedQuery) {
      relevance *= 3.0;
    } else if (normalizedText.startsWith(normalizedQuery)) {
      relevance *= 2.0;
    }

    // Earlier matches are slightly more relevant
    if (matchIndex < 10) {
      relevance *= 1.2;
    }

    return relevance;
  }

  /**
   * Find all matches in text
   */
  private static findMatches(text: string, query: string): Array<{ index: number; length: number }> {
    const normalizedText = this.normalizeText(text);
    const normalizedQuery = this.normalizeText(query);
    const matches: Array<{ index: number; length: number }> = [];
    
    if (!normalizedQuery) return matches;

    let index = 0;
    while ((index = normalizedText.indexOf(normalizedQuery, index)) !== -1) {
      matches.push({
        index,
        length: normalizedQuery.length,
      });
      index += normalizedQuery.length;
    }

    return matches;
  }

  /**
   * Extract context around match (for preview)
   */
  private static extractContext(text: string, matchIndex: number, contextLength: number = 50): string {
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(text.length, matchIndex + contextLength);
    let context = text.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context.trim();
  }

  /**
   * Search stories
   */
  private static searchStories(query: string): SearchResult[] {
    const story = StoryStorage.loadStory();
    if (!story) return [];

    const results: SearchResult[] = [];
    const normalizedQuery = this.normalizeText(query);

    // Search story title
    if (story.title) {
      const titleMatches = this.findMatches(story.title, query);
      if (titleMatches.length > 0) {
        const relevance = this.calculateRelevance(query, story.title, 0, true);
        results.push({
          type: 'story',
          id: story.id,
          title: story.title,
          matchText: story.title,
          relevance,
        });
      }
    }

    return results;
  }

  /**
   * Search scenes
   */
  private static searchScenes(query: string): SearchResult[] {
    const data = StoryStorage.loadAll();
    const scenes = data.scenes || [];
    const results: SearchResult[] = [];
    const normalizedQuery = this.normalizeText(query);

    for (const scene of scenes) {
      let hasMatch = false;
      let bestMatch: SearchMatch | null = null;
      let matchText = '';

      // Search scene title
      if (scene.title) {
        const titleMatches = this.findMatches(scene.title, query);
        if (titleMatches.length > 0) {
          const relevance = this.calculateRelevance(query, scene.title, 0, true);
          if (bestMatch === null || relevance > bestMatch.relevance) {
            bestMatch = {
              index: 0,
              relevance,
            };
            matchText = scene.title;
          }
          hasMatch = true;
        }
      }

      // Search scene content
      if (scene.content) {
        const contentMatches = this.findMatches(scene.content, query);
        if (contentMatches.length > 0) {
          const firstMatch = contentMatches[0];
          const relevance = this.calculateRelevance(query, scene.content, firstMatch.index, false);
          if (bestMatch === null || relevance > bestMatch.relevance) {
            bestMatch = {
              index: firstMatch.index,
              relevance,
            };
            matchText = this.extractContext(scene.content, firstMatch.index);
          }
          hasMatch = true;
        }
      }

      if (hasMatch && bestMatch) {
        results.push({
          type: 'scene',
          id: scene.id,
          title: scene.title || 'Untitled Scene',
          content: matchText,
          matchText: matchText,
          relevance: bestMatch.relevance,
        });
      }
    }

    return results;
  }

  /**
   * Search characters
   */
  private static searchCharacters(query: string): SearchResult[] {
    const characters = StoryStorage.loadCharacters();
    const results: SearchResult[] = [];
    const normalizedQuery = this.normalizeText(query);

    for (const character of characters) {
      let hasMatch = false;
      let bestMatch: SearchMatch | null = null;
      let matchText = '';

      // Search character name
      if (character.name) {
        const nameMatches = this.findMatches(character.name, query);
        if (nameMatches.length > 0) {
          const relevance = this.calculateRelevance(query, character.name, 0, true);
          if (bestMatch === null || relevance > bestMatch.relevance) {
            bestMatch = {
              index: 0,
              relevance,
            };
            matchText = character.name;
          }
          hasMatch = true;
        }
      }

      // Search character description
      if (character.description) {
        const descMatches = this.findMatches(character.description, query);
        if (descMatches.length > 0) {
          const firstMatch = descMatches[0];
          const relevance = this.calculateRelevance(query, character.description, firstMatch.index, false);
          if (bestMatch === null || relevance > bestMatch.relevance) {
            bestMatch = {
              index: firstMatch.index,
              relevance,
            };
            matchText = this.extractContext(character.description, firstMatch.index);
          }
          hasMatch = true;
        }
      }

      if (hasMatch && bestMatch) {
        results.push({
          type: 'character',
          id: character.id,
          title: character.name,
          content: matchText,
          matchText: matchText,
          relevance: bestMatch.relevance,
        });
      }
    }

    return results;
  }

  /**
   * Perform global search
   */
  static search(query: string): SearchResults {
    if (!query || query.trim().length === 0) {
      return {
        stories: [],
        scenes: [],
        characters: [],
        total: 0,
      };
    }

    const trimmedQuery = query.trim();
    
    // Search all categories
    const stories = this.searchStories(trimmedQuery);
    const scenes = this.searchScenes(trimmedQuery);
    const characters = this.searchCharacters(trimmedQuery);

    // Sort by relevance (highest first)
    const sortByRelevance = (a: SearchResult, b: SearchResult) => b.relevance - a.relevance;
    
    stories.sort(sortByRelevance);
    scenes.sort(sortByRelevance);
    characters.sort(sortByRelevance);

    return {
      stories,
      scenes,
      characters,
      total: stories.length + scenes.length + characters.length,
    };
  }

  /**
   * Highlight search terms in text
   */
  static highlightMatches(text: string, query: string): string {
    if (!query || !text) return text;

    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const regex = new RegExp(`(${this.escapeRegex(normalizedQuery)})`, 'gi');
    
    // Find all matches with their original case
    const matches: Array<{ start: number; end: number }> = [];
    let match;
    const searchRegex = new RegExp(this.escapeRegex(query), 'gi');
    
    while ((match = searchRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Build highlighted HTML
    if (matches.length === 0) return text;

    let highlighted = '';
    let lastIndex = 0;

    for (const match of matches) {
      // Add text before match
      if (match.start > lastIndex) {
        highlighted += this.escapeHTML(text.substring(lastIndex, match.start));
      }

      // Add highlighted match
      const matchText = text.substring(match.start, match.end);
      highlighted += `<mark class="bg-yellow-500/30 text-yellow-200">${this.escapeHTML(matchText)}</mark>`;

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      highlighted += this.escapeHTML(text.substring(lastIndex));
    }

    return highlighted;
  }

  /**
   * Escape regex special characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
