/**
 * Publishing Format Exporters
 * 
 * Generates formats ready for publishing platforms
 */

import type { Story, Scene } from '@/types/story';

export interface KDPFormat {
  content: string;
  metadata: {
    title: string;
    author: string;
    wordCount: number;
    pageCount: number;
  };
}

export interface WattpadFormat {
  content: string;
  chapters: Array<{
    title: string;
    content: string;
  }>;
}

export interface ManuscriptFormat {
  content: string;
  wordCount: number;
  pageCount: number;
}

/**
 * Generate Amazon KDP ready PDF content
 */
export function generateKDPFormat(
  story: Story,
  authorName: string = 'Your Name'
): KDPFormat {
  let content = '';
  
  // Title page
  content += `${story.title}\n\n`;
  content += `by ${authorName}\n\n`;
  content += `${'='.repeat(50)}\n\n\n`;
  
  // Copyright page
  content += `Copyright © ${new Date().getFullYear()} ${authorName}\n\n`;
  content += `All rights reserved.\n\n`;
  content += `This book or any portion thereof may not be reproduced or used in any manner whatsoever without the express written permission of the publisher except for the use of brief quotations in a book review.\n\n\n`;
  
  // Table of contents (if scenes are grouped into chapters)
  content += `TABLE OF CONTENTS\n\n`;
  story.scenes.forEach((scene, index) => {
    content += `Scene ${index + 1}: ${scene.title} ................. ${index + 1}\n`;
  });
  content += `\n\n`;
  
  // Main content
  story.scenes.forEach((scene, index) => {
    content += `\n\nSCENE ${index + 1}\n`;
    content += `${scene.title}\n\n`;
    content += `${scene.content}\n\n`;
    content += `${'-'.repeat(50)}\n`;
  });
  
  // About the author (placeholder)
  content += `\n\n\nABOUT THE AUTHOR\n\n`;
  content += `${authorName} is a writer.\n\n`;
  
  const wordCount = story.scenes.reduce((acc, scene) => {
    return acc + scene.content.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
  
  // Estimate pages (250 words per page)
  const pageCount = Math.ceil(wordCount / 250);
  
  return {
    content,
    metadata: {
      title: story.title,
      author: authorName,
      wordCount,
      pageCount,
    },
  };
}

/**
 * Generate Wattpad format
 */
export function generateWattpadFormat(story: Story): WattpadFormat {
  const chapters: WattpadFormat['chapters'] = [];
  
  // Group scenes into chapters (5 scenes per chapter)
  const scenesPerChapter = 5;
  for (let i = 0; i < story.scenes.length; i += scenesPerChapter) {
    const chapterScenes = story.scenes.slice(i, i + scenesPerChapter);
    const chapterNumber = Math.floor(i / scenesPerChapter) + 1;
    
    let chapterContent = '';
    chapterScenes.forEach((scene, sceneIndex) => {
      chapterContent += `\n\n[Scene ${sceneIndex + 1}]\n\n`;
      chapterContent += `${scene.content}\n\n`;
      chapterContent += `---\n`;
    });
    
    chapters.push({
      title: `Chapter ${chapterNumber}`,
      content: chapterContent,
    });
  }
  
  // Generate full content
  let content = `# ${story.title}\n\n`;
  content += `*${story.characters.length} characters • ${story.scenes.length} scenes*\n\n`;
  content += `---\n\n`;
  
  chapters.forEach((chapter) => {
    content += `## ${chapter.title}\n\n`;
    content += chapter.content;
    content += `\n\n`;
  });
  
  return {
    content,
    chapters,
  };
}

/**
 * Generate standard manuscript format
 */
export function generateManuscriptFormat(
  story: Story,
  authorName: string = 'Your Name'
): ManuscriptFormat {
  let content = '';
  
  // Header (on every page in real manuscript)
  const header = `${authorName} / ${story.title} / Page `;
  
  // Title page (centered, ~25 lines down)
  content += '\n'.repeat(25);
  content += `${story.title}\n\n`;
  content += `by\n\n`;
  content += `${authorName}\n\n`;
  content += '\n'.repeat(25);
  
  // Main content (double-spaced, 12pt Courier equivalent)
  story.scenes.forEach((scene, index) => {
    content += `${scene.content}\n\n`;
  });
  
  const wordCount = story.scenes.reduce((acc, scene) => {
    return acc + scene.content.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
  
  // Estimate pages (250 words per page for double-spaced manuscript)
  const pageCount = Math.ceil(wordCount / 250);
  
  return {
    content,
    wordCount,
    pageCount,
  };
}
