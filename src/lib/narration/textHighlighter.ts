/**
 * Text Highlighter
 * 
 * Utilities for highlighting text as it's being read
 */

export interface HighlightRange {
  start: number;
  end: number;
  text: string;
}

export interface HighlightResult {
  highlightedText: string;
  ranges: HighlightRange[];
}

/**
 * Split text into words with their positions
 */
export function splitTextIntoWords(text: string): Array<{ word: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = [];
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return words;
}

/**
 * Create highlighted HTML from text and current word index
 */
export function createHighlightedHTML(
  text: string,
  currentWordIndex: number,
  highlightClass: string = 'bg-yellow-500/30 text-yellow-200'
): string {
  const words = splitTextIntoWords(text);
  
  if (words.length === 0) return text;
  if (currentWordIndex < 0 || currentWordIndex >= words.length) {
    return text;
  }

  const currentWord = words[currentWordIndex];
  let highlightedHTML = '';
  let lastIndex = 0;

  // Add text before current word
  if (currentWord.start > lastIndex) {
    highlightedHTML += escapeHTML(text.substring(lastIndex, currentWord.start));
  }

  // Add highlighted current word
  highlightedHTML += `<span class="${highlightClass}">${escapeHTML(currentWord.word)}</span>`;

  // Add text after current word
  lastIndex = currentWord.end;
  if (lastIndex < text.length) {
    highlightedHTML += escapeHTML(text.substring(lastIndex));
  }

  return highlightedHTML;
}

/**
 * Create highlighted HTML for a range of words
 */
export function createRangeHighlightedHTML(
  text: string,
  startWordIndex: number,
  endWordIndex: number,
  highlightClass: string = 'bg-yellow-500/30 text-yellow-200'
): string {
  const words = splitTextIntoWords(text);
  
  if (words.length === 0) return text;
  if (startWordIndex < 0) startWordIndex = 0;
  if (endWordIndex >= words.length) endWordIndex = words.length - 1;
  if (startWordIndex > endWordIndex) return text;

  let highlightedHTML = '';
  let lastIndex = 0;

  // Add text before range
  if (startWordIndex > 0 && words[startWordIndex - 1]) {
    const beforeStart = words[startWordIndex].start;
    if (beforeStart > lastIndex) {
      highlightedHTML += escapeHTML(text.substring(lastIndex, beforeStart));
    }
    lastIndex = beforeStart;
  }

  // Add highlighted range
  const rangeStart = words[startWordIndex].start;
  const rangeEnd = words[endWordIndex].end;
  highlightedHTML += `<span class="${highlightClass}">${escapeHTML(text.substring(rangeStart, rangeEnd))}</span>`;

  // Add text after range
  lastIndex = rangeEnd;
  if (lastIndex < text.length) {
    highlightedHTML += escapeHTML(text.substring(lastIndex));
  }

  return highlightedHTML;
}

/**
 * Find word index from character position
 */
export function findWordIndexFromCharPosition(text: string, charPosition: number): number {
  const words = splitTextIntoWords(text);
  
  for (let i = 0; i < words.length; i++) {
    if (charPosition >= words[i].start && charPosition < words[i].end) {
      return i;
    }
  }

  // If position is after all words, return last word index
  if (words.length > 0 && charPosition >= words[words.length - 1].end) {
    return words.length - 1;
  }

  return 0;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get word boundaries from text
 */
export function getWordBoundaries(text: string): Array<{ start: number; end: number }> {
  return splitTextIntoWords(text).map(w => ({ start: w.start, end: w.end }));
}
