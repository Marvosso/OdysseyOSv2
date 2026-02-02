/**
 * Social Media Export Generators
 * 
 * Generates content optimized for social media platforms
 */

import type { Story, Scene } from '@/types/story';

export interface TwitterThread {
  tweets: string[];
  totalTweets: number;
  estimatedEngagement: number;
}

export interface InstagramCarousel {
  slides: Array<{
    title: string;
    content: string;
    imagePrompt?: string;
    hashtags: string[];
  }>;
  totalSlides: number;
}

export interface TikTokScript {
  scenes: Array<{
    time: string;
    action: string;
    dialogue?: string;
    hook: string;
  }>;
  totalDuration: string;
  hashtags: string[];
}

/**
 * Generate Twitter thread from story
 */
export function generateTwitterThread(story: Story, maxTweets: number = 20): TwitterThread {
  const tweets: string[] = [];
  
  // Thread starter
  tweets.push(`📚 ${story.title}\n\nA thread 🧵`);
  
  // Character introductions
  if (story.characters.length > 0) {
    const charIntro = story.characters.slice(0, 3).map(char => char.name).join(', ');
    tweets.push(`Characters: ${charIntro}${story.characters.length > 3 ? '...' : ''}`);
  }
  
  // Scene summaries (condensed for Twitter)
  story.scenes.forEach((scene, index) => {
    if (tweets.length >= maxTweets) return;
    
    const content = scene.content;
    const words = content.split(/\s+/);
    
    // Split long scenes into multiple tweets
    if (words.length > 200) {
      // Break into chunks
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += 200) {
        chunks.push(words.slice(i, i + 200).join(' '));
      }
      
      chunks.forEach((chunk, chunkIndex) => {
        if (tweets.length >= maxTweets) return;
        tweets.push(`${index + 1}/${chunks.length} ${chunk}...`);
      });
    } else {
      // Single tweet for scene
      const preview = words.slice(0, 200).join(' ');
      tweets.push(`${index + 1}. ${preview}${words.length > 200 ? '...' : ''}`);
    }
  });
  
  // Closing tweet
  if (tweets.length < maxTweets) {
    tweets.push(`End of thread. Full story available at [your link]`);
  }
  
  return {
    tweets,
    totalTweets: tweets.length,
    estimatedEngagement: Math.floor(tweets.length * 50), // Rough estimate
  };
}

/**
 * Generate Instagram carousel from scenes
 */
export function generateInstagramCarousel(story: Story): InstagramCarousel {
  const slides: InstagramCarousel['slides'] = [];
  
  // Title slide
  slides.push({
    title: story.title,
    content: `A story by [Your Name]\n\n${story.scenes.length} scenes • ${story.characters.length} characters`,
    imagePrompt: `Book cover design for "${story.title}", modern minimalist style`,
    hashtags: ['#writing', '#story', '#fiction', '#writersofinstagram'],
  });
  
  // Character slides
  story.characters.slice(0, 3).forEach((char) => {
    slides.push({
      title: char.name,
      content: `${char.description}\n\nGoals: ${char.goals.slice(0, 2).join(', ')}`,
      imagePrompt: `Portrait of ${char.name}, character from "${story.title}"`,
      hashtags: ['#character', '#writing', '#fiction'],
    });
  });
  
  // Scene slides (one per scene, max 10)
  story.scenes.slice(0, 10).forEach((scene, index) => {
    const words = scene.content.split(/\s+/);
    const preview = words.slice(0, 100).join(' ');
    
    slides.push({
      title: `Scene ${index + 1}: ${scene.title}`,
      content: `${preview}${words.length > 100 ? '...' : ''}\n\n[Read more in bio]`,
      imagePrompt: `Scene from "${story.title}": ${scene.title}, mood: ${scene.emotion}`,
      hashtags: ['#writing', '#fiction', '#story', '#writersofinstagram'],
    });
  });
  
  return {
    slides,
    totalSlides: slides.length,
  };
}

/**
 * Generate TikTok script format
 */
export function generateTikTokScript(story: Story, targetDuration: number = 60): TikTokScript {
  const scenes: TikTokScript['scenes'] = [];
  let currentTime = 0;
  const secondsPerScene = targetDuration / story.scenes.length;
  
  story.scenes.forEach((scene, index) => {
    const startTime = currentTime;
    const duration = Math.min(secondsPerScene, 15); // Max 15 seconds per scene
    currentTime += duration;
    
    // Extract hook (first sentence or dialogue)
    const firstLine = scene.content.split('\n')[0];
    const dialogueMatch = scene.content.match(/"([^"]+)"/);
    const hook = dialogueMatch ? dialogueMatch[1] : firstLine.substring(0, 100);
    
    // Extract action (non-dialogue content)
    const action = scene.content
      .replace(/"[^"]+"/g, '')
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 2)
      .join(' ')
      .substring(0, 150);
    
    scenes.push({
      time: `${Math.floor(startTime)}s - ${Math.floor(currentTime)}s`,
      action: action || scene.title,
      dialogue: dialogueMatch ? dialogueMatch[1] : undefined,
      hook: hook.substring(0, 80),
    });
  });
  
  // Generate hashtags
  const hashtags = [
    '#writing',
    '#storytime',
    '#fiction',
    '#booktok',
    '#writersoftiktok',
    story.title.toLowerCase().replace(/\s+/g, ''),
  ];
  
  return {
    scenes,
    totalDuration: `${Math.floor(currentTime)}s`,
    hashtags,
  };
}
