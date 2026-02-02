/**
 * AI Import Enhancer
 * 
 * Uses GPT-4 API to enhance story imports with:
 * - AI chapter splitting
 * - Character relationship inference
 * - Theme/genre tagging
 * - Story summary generation
 */

export interface AIEnhancementOptions {
  enableChapterSplitting?: boolean;
  enableRelationshipInference?: boolean;
  enableThemeTagging?: boolean;
  enableSummaryGeneration?: boolean;
}

export interface AIChapterSplit {
  chapterNumber: number;
  title: string;
  startLine: number;
  endLine: number;
  confidence: number;
  reasoning?: string;
}

export interface CharacterRelationship {
  character1: string;
  character2: string;
  relationship: string;
  intensity: number; // 1-10
  evidence: string[];
}

export interface ThemeTag {
  theme: string;
  confidence: number;
  evidence: string[];
}

export interface StorySummary {
  summary: string;
  genre: string;
  themes: string[];
  tone: string;
  wordCount: number;
}

export interface AIEnhancementResult {
  chapters?: AIChapterSplit[];
  relationships?: CharacterRelationship[];
  themes?: ThemeTag[];
  summary?: StorySummary;
  cached: boolean;
  timestamp: number;
}

/**
 * Check if user has premium tier access
 */
export function hasPremiumAccess(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for premium flag
  // In production, this would check against a backend API
  const premiumFlag = localStorage.getItem('odysseyos-premium');
  return premiumFlag === 'true' || process.env.NEXT_PUBLIC_ENABLE_AI === 'true';
}

/**
 * Generate cache key for text content
 */
function generateCacheKey(text: string, options: AIEnhancementOptions): string {
  const textHash = btoa(text.substring(0, 1000)).replace(/[^a-zA-Z0-9]/g, '');
  const optionsKey = JSON.stringify(options);
  return `ai-enhancement-${textHash}-${btoa(optionsKey).replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Get cached AI enhancement result
 */
export function getCachedEnhancement(
  text: string,
  options: AIEnhancementOptions
): AIEnhancementResult | null {
  if (typeof window === 'undefined') return null;
  
  const cacheKey = generateCacheKey(text, options);
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const result = JSON.parse(cached) as AIEnhancementResult;
      // Check if cache is still valid (24 hours)
      const age = Date.now() - result.timestamp;
      if (age < 24 * 60 * 60 * 1000) {
        return { ...result, cached: true };
      }
    } catch (e) {
      console.error('Error parsing cached enhancement:', e);
    }
  }
  
  return null;
}

/**
 * Cache AI enhancement result
 */
function cacheEnhancement(
  text: string,
  options: AIEnhancementOptions,
  result: AIEnhancementResult
): void {
  if (typeof window === 'undefined') return;
  
  const cacheKey = generateCacheKey(text, options);
  const toCache = {
    ...result,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(toCache));
  } catch (e) {
    console.error('Error caching enhancement:', e);
    // If storage is full, try to clear old cache entries
    clearOldCacheEntries();
  }
}

/**
 * Clear old cache entries (keep last 50)
 */
function clearOldCacheEntries(): void {
  if (typeof window === 'undefined') return;
  
  const entries: Array<{ key: string; timestamp: number }> = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ai-enhancement-')) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed.timestamp) {
            entries.push({ key, timestamp: parsed.timestamp });
          }
        }
      } catch (e) {
        // Invalid entry, remove it
        localStorage.removeItem(key!);
      }
    }
  }
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);
  
  // Remove oldest entries if we have more than 50
  if (entries.length > 50) {
    const toRemove = entries.slice(0, entries.length - 50);
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  }
}

/**
 * Call GPT-4 API for chapter splitting
 */
async function callGPT4ForChapters(text: string): Promise<AIChapterSplit[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback to heuristic-based splitting if no API key
    return fallbackChapterSplitting(text);
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing story structure. Identify chapter breaks in the provided text. Return a JSON array of chapters with: chapterNumber, title, startLine, endLine, confidence (0-1), and optional reasoning.',
          },
          {
            role: 'user',
            content: `Analyze this story and identify chapter breaks:\n\n${text.substring(0, 50000)}`, // Limit to 50k chars
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in API response');
    }
    
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    const chapters = JSON.parse(jsonStr) as AIChapterSplit[];
    return chapters;
  } catch (error) {
    console.error('Error calling GPT-4 for chapters:', error);
    return fallbackChapterSplitting(text);
  }
}

/**
 * Fallback heuristic-based chapter splitting
 */
function fallbackChapterSplitting(text: string): AIChapterSplit[] {
  const lines = text.split('\n');
  const chapters: AIChapterSplit[] = [];
  let chapterNum = 1;
  let startLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^chapter\s+\d+/i.test(line) || /^#{1,3}\s+chapter\s+\d+/i.test(line)) {
      if (i > startLine) {
        chapters.push({
          chapterNumber: chapterNum++,
          title: line.replace(/^#{1,3}\s*/i, '').replace(/^chapter\s+\d+[:.]?\s*/i, '') || `Chapter ${chapterNum - 1}`,
          startLine,
          endLine: i - 1,
          confidence: 0.7,
        });
      }
      startLine = i;
    }
  }
  
  // Add final chapter
  if (startLine < lines.length) {
    chapters.push({
      chapterNumber: chapterNum,
      title: `Chapter ${chapterNum}`,
      startLine,
      endLine: lines.length - 1,
      confidence: 0.7,
    });
  }
  
  return chapters;
}

/**
 * Call GPT-4 API for character relationships
 */
async function callGPT4ForRelationships(
  text: string,
  characters: string[]
): Promise<CharacterRelationship[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey || characters.length < 2) {
    return [];
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing character relationships in stories. Analyze dialogue and interactions to infer relationships. Return a JSON array with: character1, character2, relationship (e.g., "friends", "enemies", "romantic partners"), intensity (1-10), and evidence (array of quotes/examples).',
          },
          {
            role: 'user',
            content: `Analyze character relationships in this story. Characters: ${characters.join(', ')}\n\nStory text:\n${text.substring(0, 30000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return [];
    }
    
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    const relationships = JSON.parse(jsonStr) as CharacterRelationship[];
    return relationships;
  } catch (error) {
    console.error('Error calling GPT-4 for relationships:', error);
    return [];
  }
}

/**
 * Call GPT-4 API for theme/genre tagging
 */
async function callGPT4ForThemes(text: string): Promise<ThemeTag[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    return [];
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing literary themes and genres. Identify themes, genres, and narrative elements. Return a JSON array with: theme (string), confidence (0-1), and evidence (array of text examples).',
          },
          {
            role: 'user',
            content: `Analyze themes and genre elements in this story:\n\n${text.substring(0, 30000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return [];
    }
    
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    const themes = JSON.parse(jsonStr) as ThemeTag[];
    return themes;
  } catch (error) {
    console.error('Error calling GPT-4 for themes:', error);
    return [];
  }
}

/**
 * Call GPT-4 API for story summary
 */
async function callGPT4ForSummary(text: string): Promise<StorySummary> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      summary: text.substring(0, 500) + '...',
      genre: 'Unknown',
      themes: [],
      tone: 'Neutral',
      wordCount: text.split(/\s+/).length,
    };
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing stories. Generate a concise summary, identify genre, themes, and tone. Return JSON with: summary (string), genre (string), themes (array of strings), tone (string), wordCount (number).',
          },
          {
            role: 'user',
            content: `Summarize this story:\n\n${text.substring(0, 50000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in API response');
    }
    
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    const summary = JSON.parse(jsonStr) as StorySummary;
    return summary;
  } catch (error) {
    console.error('Error calling GPT-4 for summary:', error);
    return {
      summary: text.substring(0, 500) + '...',
      genre: 'Unknown',
      themes: [],
      tone: 'Neutral',
      wordCount: text.split(/\s+/).length,
    };
  }
}

/**
 * Enhance import with AI capabilities
 */
export async function enhanceImportWithAI(
  text: string,
  characters: string[],
  options: AIEnhancementOptions = {}
): Promise<AIEnhancementResult> {
  // Check cache first
  const cached = getCachedEnhancement(text, options);
  if (cached) {
    return cached;
  }
  
  // Check premium access
  if (!hasPremiumAccess()) {
    return {
      cached: false,
      timestamp: Date.now(),
    };
  }
  
  const result: AIEnhancementResult = {
    cached: false,
    timestamp: Date.now(),
  };
  
  // Run AI enhancements in parallel
  const promises: Promise<any>[] = [];
  
  if (options.enableChapterSplitting) {
    promises.push(
      callGPT4ForChapters(text).then((chapters) => {
        result.chapters = chapters;
      })
    );
  }
  
  if (options.enableRelationshipInference && characters.length >= 2) {
    promises.push(
      callGPT4ForRelationships(text, characters).then((relationships) => {
        result.relationships = relationships;
      })
    );
  }
  
  if (options.enableThemeTagging) {
    promises.push(
      callGPT4ForThemes(text).then((themes) => {
        result.themes = themes;
      })
    );
  }
  
  if (options.enableSummaryGeneration) {
    promises.push(
      callGPT4ForSummary(text).then((summary) => {
        result.summary = summary;
      })
    );
  }
  
  await Promise.all(promises);
  
  // Cache the result
  cacheEnhancement(text, options, result);
  
  return result;
}
