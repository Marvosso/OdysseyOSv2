/**
 * Scene Analyzer
 * 
 * AI-powered analysis of story scenes including emotion, pacing, and writing quality
 */

import type { Scene } from '@/types/story';

export interface EmotionAnalysis {
  primary: string;
  distribution: Record<string, number>; // emotion -> score (0-1)
  intensity: number; // 0-1
  transitions: Array<{ from: string; to: string; position: number }>;
}

export interface PacingAnalysis {
  actionRatio: number; // 0-1
  dialogueRatio: number; // 0-1
  descriptionRatio: number; // 0-1
  pacingScore: number; // 0-1 (higher = better pacing)
  peaks: Array<{ position: number; type: 'action' | 'dialogue' | 'description'; intensity: number }>;
  quietMoments: Array<{ start: number; end: number; type: 'description' | 'reflection' }>;
}

export interface ShowVsTellAnalysis {
  overallScore: number; // 0-1 (higher = more showing)
  paragraphs: Array<{
    text: string;
    score: number;
    issues: string[];
    suggestions: string[];
  }>;
  tellingPhrases: Array<{ phrase: string; position: number; suggestion: string }>;
}

export interface ImprovementSuggestion {
  type: 'emotion' | 'pacing' | 'show-tell' | 'dialogue' | 'description' | 'action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  example?: string;
  position?: number;
}

/**
 * Analyze emotion distribution in scene text
 */
export function analyzeEmotion(sceneText: string): EmotionAnalysis {
  const emotions: Record<string, number> = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    neutral: 0,
  };

  const text = sceneText.toLowerCase();
  const words = text.split(/\s+/);
  const totalWords = words.length;

  // Emotion keywords (simplified - in production, use NLP)
  const emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'joy', 'excited', 'smile', 'laugh', 'delighted', 'cheerful', 'ecstatic', 'elated', 'pleased'],
    sadness: ['sad', 'depressed', 'cry', 'tears', 'mourn', 'grief', 'sorrow', 'melancholy', 'despair', 'lonely'],
    anger: ['angry', 'rage', 'furious', 'mad', 'enraged', 'irritated', 'annoyed', 'frustrated', 'hostile', 'bitter'],
    fear: ['afraid', 'scared', 'fear', 'terrified', 'anxious', 'worried', 'nervous', 'dread', 'panic', 'horror'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered', 'startled', 'wonder'],
    neutral: [],
  };

  // Count emotion words
  words.forEach((word) => {
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some((keyword) => word.includes(keyword))) {
        emotions[emotion] += 1;
      }
    });
  });

  // Normalize scores
  const distribution: Record<string, number> = {};
  let totalEmotionWords = 0;
  Object.values(emotions).forEach((count) => {
    totalEmotionWords += count;
  });

  Object.entries(emotions).forEach(([emotion, count]) => {
    distribution[emotion] = totalEmotionWords > 0 ? count / totalEmotionWords : 0;
  });

  // Find primary emotion
  const primary = Object.entries(distribution).reduce((a, b) =>
    distribution[a[0]] > distribution[b[0]] ? a : b
  )[0];

  // Calculate intensity (how strong the emotions are)
  const intensity = Math.min(1, totalEmotionWords / Math.max(1, totalWords / 10));

  // Detect emotion transitions (simplified)
  const transitions: Array<{ from: string; to: string; position: number }> = [];
  const sentences = sceneText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  
  let prevEmotion = 'neutral';
  sentences.forEach((sentence, index) => {
    const sentenceLower = sentence.toLowerCase();
    let currentEmotion = 'neutral';
    let maxScore = 0;

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const score = keywords.filter((keyword) => sentenceLower.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        currentEmotion = emotion;
      }
    });

    if (currentEmotion !== prevEmotion && prevEmotion !== 'neutral') {
      transitions.push({
        from: prevEmotion,
        to: currentEmotion,
        position: index / sentences.length,
      });
    }
    prevEmotion = currentEmotion;
  });

  return {
    primary,
    distribution,
    intensity,
    transitions,
  };
}

/**
 * Calculate pacing (action vs dialogue vs description ratio)
 */
export function calculatePacing(scene: Scene): PacingAnalysis {
  const text = scene.content;
  const words = text.split(/\s+/);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      actionRatio: 0,
      dialogueRatio: 0,
      descriptionRatio: 0,
      pacingScore: 0.5,
      peaks: [],
      quietMoments: [],
    };
  }

  // Detect dialogue (quoted text)
  const dialoguePattern = /"[^"]*"/g;
  const dialogueMatches = text.match(dialoguePattern) || [];
  const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length;

  // Detect action (verbs, action words)
  const actionWords = [
    'ran', 'jumped', 'fought', 'attacked', 'moved', 'grabbed', 'threw', 'pushed', 'pulled',
    'sprinted', 'dashed', 'charged', 'struck', 'hit', 'kicked', 'punched', 'dodged', 'blocked',
    'fled', 'escaped', 'chased', 'followed', 'pursued', 'caught', 'released', 'opened', 'closed',
  ];
  let actionWordCount = 0;
  words.forEach((word) => {
    if (actionWords.some((action) => word.toLowerCase().includes(action))) {
      actionWordCount++;
    }
  });

  // Description is everything else
  const descriptionWords = totalWords - dialogueWords - actionWordCount;

  const actionRatio = actionWordCount / totalWords;
  const dialogueRatio = dialogueWords / totalWords;
  const descriptionRatio = descriptionWords / totalWords;

  // Calculate pacing score (balanced is better)
  // Ideal: 30% action, 30% dialogue, 40% description
  const idealAction = 0.3;
  const idealDialogue = 0.3;
  const idealDescription = 0.4;

  const actionDiff = Math.abs(actionRatio - idealAction);
  const dialogueDiff = Math.abs(dialogueRatio - idealDialogue);
  const descriptionDiff = Math.abs(descriptionRatio - idealDescription);

  const pacingScore = 1 - (actionDiff + dialogueDiff + descriptionDiff) / 3;

  // Detect peaks (sections with high action or dialogue)
  const peaks: Array<{ position: number; type: 'action' | 'dialogue' | 'description'; intensity: number }> = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const chunkSize = Math.max(1, Math.floor(sentences.length / 10));

  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(' ');
    const chunkWords = chunk.split(/\s+/).length;
    
    const chunkDialogue = (chunk.match(dialoguePattern) || []).join(' ').split(/\s+/).length;
    const chunkAction = actionWords.filter((action) => chunk.toLowerCase().includes(action)).length;

    if (chunkDialogue / chunkWords > 0.4) {
      peaks.push({
        position: i / sentences.length,
        type: 'dialogue',
        intensity: chunkDialogue / chunkWords,
      });
    } else if (chunkAction / chunkWords > 0.2) {
      peaks.push({
        position: i / sentences.length,
        type: 'action',
        intensity: chunkAction / chunkWords,
      });
    } else if (chunkDialogue / chunkWords < 0.1 && chunkAction / chunkWords < 0.1) {
      peaks.push({
        position: i / sentences.length,
        type: 'description',
        intensity: 1 - (chunkDialogue + chunkAction) / chunkWords,
      });
    }
  }

  // Detect quiet moments (long description/reflection sections)
  const quietMoments: Array<{ start: number; end: number; type: 'description' | 'reflection' }> = [];
  let quietStart = -1;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const hasDialogue = dialoguePattern.test(sentence);
    const hasAction = actionWords.some((action) => sentence.toLowerCase().includes(action));
    const isReflection = /(thought|wondered|realized|remembered|felt|knew)/i.test(sentence);

    if (!hasDialogue && !hasAction) {
      if (quietStart === -1) {
        quietStart = i;
      }
    } else {
      if (quietStart !== -1 && i - quietStart >= 3) {
        quietMoments.push({
          start: quietStart / sentences.length,
          end: i / sentences.length,
          type: isReflection ? 'reflection' : 'description',
        });
      }
      quietStart = -1;
    }
  }

  return {
    actionRatio,
    dialogueRatio,
    descriptionRatio,
    pacingScore,
    peaks,
    quietMoments,
  };
}

/**
 * Detect "show vs tell" issues
 */
export function detectShowVsTell(sceneText: string): ShowVsTellAnalysis {
  const paragraphs = sceneText.split(/\n\n+/).filter((p) => p.trim().length > 0);
  
  // Telling phrases (passive, abstract)
  const tellingPhrases = [
    { pattern: /\b(felt|feels|feeling)\s+(sad|happy|angry|afraid|excited|nervous|worried|anxious|confused|frustrated|disappointed|ashamed|guilty|proud|jealous|envious|lonely|empty|numb|tired|exhausted|energetic|alive|dead|alive|dead)\b/gi, suggestion: 'Show the emotion through actions, dialogue, or body language instead' },
    { pattern: /\b(was|were|is|are)\s+(sad|happy|angry|afraid|excited|nervous|worried|anxious|confused|frustrated|disappointed|ashamed|guilty|proud|jealous|envious|lonely|empty|numb|tired|exhausted|energetic|alive|dead)\b/gi, suggestion: 'Show the state through concrete details and actions' },
    { pattern: /\b(knew|knows|knowing|realized|realizes|realizing|understood|understands|understanding|thought|thinks|thinking|believed|believes|believing|decided|decides|deciding)\b/gi, suggestion: 'Show the thought process through actions or internal monologue' },
    { pattern: /\b(seemed|seems|seeming|appeared|appears|appearing|looked|looks|looking)\s+(like|as if|as though)\b/gi, suggestion: 'Describe what you see directly instead of using "seemed"' },
    { pattern: /\b(began|begins|beginning|started|starts|starting)\s+to\b/gi, suggestion: 'Use the action verb directly (e.g., "ran" instead of "began to run")' },
  ];

  const paragraphAnalyses = paragraphs.map((paragraph) => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let tellingCount = 0;

    tellingPhrases.forEach(({ pattern, suggestion }) => {
      const matches = paragraph.match(pattern);
      if (matches) {
        tellingCount += matches.length;
        issues.push(`Found ${matches.length} telling phrase(s)`);
        if (!suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      }
    });

    // Calculate score (0 = all telling, 1 = all showing)
    // More telling phrases = lower score
    const wordCount = paragraph.split(/\s+/).length;
    const score = Math.max(0, 1 - (tellingCount / Math.max(1, wordCount / 10)));

    return {
      text: paragraph,
      score,
      issues,
      suggestions,
    };
  });

  // Overall score
  const overallScore = paragraphAnalyses.reduce((sum, p) => sum + p.score, 0) / paragraphAnalyses.length;

  // Find telling phrases with positions
  const allTellingPhrases: Array<{ phrase: string; position: number; suggestion: string }> = [];
  let currentPosition = 0;

  paragraphs.forEach((paragraph) => {
    tellingPhrases.forEach(({ pattern, suggestion }) => {
      const matches = paragraph.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          allTellingPhrases.push({
            phrase: match[0],
            position: currentPosition + match.index,
            suggestion,
          });
        }
      }
    });
    currentPosition += paragraph.length + 2; // +2 for paragraph break
  });

  return {
    overallScore,
    paragraphs: paragraphAnalyses,
    tellingPhrases: allTellingPhrases,
  };
}

/**
 * Generate AI-powered improvement suggestions
 */
export function suggestImprovements(scene: Scene): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  const emotionAnalysis = analyzeEmotion(scene.content);
  const pacingAnalysis = calculatePacing(scene);
  const showTellAnalysis = detectShowVsTell(scene.content);

  // Emotion suggestions
  if (emotionAnalysis.intensity < 0.3) {
    suggestions.push({
      type: 'emotion',
      priority: 'high',
      title: 'Low Emotional Intensity',
      description: 'The scene lacks strong emotional content. Consider adding more emotional language or character reactions.',
      example: 'Instead of "He walked away," try "He stormed off, fists clenched."',
    });
  }

  if (emotionAnalysis.transitions.length === 0 && emotionAnalysis.primary !== 'neutral') {
    suggestions.push({
      type: 'emotion',
      priority: 'medium',
      title: 'Static Emotion',
      description: 'The emotional tone remains constant throughout. Consider adding emotional transitions to create depth.',
    });
  }

  // Pacing suggestions
  if (pacingAnalysis.pacingScore < 0.5) {
    suggestions.push({
      type: 'pacing',
      priority: 'high',
      title: 'Unbalanced Pacing',
      description: `The scene is ${pacingAnalysis.actionRatio > 0.5 ? 'too action-heavy' : pacingAnalysis.dialogueRatio > 0.5 ? 'too dialogue-heavy' : 'too description-heavy'}. Aim for a balance: ~30% action, ~30% dialogue, ~40% description.`,
    });
  }

  if (pacingAnalysis.peaks.length === 0) {
    suggestions.push({
      type: 'pacing',
      priority: 'medium',
      title: 'Flat Pacing',
      description: 'The scene lacks pacing variation. Add moments of high intensity (action/dialogue) and quiet moments (description/reflection).',
    });
  }

  // Show vs Tell suggestions
  if (showTellAnalysis.overallScore < 0.6) {
    suggestions.push({
      type: 'show-tell',
      priority: 'high',
      title: 'Too Much Telling',
      description: `Found ${showTellAnalysis.tellingPhrases.length} telling phrase(s). Show actions and emotions through concrete details instead.`,
      example: showTellAnalysis.tellingPhrases[0]?.suggestion,
    });
  }

  // Dialogue suggestions
  if (pacingAnalysis.dialogueRatio < 0.2 && scene.content.length > 500) {
    suggestions.push({
      type: 'dialogue',
      priority: 'medium',
      title: 'Limited Dialogue',
      description: 'The scene has little dialogue. Consider adding character conversations to reveal personality and advance the plot.',
    });
  }

  // Action suggestions
  if (pacingAnalysis.actionRatio < 0.1 && pacingAnalysis.peaks.filter((p) => p.type === 'action').length === 0) {
    suggestions.push({
      type: 'action',
      priority: 'low',
      title: 'Lack of Action',
      description: 'The scene is mostly static. Consider adding physical movement or action to create visual interest.',
    });
  }

  // Description suggestions
  if (pacingAnalysis.descriptionRatio < 0.2) {
    suggestions.push({
      type: 'description',
      priority: 'medium',
      title: 'Sparse Description',
      description: 'The scene lacks descriptive detail. Add sensory details (sight, sound, smell, touch) to immerse the reader.',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}

/**
 * Analyze a complete scene
 */
export function analyzeScene(scene: Scene): {
  emotion: EmotionAnalysis;
  pacing: PacingAnalysis;
  showVsTell: ShowVsTellAnalysis;
  suggestions: ImprovementSuggestion[];
} {
  return {
    emotion: analyzeEmotion(scene.content),
    pacing: calculatePacing(scene),
    showVsTell: detectShowVsTell(scene.content),
    suggestions: suggestImprovements(scene),
  };
}
