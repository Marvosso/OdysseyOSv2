/**
 * Safe Text Decoder for Browser and Node.js
 * 
 * Handles encoding detection and proper UTF-8 conversion
 * Prevents garbled text from incorrect encoding assumptions
 */

// BufferEncoding type from Node.js
type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

/**
 * Encoding detection result
 */
export interface EncodingResult {
  /** Detected encoding */
  readonly encoding: string;
  /** Confidence level (0-1) */
  readonly confidence: number;
  /** Whether BOM was detected */
  readonly hasBOM: boolean;
}

/**
 * Decoded text result
 */
export interface DecodedText {
  /** Decoded text (always UTF-8) */
  readonly text: string;
  /** Original encoding detected */
  readonly originalEncoding: EncodingResult;
  /** Character count */
  readonly characterCount: number;
  /** Byte length (UTF-8) */
  readonly byteLength: number;
}

/**
 * Safe text decoder for browser environments
 */
export class BrowserTextDecoder {
  /**
   * Decode file to UTF-8 text safely
   * Handles various encodings and ensures UTF-8 output
   */
  static async decodeFile(file: File): Promise<DecodedText> {
    try {
      // Read as ArrayBuffer to inspect raw bytes
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Detect encoding from BOM and content
      const encodingResult = this.detectEncoding(uint8Array);
      
      // Decode based on detected encoding
      const text = await this.decodeWithEncoding(uint8Array, encodingResult.encoding);
      
      // Validate and normalize
      const normalized = this.normalizeToUTF8(text, encodingResult);
      
      // Calculate metadata
      const characterCount = normalized.length;
      const byteLength = new TextEncoder().encode(normalized).length;
      
      return {
        text: normalized,
        originalEncoding: encodingResult,
        characterCount,
        byteLength,
      } as const;
    } catch (error) {
      throw new Error(
        `Failed to decode file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Detect encoding from file bytes
   */
  private static detectEncoding(bytes: Uint8Array): EncodingResult {
    // Check for BOM (Byte Order Mark)
    if (bytes.length >= 3) {
      // UTF-8 BOM: EF BB BF
      if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        return {
          encoding: 'UTF-8',
          confidence: 1.0,
          hasBOM: true,
        };
      }
    }
    
    if (bytes.length >= 2) {
      // UTF-16 LE BOM: FF FE
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        return {
          encoding: 'UTF-16LE',
          confidence: 1.0,
          hasBOM: true,
        };
      }
      // UTF-16 BE BOM: FE FF
      if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        return {
          encoding: 'UTF-16BE',
          confidence: 1.0,
          hasBOM: true,
        };
      }
    }
    
    // Try to detect encoding from content
    // Check if valid UTF-8 (no replacement characters in first pass)
    const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (!utf8Text.includes('\ufffd')) {
      // No replacement characters, likely UTF-8
      return {
        encoding: 'UTF-8',
        confidence: 0.9,
        hasBOM: false,
      };
    }
    
    // Try Windows-1252 (common for Windows text files)
    try {
      const windows1252Text = new TextDecoder('windows-1252', { fatal: false }).decode(bytes);
      if (!windows1252Text.includes('\ufffd')) {
        return {
          encoding: 'windows-1252',
          confidence: 0.8,
          hasBOM: false,
        };
      }
    } catch {
      // windows-1252 not supported, continue
    }
    
    // Try ISO-8859-1 (Latin-1)
    try {
      const iso88591Text = new TextDecoder('iso-8859-1', { fatal: false }).decode(bytes);
      if (!iso88591Text.includes('\ufffd')) {
        return {
          encoding: 'iso-8859-1',
          confidence: 0.7,
          hasBOM: false,
        };
      }
    } catch {
      // iso-8859-1 not supported, continue
    }
    
    // Default to UTF-8 with low confidence
    return {
      encoding: 'UTF-8',
      confidence: 0.5,
      hasBOM: false,
    };
  }

  /**
   * Decode bytes with specific encoding
   */
  private static async decodeWithEncoding(
    bytes: Uint8Array,
    encoding: string
  ): Promise<string> {
    // Remove BOM if present
    let bytesToDecode = bytes;
    if (encoding === 'UTF-8' && bytes.length >= 3) {
      if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        bytesToDecode = bytes.slice(3);
      }
    } else if ((encoding === 'UTF-16LE' || encoding === 'UTF-16BE') && bytes.length >= 2) {
      if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
        bytesToDecode = bytes.slice(2);
      }
    }
    
    // Decode with detected encoding
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      return decoder.decode(bytesToDecode);
    } catch (error) {
      // Fallback to UTF-8
      const decoder = new TextDecoder('utf-8', { fatal: false });
      return decoder.decode(bytesToDecode);
    }
  }

  /**
   * Normalize text to UTF-8 and validate
   */
  private static normalizeToUTF8(
    text: string,
    encodingResult: EncodingResult
  ): string {
    // Remove any remaining BOM characters
    let normalized = text;
    if (normalized.charCodeAt(0) === 0xfeff) {
      normalized = normalized.slice(1);
    }
    if (normalized.startsWith('\ufeff')) {
      normalized = normalized.slice(1);
    }
    
    // Check for replacement characters (encoding issues)
    const replacementCount = (normalized.match(/\ufffd/g) || []).length;
    if (replacementCount > 0) {
      const replacementRatio = replacementCount / normalized.length;
      
      // If more than 1% replacement characters, likely encoding issue
      if (replacementRatio > 0.01) {
        console.warn(
          `High replacement character count (${replacementCount}/${normalized.length}). ` +
          `Original encoding: ${encodingResult.encoding} (confidence: ${encodingResult.confidence})`
        );
      }
    }
    
    return normalized;
  }

  /**
   * Sanitize text by removing null bytes
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    // Remove null bytes using multiple methods
    let sanitized = text.replace(/\0/g, '').replace(/\u0000/g, '').replace(/\x00/g, '');
    // Filter by character code as ultimate fallback
    sanitized = sanitized.split('').filter(char => char.charCodeAt(0) !== 0).join('');
    return sanitized;
  }

  /**
   * Validate decoded text for corruption
   */
  static validateDecodedText(text: string, options?: { allowNullBytes?: boolean; autoSanitize?: boolean }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedText?: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedText: string | undefined;
    
    // Check for null bytes (shouldn't be in text)
    if (text.includes('\0') || text.includes('\u0000') || text.includes('\x00') || 
        text.split('').some(char => char.charCodeAt(0) === 0)) {
      if (options?.autoSanitize) {
        // Auto-sanitize null bytes instead of failing
        sanitizedText = this.sanitizeText(text);
        warnings.push('Text contained null bytes - automatically sanitized');
      } else if (!options?.allowNullBytes) {
        errors.push('Text contains null bytes - possible corruption');
      } else {
        warnings.push('Text contains null bytes - will be sanitized');
      }
    }
    
    // Check for excessive replacement characters
    const replacementCount = (text.match(/\ufffd/g) || []).length;
    if (replacementCount > 0) {
      const ratio = replacementCount / text.length;
      if (ratio > 0.01) {
        errors.push(
          `High replacement character count: ${replacementCount} characters (${(ratio * 100).toFixed(2)}%)`
        );
      } else if (ratio > 0.001) {
        warnings.push(
          `Some replacement characters detected: ${replacementCount} characters`
        );
      }
    }
    
    // Check for control characters (except common ones like \n, \r, \t)
    const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    const controlChars = text.match(controlCharPattern);
    if (controlChars && controlChars.length > 10) {
      warnings.push(
        `Unusual control characters detected: ${controlChars.length} occurrences`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedText,
    };
  }
}

/**
 * Node.js compatible text decoder
 * (For server-side or Node.js environments)
 */
export class NodeTextDecoder {
  /**
   * Decode buffer to UTF-8 text (Node.js)
   */
  static decodeBuffer(buffer: Buffer, encoding?: string): DecodedText {
    try {
      // Detect encoding if not provided
      const detectedEncoding = (encoding || this.detectEncoding(buffer)) as BufferEncoding;
      
      // Decode with detected encoding
      const text = buffer.toString(detectedEncoding);
      
      // Normalize to UTF-8
      const normalized = this.normalizeToUTF8(text);
      
      // Calculate metadata
      const characterCount = normalized.length;
      const byteLength = Buffer.from(normalized, 'utf8').length;
      
      return {
        text: normalized,
        originalEncoding: {
          encoding: detectedEncoding,
          confidence: 0.9,
          hasBOM: this.hasBOM(buffer),
        },
        characterCount,
        byteLength,
      } as const;
    } catch (error) {
      throw new Error(
        `Failed to decode buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Detect encoding from buffer (Node.js)
   */
  private static detectEncoding(buffer: Buffer): string {
    // Check for BOM
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return 'utf8';
    }
    
    // Try to detect from content
    // In Node.js, we can use iconv-lite or similar, but for now default to utf8
    return 'utf8';
  }

  /**
   * Check if buffer has BOM
   */
  private static hasBOM(buffer: Buffer): boolean {
    if (buffer.length >= 3) {
      return buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
    }
    return false;
  }

  /**
   * Normalize text to UTF-8
   */
  private static normalizeToUTF8(text: string): string {
    // Remove BOM if present
    let normalized = text;
    if (normalized.charCodeAt(0) === 0xfeff) {
      normalized = normalized.slice(1);
    }
    if (normalized.startsWith('\ufeff')) {
      normalized = normalized.slice(1);
    }
    
    return normalized;
  }
}
