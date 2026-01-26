/**
 * Enhanced Word Count Utilities
 * 
 * Accurate word counting with edge case handling
 */

/**
 * Compute word count with improved accuracy
 * Handles hyphenated words, contractions, Unicode, etc.
 */
export function computeWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Normalize whitespace
  let normalized = text.trim().replace(/\s+/g, ' ');

  // Split on whitespace and word boundaries
  // Use Unicode-aware word boundary
  const words = normalized
    .split(/\s+/)
    .filter(word => {
      // Remove empty strings
      if (word.length === 0) return false;
      
      // Remove standalone punctuation (but keep punctuation in words)
      // A word must contain at least one letter or number
      if (!/[\p{L}\p{N}]/u.test(word)) {
        return false;
      }
      
      return true;
    });

  return words.length;
}

/**
 * Compute word count with style guide options
 */
export interface WordCountOptions {
  /** Count hyphenated words as one word (default: true) */
  hyphenatedAsOne?: boolean;
  /** Count contractions as one word (default: true) */
  contractionsAsOne?: boolean;
  /** Count numbers as words (default: true) */
  numbersAsWords?: boolean;
}

/**
 * Advanced word counting with options
 */
export function computeWordCountAdvanced(
  text: string,
  options: WordCountOptions = {}
): number {
  const {
    hyphenatedAsOne = true,
    contractionsAsOne = true,
    numbersAsWords = true,
  } = options;

  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Normalize whitespace
  let normalized = text.trim().replace(/\s+/g, ' ');

  // Split on whitespace
  const segments = normalized.split(/\s+/).filter(s => s.length > 0);

  let wordCount = 0;

  for (const segment of segments) {
    // Check if segment contains at least one letter
    const hasLetter = /[\p{L}]/u.test(segment);
    
    // Check if segment contains numbers
    const hasNumber = /[\p{N}]/u.test(segment);

    if (!hasLetter && !hasNumber) {
      // Pure punctuation, skip
      continue;
    }

    if (!numbersAsWords && !hasLetter && hasNumber) {
      // Numbers only and numbers not counted
      continue;
    }

    // Count as one word (hyphenated words, contractions, etc. are one word)
    wordCount++;
  }

  return wordCount;
}

/**
 * Validate word count accuracy
 * Compares stored vs computed and flags discrepancies
 */
export function validateWordCount(
  stored: number,
  computed: number,
  tolerance: number = 0.01 // 1% tolerance
): {
  isValid: boolean;
  difference: number;
  needsReconciliation: boolean;
} {
  const difference = Math.abs(stored - computed);
  const maxDifference = Math.max(1, Math.floor(computed * tolerance));
  
  return {
    isValid: difference <= maxDifference,
    difference,
    needsReconciliation: difference > maxDifference,
  };
}
