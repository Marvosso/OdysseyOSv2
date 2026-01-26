/**
 * Text Safety Utilities for React Rendering
 * 
 * Ensures text is safe to render in React components
 * Prevents XSS and handles encoding issues
 */

/**
 * Sanitize text for safe React rendering
 * Removes dangerous characters and validates encoding
 */
export function sanitizeTextForRender(text: string): string {
  if (typeof text !== 'string') {
    console.warn('sanitizeTextForRender: Input is not a string, converting...');
    return String(text);
  }
  
  // Remove null bytes (can cause rendering issues)
  let sanitized = text.replace(/\0/g, '');
  
  // Remove other problematic control characters (except common ones)
  // Keep: \n (0x0A), \r (0x0D), \t (0x09)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Check for replacement characters (encoding issues)
  const replacementCount = (sanitized.match(/\ufffd/g) || []).length;
  if (replacementCount > 0) {
    const ratio = replacementCount / sanitized.length;
    if (ratio > 0.01) {
      console.warn(
        `High replacement character count detected: ${replacementCount} characters ` +
        `(${(ratio * 100).toFixed(2)}%). This may indicate encoding issues.`
      );
    }
  }
  
  return sanitized;
}

/**
 * Validate text before storing in state or localStorage
 * Ensures text is valid UTF-8 and safe to serialize
 */
export function validateTextForStorage(text: string): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (typeof text !== 'string') {
    errors.push('Text must be a string');
    return {
      isValid: false,
      sanitized: String(text),
      errors,
      warnings,
    };
  }
  
  // Check for null bytes
  if (text.includes('\0')) {
    errors.push('Text contains null bytes');
  }
  
  // Check for replacement characters
  const replacementCount = (text.match(/\ufffd/g) || []).length;
  if (replacementCount > 0) {
    const ratio = replacementCount / text.length;
    if (ratio > 0.01) {
      errors.push(
        `High replacement character count: ${replacementCount} (${(ratio * 100).toFixed(2)}%)`
      );
    } else if (ratio > 0.001) {
      warnings.push(
        `Some replacement characters detected: ${replacementCount}`
      );
    }
  }
  
  // Sanitize the text
  const sanitized = sanitizeTextForRender(text);
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Safe text component props
 * Use this when rendering user-provided text
 */
export interface SafeTextProps {
  /** Text to render */
  text: string;
  /** Whether to preserve line breaks */
  preserveLineBreaks?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * React component for safely rendering text
 * Automatically sanitizes and handles encoding issues
 */
export function SafeText({ text, preserveLineBreaks = false, className }: SafeTextProps) {
  const sanitized = sanitizeTextForRender(text);
  
  if (preserveLineBreaks) {
    return (
      <div className={className}>
        {sanitized.split('\n').map((line, index, array) => (
          <span key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  }
  
  return <span className={className}>{sanitized}</span>;
}

/**
 * Check if text contains encoding issues
 */
export function hasEncodingIssues(text: string): boolean {
  if (typeof text !== 'string') {
    return true;
  }
  
  // Check for replacement characters
  const replacementCount = (text.match(/\ufffd/g) || []).length;
  if (replacementCount > 0) {
    const ratio = replacementCount / text.length;
    return ratio > 0.01; // More than 1% replacement chars
  }
  
  // Check for null bytes
  if (text.includes('\0')) {
    return true;
  }
  
  return false;
}

/**
 * Fix common encoding issues in text
 * Attempts to recover from encoding problems
 */
export function fixEncodingIssues(text: string): string {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  // Remove null bytes
  let fixed = text.replace(/\0/g, '');
  
  // Remove replacement characters (they're lost anyway)
  // But only if they're a small percentage
  const replacementCount = (fixed.match(/\ufffd/g) || []).length;
  const ratio = replacementCount / fixed.length;
  
  if (ratio < 0.1) {
    // If less than 10% replacement chars, remove them
    fixed = fixed.replace(/\ufffd/g, '');
  }
  
  // Remove other problematic control characters
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return fixed;
}
