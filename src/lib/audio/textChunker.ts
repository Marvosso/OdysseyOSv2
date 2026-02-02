/**
 * Text Chunker
 * 
 * PROBLEM: Long text causes timeouts/interruptions
 * SOLUTION: Break into chunks with pauses
 */

import { SpeechManager } from './speechManager';

export class TextChunker {
  /**
   * Chunk text into smaller pieces by sentences
   */
  static chunkText(text: string, maxLength = 200): string[] {
    console.log('[TextChunker] Chunking text', { textLength: text.length, maxLength });
    
    // Split by sentences first
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          console.log('[TextChunker] Created chunk', { length: currentChunk.length, chunk: currentChunk.substring(0, 50) + '...' });
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
      console.log('[TextChunker] Created final chunk', { length: currentChunk.length });
    }
    
    console.log('[TextChunker] Total chunks created', { count: chunks.length });
    return chunks;
  }

  /**
   * Speak text in chunks with pauses between them
   */
  static async speakText(
    text: string,
    voice?: string,
    rate = 1,
    chunkPause = 300
  ): Promise<void> {
    console.log('[TextChunker] speakText called', { textLength: text.length, voice, rate, chunkPause });
    
    const speechManager = SpeechManager.getInstance();
    const chunks = this.chunkText(text, 200);

    if (chunks.length === 0) {
      console.warn('[TextChunker] No chunks to speak');
      return;
    }

    console.log('[TextChunker] Speaking', chunks.length, 'chunks');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;
      
      try {
        console.log('[TextChunker] Speaking chunk', { index: i + 1, total: chunks.length, length: chunk.length });
        await speechManager.speak(chunk, voice, rate);
        
        // Small pause between chunks (except after the last one)
        if (!isLastChunk) {
          console.log('[TextChunker] Pausing between chunks', { pauseMs: chunkPause });
          await new Promise(resolve => setTimeout(resolve, chunkPause));
        }
      } catch (error) {
        console.error('[TextChunker] Failed to speak chunk:', error);
        // Continue with next chunk instead of stopping entirely
        continue;
      }
    }
    
    console.log('[TextChunker] Finished speaking all chunks');
  }
}
