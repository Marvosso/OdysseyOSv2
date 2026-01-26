/**
 * Mock AI Service Implementation
 * 
 * Mock implementation for testing and development
 * No real API calls - returns simulated results
 */

import type {
  IAIService,
  AIServiceConfig,
  Scene,
  Character,
  Chapter,
  SceneAnalysisContext,
  SceneAnalysisResult,
  OutlineSuggestionContext,
  OutlineSuggestionResult,
  CharacterAnalysisContext,
  CharacterAnalysisResult,
  AIOperationResult,
  AIModel,
  RateLimitInfo,
  TokenUsage,
} from './types';
import { countTokens, estimateOutputTokens, createTokenUsage } from './tokenCounter';
import { calculateCost } from './costTracker';
import { globalCostTracker } from './costTracker';
import { checkAIRateLimit, recordAIUsage, DefaultRateLimits } from './rateLimit';

/**
 * Mock AI Service
 */
export class MockAIService implements IAIService {
  private config: AIServiceConfig;
  private defaultModel: AIModel;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.defaultModel = config.defaultModel || 'gpt-4';
  }

  /**
   * Simulate API delay
   */
  private async simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze a scene
   */
  async analyzeScene(
    scene: Scene,
    context?: SceneAnalysisContext
  ): Promise<AIOperationResult<SceneAnalysisResult>> {
    // Check rate limits
    const rateLimitConfig = this.config.rateLimitConfig || DefaultRateLimits.basic;
    const estimatedInputTokens = countTokens(scene.content.text, this.defaultModel);
    const estimatedOutputTokens = estimateOutputTokens(estimatedInputTokens, 'analysis');
    const estimatedCost = calculateCost({
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
      model: this.defaultModel,
    }).cost;

    const rateLimit = await checkAIRateLimit(
      this.config.userId,
      rateLimitConfig,
      estimatedInputTokens + estimatedOutputTokens,
      estimatedCost
    );

    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`);
    }

    // Check cost limit
    const currentCost = globalCostTracker.getTotalCost(this.config.userId);
    if (this.config.costLimit && currentCost + estimatedCost > this.config.costLimit) {
      throw new Error(`Cost limit exceeded. Current: $${currentCost.toFixed(2)}, Limit: $${this.config.costLimit.toFixed(2)}`);
    }

    // Simulate API call delay
    await this.simulateDelay(300);

    // Generate mock analysis
    const analysis: SceneAnalysisResult = {
      emotion: {
        detected: scene.emotion || 'neutral',
        confidence: 0.85,
        intensity: scene.emotionalIntensity || 5,
      },
      pacing: {
        score: 0.75,
        assessment: 'The scene maintains good pacing with a balance of action and reflection.',
        suggestions: [
          'Consider adding more tension in the middle section',
          'The transition could be smoother',
        ],
      },
      characterDevelopment: {
        insights: [
          'Character shows growth in this scene',
          'Motivation is clear and consistent',
        ],
        arcs: [
          'Character arc progressing well',
          'Relationship dynamics are developing',
        ],
      },
      writingQuality: {
        score: 0.82,
        strengths: [
          'Strong dialogue',
          'Vivid descriptions',
          'Good pacing',
        ],
        improvements: [
          'Some sentences could be more concise',
          'Consider varying sentence structure',
        ],
      },
      feedback: `This scene effectively advances the plot while developing character relationships. The emotional tone is consistent, and the pacing keeps readers engaged. Consider adding more sensory details to enhance immersion.`,
    };

    // Calculate actual token usage
    const inputText = JSON.stringify({ scene, context });
    const outputText = JSON.stringify(analysis);
    const inputTokens = countTokens(inputText, this.defaultModel);
    const outputTokens = countTokens(outputText, this.defaultModel);
    const tokenUsage = createTokenUsage(inputTokens, outputTokens, this.defaultModel);
    const cost = calculateCost(tokenUsage);

    // Track cost
    globalCostTracker.trackCost(this.config.userId, cost.cost);
    recordAIUsage(this.config.userId, tokenUsage.totalTokens, cost.cost);

    return {
      data: analysis,
      tokenUsage,
      cost,
      rateLimit,
    };
  }

  /**
   * Suggest outline improvements
   */
  async suggestOutline(
    outline: OutlineSuggestionContext,
    context?: { storyId?: string; currentChapters?: readonly Chapter[] }
  ): Promise<AIOperationResult<OutlineSuggestionResult>> {
    // Check rate limits
    const rateLimitConfig = this.config.rateLimitConfig || DefaultRateLimits.basic;
    const outlineText = JSON.stringify(outline);
    const estimatedInputTokens = countTokens(outlineText, this.defaultModel);
    const estimatedOutputTokens = estimateOutputTokens(estimatedInputTokens, 'suggestion');
    const estimatedCost = calculateCost({
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
      model: this.defaultModel,
    }).cost;

    const rateLimit = await checkAIRateLimit(
      this.config.userId,
      rateLimitConfig,
      estimatedInputTokens + estimatedOutputTokens,
      estimatedCost
    );

    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`);
    }

    // Check cost limit
    const currentCost = globalCostTracker.getTotalCost(this.config.userId);
    if (this.config.costLimit && currentCost + estimatedCost > this.config.costLimit) {
      throw new Error(`Cost limit exceeded`);
    }

    // Simulate API call delay
    await this.simulateDelay(400);

    // Generate mock suggestions
    const currentChapters = outline.currentOutline?.chapters || context?.currentChapters || [];
    const suggestions: OutlineSuggestionResult = {
      suggestedChapters: [
        {
          title: 'Chapter 1: The Beginning',
          summary: 'Introduce main characters and setting',
          order: 1,
          estimatedWordCount: 3000,
        },
        {
          title: 'Chapter 2: Rising Action',
          summary: 'Develop conflict and character relationships',
          order: 2,
          estimatedWordCount: 4000,
        },
      ],
      structuralImprovements: [
        'Consider adding a midpoint twist',
        'The three-act structure could be more balanced',
      ],
      pacingSuggestions: [
        'Chapter 3 feels rushed - consider expanding',
        'Add more breathing room between action scenes',
      ],
      characterArcSuggestions: [
        'Character A needs more development in Act 2',
        'Consider adding a character moment in Chapter 4',
      ],
      recommendations: `Your outline shows a strong foundation. The suggested chapters will help balance the narrative structure and provide better pacing. Consider incorporating the character arc suggestions to deepen character development.`,
    };

    // Calculate actual token usage
    const inputText = JSON.stringify({ outline, context });
    const outputText = JSON.stringify(suggestions);
    const inputTokens = countTokens(inputText, this.defaultModel);
    const outputTokens = countTokens(outputText, this.defaultModel);
    const tokenUsage = createTokenUsage(inputTokens, outputTokens, this.defaultModel);
    const cost = calculateCost(tokenUsage);

    // Track cost
    globalCostTracker.trackCost(this.config.userId, cost.cost);
    recordAIUsage(this.config.userId, tokenUsage.totalTokens, cost.cost);

    return {
      data: suggestions,
      tokenUsage,
      cost,
      rateLimit,
    };
  }

  /**
   * Analyze a character
   */
  async analyzeCharacter(
    character: Character,
    scenes: readonly Scene[],
    context?: CharacterAnalysisContext
  ): Promise<AIOperationResult<CharacterAnalysisResult>> {
    // Check rate limits
    const rateLimitConfig = this.config.rateLimitConfig || DefaultRateLimits.basic;
    const characterText = JSON.stringify({ character, scenes: scenes.length });
    const estimatedInputTokens = countTokens(characterText, this.defaultModel);
    const estimatedOutputTokens = estimateOutputTokens(estimatedInputTokens, 'analysis');
    const estimatedCost = calculateCost({
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
      model: this.defaultModel,
    }).cost;

    const rateLimit = await checkAIRateLimit(
      this.config.userId,
      rateLimitConfig,
      estimatedInputTokens + estimatedOutputTokens,
      estimatedCost
    );

    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`);
    }

    // Check cost limit
    const currentCost = globalCostTracker.getTotalCost(this.config.userId);
    if (this.config.costLimit && currentCost + estimatedCost > this.config.costLimit) {
      throw new Error(`Cost limit exceeded`);
    }

    // Simulate API call delay
    await this.simulateDelay(500);

    // Generate mock analysis
    const analysis: CharacterAnalysisResult = {
      consistency: {
        score: 0.88,
        issues: [
          'Character voice varies slightly in dialogue',
        ],
        strengths: [
          'Character motivation is consistent',
          'Backstory is well-integrated',
        ],
      },
      developmentArc: {
        currentStage: 'development',
        progression: [
          'Character introduced effectively',
          'Growth shown through actions',
          'Arc progressing toward resolution',
        ],
        suggestions: [
          'Add a moment of vulnerability in next scene',
          'Consider showing character growth through dialogue',
        ],
      },
      dialogue: {
        authenticity: 0.85,
        voice: 'Character has a distinct voice that matches their background',
        improvements: [
          'Some dialogue could be more natural',
          'Consider varying sentence length',
        ],
      },
      relationships: [
        {
          characterId: 'character-2',
          relationshipType: 'friend',
          dynamics: 'Strong friendship with underlying tension',
          suggestions: [
            'Explore the tension more explicitly',
            'Add a scene showing their shared history',
          ],
        },
      ],
      assessment: `${character.name} is a well-developed character with consistent motivation and clear growth arc. The character's voice is distinct, though some dialogue could be more natural. Relationships are well-established and provide good opportunities for further development.`,
    };

    // Calculate actual token usage
    const inputText = JSON.stringify({ character, scenes: scenes.length, context });
    const outputText = JSON.stringify(analysis);
    const inputTokens = countTokens(inputText, this.defaultModel);
    const outputTokens = countTokens(outputText, this.defaultModel);
    const tokenUsage = createTokenUsage(inputTokens, outputTokens, this.defaultModel);
    const cost = calculateCost(tokenUsage);

    // Track cost
    globalCostTracker.trackCost(this.config.userId, cost.cost);
    recordAIUsage(this.config.userId, tokenUsage.totalTokens, cost.cost);

    return {
      data: analysis,
      tokenUsage,
      cost,
      rateLimit,
    };
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<RateLimitInfo> {
    const rateLimitConfig = this.config.rateLimitConfig || DefaultRateLimits.basic;
    return checkAIRateLimit(this.config.userId, rateLimitConfig);
  }

  /**
   * Get total cost for current user
   */
  async getTotalCost(): Promise<number> {
    return globalCostTracker.getTotalCost(this.config.userId);
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    return true; // Mock service is always available
  }
}
