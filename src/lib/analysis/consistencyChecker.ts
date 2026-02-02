/**
 * Consistency Checker
 * 
 * Analyzes story content for consistency issues:
 * - Character physical attributes
 * - Timeline continuity
 * - Personality consistency
 * - Location descriptions
 */

import type { Story, Scene, Character } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';

export interface ConsistencyIssue {
  id: string;
  type: 'character' | 'location' | 'timeline' | 'personality';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  sceneId?: string;
  characterId?: string;
  location?: string;
  suggestions: string[];
  acknowledged: boolean;
  ignored: boolean;
}

export interface ConsistencyReport {
  issues: ConsistencyIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  generatedAt: Date;
}

/**
 * Extract character mentions from text
 */
function extractCharacterMentions(text: string, characters: Character[]): Array<{
  character: Character;
  context: string;
  sceneIndex: number;
}> {
  const mentions: Array<{ character: Character; context: string; sceneIndex: number }> = [];
  const lowerText = text.toLowerCase();

  characters.forEach((char) => {
    const name = char.name.toLowerCase();
    // Look for character name mentions
    const nameRegex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.matchAll(nameRegex);

    for (const match of matches) {
      const start = Math.max(0, match.index! - 50);
      const end = Math.min(text.length, match.index! + match[0].length + 50);
      const context = text.substring(start, end);
      mentions.push({
        character: char,
        context,
        sceneIndex: 0, // Will be set by caller
      });
    }
  });

  return mentions;
}

/**
 * Extract physical attributes from text
 */
function extractPhysicalAttributes(text: string): Map<string, string[]> {
  const attributes = new Map<string, string[]>();

  // Eye color patterns
  const eyeColorPattern = /(?:eyes?|gaze|stare).*?(?:were|was|is|are|had|has)\s+(\w+\s+)?(blue|green|brown|hazel|gray|grey|black|amber|violet|red|golden|silver)\b/gi;
  const eyeMatches = text.matchAll(eyeColorPattern);
  for (const match of eyeMatches) {
    const color = match[2]?.toLowerCase();
    if (color) {
      if (!attributes.has('eyeColor')) {
        attributes.set('eyeColor', []);
      }
      attributes.get('eyeColor')!.push(color);
    }
  }

  // Height patterns
  const heightPattern = /(?:height|tall|short|inches?|feet|cm|meters?|stood|was|is)\s+(\d+['"]?\s*(?:feet|ft|inches?|in|cm|meters?|m|tall|short))/gi;
  const heightMatches = text.matchAll(heightPattern);
  for (const match of heightMatches) {
    const height = match[0];
    if (!attributes.has('height')) {
      attributes.set('height', []);
    }
    attributes.get('height')!.push(height);
  }

  // Hair color patterns
  const hairColorPattern = /(?:hair|locks|tresses).*?(?:were|was|is|are|had|has)\s+(\w+\s+)?(blonde|blond|brown|black|red|auburn|gray|grey|white|silver|golden|brunette|raven)\b/gi;
  const hairMatches = text.matchAll(hairColorPattern);
  for (const match of hairMatches) {
    const color = match[2]?.toLowerCase();
    if (color) {
      if (!attributes.has('hairColor')) {
        attributes.set('hairColor', []);
      }
      attributes.get('hairColor')!.push(color);
    }
  }

  return attributes;
}

/**
 * Check character consistency across scenes
 */
export function checkCharacterConsistency(storyId?: string): ConsistencyIssue[] {
  const story = StoryStorage.loadStory();
  const scenes = StoryStorage.loadScenes();
  const characters = StoryStorage.loadCharacters();

  if (!story || scenes.length === 0 || characters.length === 0) {
    return [];
  }

  const issues: ConsistencyIssue[] = [];
  const characterAttributes = new Map<string, Map<string, string[]>>(); // characterId -> attribute -> values
  const characterMentions = new Map<string, Array<{ sceneId: string; sceneIndex: number; context: string }>>();

  // Scan all scenes for character mentions and attributes
  scenes.forEach((scene, sceneIndex) => {
    const sceneText = `${scene.title} ${scene.content}`.toLowerCase();
    const physicalAttrs = extractPhysicalAttributes(scene.content);

    characters.forEach((char) => {
      const charName = char.name.toLowerCase();
      if (sceneText.includes(charName)) {
        // Track character mentions
        if (!characterMentions.has(char.id)) {
          characterMentions.set(char.id, []);
        }
        characterMentions.get(char.id)!.push({
          sceneId: scene.id,
          sceneIndex,
          context: scene.content.substring(0, 200),
        });

        // Track physical attributes
        if (physicalAttrs.size > 0) {
          if (!characterAttributes.has(char.id)) {
            characterAttributes.set(char.id, new Map());
          }
          const charAttrs = characterAttributes.get(char.id)!;

          physicalAttrs.forEach((values, attr) => {
            if (!charAttrs.has(attr)) {
              charAttrs.set(attr, []);
            }
            charAttrs.get(attr)!.push(...values);
          });
        }
      }
    });
  });

  // Check for attribute inconsistencies
  characterAttributes.forEach((attrs, charId) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;

    attrs.forEach((values, attr) => {
      // Remove duplicates and normalize
      const uniqueValues = Array.from(new Set(values.map((v) => v.toLowerCase().trim())));
      if (uniqueValues.length > 1) {
        // Multiple different values found
        issues.push({
          id: `attr-${charId}-${attr}-${Date.now()}`,
          type: 'character',
          severity: 'warning',
          title: `Inconsistent ${attr} for ${char.name}`,
          description: `${char.name}'s ${attr} is described differently across scenes: ${uniqueValues.join(', ')}`,
          characterId: char.id,
          suggestions: [
            `Standardize ${char.name}'s ${attr} description to one consistent value`,
            `Add a note explaining the change if intentional`,
            `Review scenes mentioning ${char.name}'s ${attr}`,
          ],
          acknowledged: false,
          ignored: false,
        });
      }
    });
  });

  // Check for timeline issues (character in multiple places)
  const sceneLocations = new Map<string, string>(); // sceneId -> location
  scenes.forEach((scene) => {
    if (scene.location) {
      sceneLocations.set(scene.id, scene.location);
    }
  });

  characterMentions.forEach((mentions, charId) => {
    if (mentions.length < 2) return;

    // Check if character appears in scenes with different locations that are close together
    for (let i = 0; i < mentions.length - 1; i++) {
      const current = mentions[i];
      const next = mentions[i + 1];

      // If scenes are adjacent and have different locations, might be an issue
      if (next.sceneIndex - current.sceneIndex <= 2) {
        const currentLoc = sceneLocations.get(current.sceneId);
        const nextLoc = sceneLocations.get(next.sceneId);

        if (currentLoc && nextLoc && currentLoc !== nextLoc) {
          const char = characters.find((c) => c.id === charId);
          if (char) {
            issues.push({
              id: `timeline-${charId}-${current.sceneId}-${next.sceneId}`,
              type: 'timeline',
              severity: 'warning',
              title: `Possible timeline issue: ${char.name} in multiple locations`,
              description: `${char.name} appears in "${currentLoc}" and then "${nextLoc}" in quick succession. Verify travel time is realistic.`,
              characterId: char.id,
              sceneId: next.sceneId,
              location: nextLoc,
              suggestions: [
                `Add transition explaining ${char.name}'s movement between locations`,
                `Verify the timeline allows for travel between "${currentLoc}" and "${nextLoc}"`,
                `Consider adding a scene break or time passage indicator`,
              ],
              acknowledged: false,
              ignored: false,
            });
          }
        }
      }
    }
  });

  // Check for personality shifts (basic heuristic: sudden behavior changes)
  characterMentions.forEach((mentions, charId) => {
    if (mentions.length < 3) return;

    const char = characters.find((c) => c.id === charId);
    if (!char || !char.description) return;

    // Extract personality keywords from character description
    const personalityKeywords = char.description.toLowerCase().match(/\b(confident|shy|brave|cowardly|kind|cruel|gentle|aggressive|calm|anxious|optimistic|pessimistic|extroverted|introverted)\b/g) || [];

    // This is a simplified check - in a real implementation, you'd use NLP
    // For now, we'll flag if character description mentions traits but scenes show opposite
    mentions.forEach((mention) => {
      const scene = scenes.find((s) => s.id === mention.sceneId);
      if (!scene) return;

      const sceneText = scene.content.toLowerCase();
      // Check for potential contradictions (simplified)
      personalityKeywords.forEach((trait) => {
        const opposites: Record<string, string[]> = {
          confident: ['hesitated', 'uncertain', 'doubted'],
          shy: ['boldly', 'confidently', 'asserted'],
          brave: ['fled', 'retreated', 'feared'],
          kind: ['cruel', 'harsh', 'mean'],
        };

        const oppositesList = opposites[trait] || [];
        const hasOpposite = oppositesList.some((opp) => sceneText.includes(opp));

        if (hasOpposite) {
          issues.push({
            id: `personality-${charId}-${mention.sceneId}-${trait}`,
            type: 'personality',
            severity: 'info',
            title: `Potential personality shift: ${char.name}`,
            description: `${char.name} is described as ${trait} but shows opposite behavior in this scene. Verify if this is intentional character development.`,
            characterId: char.id,
            sceneId: mention.sceneId,
            suggestions: [
              `Review if this behavior change is part of ${char.name}'s character arc`,
              `Add internal monologue or context explaining the behavior`,
              `Update character description if this is a permanent change`,
            ],
            acknowledged: false,
            ignored: false,
          });
        }
      });
    });
  });

  return issues;
}

/**
 * Check location continuity
 */
export function checkLocationContinuity(): ConsistencyIssue[] {
  const scenes = StoryStorage.loadScenes();
  const issues: ConsistencyIssue[] = [];

  if (scenes.length === 0) return [];

  const locationDescriptions = new Map<string, Map<string, string>>(); // location -> sceneId -> description

  // Extract location mentions and descriptions
  scenes.forEach((scene) => {
    if (scene.location) {
      if (!locationDescriptions.has(scene.location)) {
        locationDescriptions.set(scene.location, new Map());
      }
      locationDescriptions.get(scene.location)!.set(scene.id, scene.content);
    }
  });

  // Check for inconsistent descriptions of the same location
  locationDescriptions.forEach((descriptions, location) => {
    if (descriptions.size < 2) return;

    // Extract key descriptive words from each scene's content
    const locationKeywords = new Map<string, Set<string>>(); // sceneId -> keywords

    descriptions.forEach((content, sceneId) => {
      // Extract location-related descriptive words
      const keywords = new Set<string>();
      const words = content.toLowerCase().match(/\b(large|small|bright|dark|warm|cold|old|new|wooden|stone|metal|empty|crowded|quiet|noisy|spacious|tight|modern|ancient)\b/g);
      if (words) {
        words.forEach((w) => keywords.add(w));
      }
      locationKeywords.set(sceneId, keywords);
    });

    // Check for contradictions
    const allKeywords = new Set<string>();
    locationKeywords.forEach((keywords) => {
      keywords.forEach((k) => allKeywords.add(k));
    });

    // Find contradictory pairs
    const contradictions: [string, string][] = [
      ['large', 'small'],
      ['bright', 'dark'],
      ['warm', 'cold'],
      ['old', 'new'],
      ['empty', 'crowded'],
      ['quiet', 'noisy'],
      ['spacious', 'tight'],
    ];

    contradictions.forEach(([word1, word2]) => {
      const hasWord1 = Array.from(locationKeywords.values()).some((keywords) => keywords.has(word1));
      const hasWord2 = Array.from(locationKeywords.values()).some((keywords) => keywords.has(word2));

      if (hasWord1 && hasWord2) {
        issues.push({
          id: `location-${location}-${word1}-${word2}-${Date.now()}`,
          type: 'location',
          severity: 'warning',
          title: `Inconsistent description of ${location}`,
          description: `"${location}" is described as both ${word1} and ${word2} in different scenes.`,
          location,
          suggestions: [
            `Standardize the description of ${location}`,
            `Add context explaining why the location appears different`,
            `Review all scenes set in ${location}`,
          ],
          acknowledged: false,
          ignored: false,
        });
      }
    });
  });

  return issues;
}

/**
 * Check for timeline gaps
 */
export function checkTimelineGaps(): ConsistencyIssue[] {
  const scenes = StoryStorage.loadScenes();
  const issues: ConsistencyIssue[] = [];

  if (scenes.length < 2) return [];

  // Look for time indicators in scenes
  const timeIndicators = [
    /(?:hours?|days?|weeks?|months?|years?)\s+(?:later|earlier|ago|before|after)/gi,
    /(?:the\s+)?(?:next|previous|following)\s+(?:day|morning|evening|night|week|month)/gi,
    /(?:suddenly|immediately|then|meanwhile|later)/gi,
  ];

  scenes.forEach((scene, index) => {
    if (index === 0) return;

    const prevScene = scenes[index - 1];
    const currentText = scene.content.toLowerCase();
    const prevText = prevScene.content.toLowerCase();

    // Check if there's a time jump without explanation
    let hasTimeIndicator = false;
    for (const pattern of timeIndicators) {
      if (pattern.test(currentText) || pattern.test(prevText)) {
        hasTimeIndicator = true;
        break;
      }
    }

    // Check for location changes without time/transition
    const prevLocation = prevScene.location;
    const currentLocation = scene.location;

    if (prevLocation && currentLocation && prevLocation !== currentLocation && !hasTimeIndicator) {
      // Potential gap: location changed but no time indicator
      issues.push({
        id: `timeline-gap-${prevScene.id}-${scene.id}`,
        type: 'timeline',
        severity: 'info',
        title: `Possible timeline gap between scenes`,
        description: `Scene transitions from "${prevLocation}" to "${currentLocation}" without clear time passage indication.`,
        sceneId: scene.id,
        location: currentLocation,
        suggestions: [
          `Add a transition sentence indicating time passage`,
          `Clarify how much time has passed between scenes`,
          `Add a scene break marker if time has passed`,
        ],
        acknowledged: false,
        ignored: false,
      });
    }

    // Check for very different content without transition
    const prevWords = prevText.split(/\s+/).length;
    const currentWords = currentText.split(/\s+/).length;
    const wordRatio = Math.max(prevWords, currentWords) / Math.min(prevWords, currentWords);

    // If one scene is much longer/shorter and no transition, might be a gap
    if (wordRatio > 3 && !hasTimeIndicator && !prevLocation && !currentLocation) {
      issues.push({
        id: `timeline-gap-content-${prevScene.id}-${scene.id}`,
        type: 'timeline',
        severity: 'info',
        title: `Potential scene transition issue`,
        description: `Significant change in scene length without clear transition. Consider adding a scene break or transition.`,
        sceneId: scene.id,
        suggestions: [
          `Add a scene break marker (***) if time/location has changed`,
          `Add transition text connecting the scenes`,
          `Review if these should be separate scenes`,
        ],
        acknowledged: false,
        ignored: false,
      });
    }
  });

  return issues;
}

/**
 * Generate full consistency report
 */
export function generateConsistencyReport(storyId?: string): ConsistencyReport {
  const characterIssues = checkCharacterConsistency(storyId);
  const locationIssues = checkLocationContinuity();
  const timelineIssues = checkTimelineGaps();

  const allIssues = [...characterIssues, ...locationIssues, ...timelineIssues];

  const summary = {
    total: allIssues.length,
    errors: allIssues.filter((i) => i.severity === 'error').length,
    warnings: allIssues.filter((i) => i.severity === 'warning').length,
    info: allIssues.filter((i) => i.severity === 'info').length,
  };

  return {
    issues: allIssues,
    summary,
    generatedAt: new Date(),
  };
}
