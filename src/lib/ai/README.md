# AI Service Interface

Model-agnostic AI service interface with token counting, cost tracking, and rate limiting.

## Features

✅ **Model-Agnostic Interface** - Works with any AI model  
✅ **Token Counting** - Accurate token estimation per model  
✅ **Cost Tracking** - Per-user cost tracking and limits  
✅ **Rate Limiting** - Configurable rate limits per user  
✅ **Mock Implementation** - No real API calls, perfect for testing  

## Structure

```
src/lib/ai/
├── types.ts                    # Type definitions
├── AIService.interface.ts      # Main interface
├── MockAIService.ts            # Mock implementation
├── tokenCounter.ts             # Token counting utilities
├── costTracker.ts              # Cost tracking
├── rateLimit.ts                # Rate limiting
└── index.ts                    # Public API
```

## Usage

### Basic Usage

```typescript
import { MockAIService } from '@/lib/ai';
import type { AIServiceConfig } from '@/lib/ai';

// Create service instance
const config: AIServiceConfig = {
  defaultModel: 'gpt-4',
  userId: 'user-123',
  rateLimitConfig: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxTokens: 100000,
    maxCost: 1.00,
  },
  costLimit: 10.00, // $10 monthly limit
};

const aiService = new MockAIService(config);

// Analyze a scene
const result = await aiService.analyzeScene(scene, {
  previousScenes: [prevScene],
  storyId: story.id,
});

console.log('Analysis:', result.data);
console.log('Tokens used:', result.tokenUsage.totalTokens);
console.log('Cost:', result.cost.cost);
```

### Analyze Scene

```typescript
const result = await aiService.analyzeScene(scene, {
  previousScenes: previousScenes,
  nextScenes: nextScenes,
  characters: sceneCharacters,
  focusAreas: ['pacing', 'character-development'],
});

// Result includes:
// - emotion analysis
// - pacing assessment
// - character development insights
// - writing quality feedback
```

### Suggest Outline

```typescript
const result = await aiService.suggestOutline({
  currentOutline: {
    chapters: currentChapters,
    summary: storySummary,
  },
  genre: 'fiction',
  themes: ['adventure', 'friendship'],
});

// Result includes:
// - suggested chapters
// - structural improvements
// - pacing suggestions
// - character arc suggestions
```

### Analyze Character

```typescript
const result = await aiService.analyzeCharacter(character, characterScenes, {
  otherCharacters: allCharacters,
  storyId: story.id,
});

// Result includes:
// - consistency analysis
// - development arc
// - dialogue analysis
// - relationship dynamics
```

## Token Counting

Token counting is model-aware:

```typescript
import { countTokens } from '@/lib/ai';

const tokens = countTokens(text, 'gpt-4');
const tokensClaude = countTokens(text, 'claude-3-opus');
```

Supported models:
- GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- Claude 3 Opus, Sonnet, Haiku
- Gemini Pro
- Custom models

## Cost Tracking

Cost tracking per user:

```typescript
import { globalCostTracker } from '@/lib/ai';

// Track cost automatically (done by service)
// Or manually:
globalCostTracker.trackCost(userId, 0.05);

// Get total cost
const totalCost = globalCostTracker.getTotalCost(userId);

// Check limit
const exceeded = globalCostTracker.hasExceededLimit(userId, 10.00);
```

## Rate Limiting

Rate limiting with multiple limits:

```typescript
import { DefaultRateLimits, checkAIRateLimit } from '@/lib/ai';

// Check before operation
const rateLimit = await checkAIRateLimit(
  userId,
  DefaultRateLimits.basic,
  estimatedTokens,
  estimatedCost
);

if (!rateLimit.allowed) {
  throw new Error(`Rate limit exceeded. Retry after ${rateLimit.retryAfter}s`);
}
```

Default rate limits:
- **Free**: 10 requests/hour, 10K tokens, $0.10
- **Basic**: 50 requests/hour, 100K tokens, $1.00
- **Pro**: 200 requests/hour, 500K tokens, $10.00

## Error Handling

```typescript
try {
  const result = await aiService.analyzeScene(scene);
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limit
  } else if (error.message.includes('Cost limit exceeded')) {
    // Handle cost limit
  } else {
    // Handle other errors
  }
}
```

## Service Status

```typescript
// Check availability
const available = await aiService.isAvailable();

// Get rate limit status
const rateLimit = await aiService.getRateLimitStatus();

// Get total cost
const totalCost = await aiService.getTotalCost();
```

## Future Implementation

To implement a real AI service:

1. Create a new class implementing `IAIService`
2. Replace mock API calls with real API calls
3. Use token counting utilities
4. Track costs with `globalCostTracker`
5. Check rate limits before operations

Example:

```typescript
class OpenAIService implements IAIService {
  async analyzeScene(scene: Scene, context?: SceneAnalysisContext) {
    // Check rate limits
    const rateLimit = await checkAIRateLimit(...);
    
    // Count input tokens
    const inputTokens = countTokens(prompt, 'gpt-4');
    
    // Make API call
    const response = await openai.chat.completions.create({...});
    
    // Count output tokens
    const outputTokens = response.usage.completion_tokens;
    
    // Calculate cost
    const cost = calculateCost({...});
    
    // Track cost
    globalCostTracker.trackCost(userId, cost.cost);
    
    return { data, tokenUsage, cost, rateLimit };
  }
}
```

## Testing

Mock service is perfect for testing:

```typescript
import { MockAIService } from '@/lib/ai';

const aiService = new MockAIService({
  defaultModel: 'gpt-4',
  userId: 'test-user',
  rateLimitConfig: DefaultRateLimits.unlimited,
});

// No real API calls, instant results
const result = await aiService.analyzeScene(scene);
```

## Cost Estimation

Approximate costs per 1K tokens:

| Model | Input | Output |
|-------|-------|--------|
| GPT-4 | $0.03 | $0.06 |
| GPT-4 Turbo | $0.01 | $0.03 |
| GPT-3.5 Turbo | $0.0015 | $0.002 |
| Claude 3 Opus | $0.015 | $0.075 |
| Claude 3 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |

## Best Practices

1. **Always check rate limits** before operations
2. **Estimate tokens** before API calls
3. **Track costs** for all operations
4. **Set cost limits** per user
5. **Use appropriate models** for tasks
6. **Handle errors gracefully**

---

**The AI service interface is ready for real implementations!** 🚀
