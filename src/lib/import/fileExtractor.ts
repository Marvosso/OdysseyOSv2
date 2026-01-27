/**
 * File Extractor
 * 
 * Extracts text content from various file formats:
 * - PDF: using pdfjs-dist (browser-compatible, pdf-parse equivalent)
 * - DOCX: using mammoth
 * - TXT/MD: using text decoder
 * 
 * Note: pdf-parse is Node.js only and requires Buffer.
 * For browser compatibility, we use pdfjs-dist which provides equivalent functionality.
 */

export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'md';

export interface ExtractedText {
  text: string;
  fileType: SupportedFileType;
}

/**
 * Detect file type from file extension
 */
export function detectFileType(fileName: string): SupportedFileType | null {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'doc':
      // .doc is the older binary format, not supported by mammoth
      // Return null to trigger unsupported format error
      return null;
    case 'txt':
      return 'txt';
    case 'md':
    case 'markdown':
      return 'md';
    default:
      return null;
  }
}

/**
 * Normalize line endings and trim text
 * Also converts smart quotes and dashes to plain ASCII
 */
function normalizeText(text: string): string {
  let normalized = text
    .replace(/\r\n/g, '\n')  // Windows line endings (\r\n → \n)
    .replace(/\r/g, '\n');    // Old Mac line endings (\r → \n)
  
  // Convert smart quotes to plain ASCII
  normalized = normalized
    .replace(/[""]/g, '"')      // Left/right double quotes → straight quote
    .replace(/['']/g, "'")      // Left/right single quotes → straight apostrophe
    .replace(/['']/g, "'")      // Alternative single quotes → apostrophe
    .replace(/[""]/g, '"');     // Alternative double quotes → straight quote
  
  // Convert smart dashes to plain ASCII
  normalized = normalized
    .replace(/—/g, '--')        // Em dash (—) → double hyphen
    .replace(/–/g, '-')         // En dash (–) → single hyphen
    .replace(/―/g, '--');       // Horizontal bar (―) → double hyphen
  
  return normalized.trim();
}

/**
 * Check if a string contains mostly non-printable/binary characters
 * Returns true if more than 30% of characters are non-printable
 */
function isMostlyBinary(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  const nonPrintableCount = text.split('').filter((char: string) => {
    const code = char.charCodeAt(0);
    // Non-printable: not in range 32-126, and not common whitespace (9, 10, 13)
    return !(code >= 32 && code <= 126) && code !== 9 && code !== 10 && code !== 13;
  }).length;
  
  const ratio = nonPrintableCount / text.length;
  return ratio > 0.3; // More than 30% non-printable
}

/**
 * Sanitize text by removing null bytes and other problematic characters
 * Null bytes can appear in extracted text from DOCX/PDF files as harmless artifacts
 * Also filters out lines that are mostly binary/corrupted
 */
function sanitizeExtractedText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove null bytes using multiple methods to ensure they're caught
  // Method 1: Direct null byte character
  let sanitized = text.replace(/\0/g, '');
  
  // Method 2: Unicode null character
  sanitized = sanitized.replace(/\u0000/g, '');
  
  // Method 3: Hex null byte
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Remove other control characters except common whitespace (\n, \r, \t)
  // Keep only printable characters and common whitespace
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Filter out lines that are mostly binary/corrupted
  const lines = sanitized.split('\n');
  const cleanLines = lines.filter(line => {
    // Skip lines that are mostly non-printable
    if (isMostlyBinary(line)) {
      return false;
    }
    // Skip lines that are mostly special characters (likely binary)
    const specialCharCount = (line.match(/[^\w\s]/g) || []).length;
    if (line.length > 0 && specialCharCount / line.length > 0.8) {
      return false;
    }
    return true;
  });
  
  return cleanLines.join('\n');
}

/**
 * Extract text from PDF file
 * Uses pdfjs-dist (browser-compatible equivalent of pdf-parse)
 */
async function extractPDFText(file: File): Promise<string> {
  try {
    // Convert file.arrayBuffer() to ArrayBuffer (already done, but for clarity)
    const arrayBuffer = await file.arrayBuffer();
    
    // Use pdfjs-dist for browser compatibility (equivalent to pdf-parse)
    // pdf-parse requires Node.js Buffer, so we use pdfjs-dist in browser
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source for pdfjs (required for browser)
    if (typeof window !== 'undefined') {
      // Use unpkg CDN for worker (more reliable than cdnjs)
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    }
    
    // Load PDF document from ArrayBuffer
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text items and filter out binary/corrupted content
      const pageText = textContent.items
        .map((item: any) => {
          if (!item.str || typeof item.str !== 'string') {
            return '';
          }
          
          // Filter out items that are mostly non-printable
          const str = item.str;
          const printableCount = str.split('').filter((char: string) => {
            const code = char.charCodeAt(0);
            return code >= 32 && code <= 126;
          }).length;
          
          // Skip if less than 70% printable (likely binary/corrupted)
          if (str.length > 0 && printableCount / str.length < 0.7) {
            return '';
          }
          
          return str;
        })
        .filter(str => str.length > 0) // Remove empty strings
        .join(' ');
      
      if (pageText.trim().length > 0) {
        fullText += pageText + '\n';
      }
    }
    
    // Sanitize extracted text (remove null bytes and control characters)
    const sanitized = sanitizeExtractedText(fullText);
    
    // Trim and normalize line endings
    return normalizeText(sanitized);
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX file
 * Uses mammoth.extractRawText with ArrayBuffer
 */
async function extractDOCXText(file: File): Promise<string> {
  try {
    // Convert file.arrayBuffer() to arrayBuffer input
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract plain text using mammoth.extractRawText
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('DOCX extraction warnings:', result.messages);
    }
    
    // Filter out binary/corrupted lines before sanitization
    const lines = result.value.split('\n');
    const cleanLines = lines.map((line: string) => {
      // Check if line is mostly printable
      const printableCount = line.split('').filter((char: string) => {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126;
      }).length;
      
      // If less than 70% printable, it's likely corrupted - return empty
      if (line.length > 0 && printableCount / line.length < 0.7) {
        return '';
      }
      
      return line;
    }).filter(line => line.trim().length > 0);
    
    const filteredText = cleanLines.join('\n');
    
    // Sanitize extracted text (remove null bytes and control characters)
    const sanitized = sanitizeExtractedText(filteredText);
    
    // Trim and normalize line endings
    return normalizeText(sanitized);
  } catch (error) {
    throw new Error(`Failed to extract DOCX text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from TXT/MD file
 */
async function extractTextFile(file: File): Promise<string> {
  try {
    const { BrowserTextDecoder } = await import('@/lib/import/textDecoder');
    const decoded = await BrowserTextDecoder.decodeFile(file);
    
    // Validate decoded text with auto-sanitize enabled
    const validation = BrowserTextDecoder.validateDecodedText(decoded.text, { 
      autoSanitize: true 
    });
    
    // Use sanitized text if available, otherwise use original
    const textToUse = validation.sanitizedText || decoded.text;
    
    if (!validation.isValid) {
      throw new Error(`Encoding error: ${validation.errors.join(', ')}`);
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Text decoding warnings:', validation.warnings);
    }
    
    return normalizeText(textToUse);
  } catch (error) {
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from file based on type
 */
export async function extractTextFromFile(file: File): Promise<ExtractedText> {
  const fileType = detectFileType(file.name);
  
  if (!fileType) {
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'doc') {
      throw new Error(
        `Unsupported format: .doc files are not supported. ` +
        `Please convert your .doc file to .docx format (File > Save As > Word Document in Microsoft Word) ` +
        `or use one of the supported formats: .txt, .md, .pdf, .docx`
      );
    }
    throw new Error(`Unsupported format: ${file.name}. Supported formats: .txt, .md, .pdf, .docx`);
  }
  
  let text: string;
  
  switch (fileType) {
    case 'pdf':
      text = await extractPDFText(file);
      break;
    case 'docx':
      text = await extractDOCXText(file);
      break;
    case 'txt':
    case 'md':
      text = await extractTextFile(file);
      break;
    default:
      throw new Error(`Unsupported format: ${fileType}`);
  }
  
  // Final sanitization pass to ensure no null bytes remain (defensive)
  // This catches any null bytes that might have been introduced or missed
  // Apply sanitization multiple times to ensure all null bytes are removed
  text = sanitizeExtractedText(text);
  text = sanitizeExtractedText(text); // Second pass to catch any edge cases
  
  // Final check: use character code filtering as ultimate fallback
  // This ensures absolutely no null bytes remain
  const hasNullBytes = text.includes('\0') || 
                       text.includes('\u0000') || 
                       text.includes('\x00') ||
                       text.split('').some((char: string) => char.charCodeAt(0) === 0);
  
  if (hasNullBytes) {
    // Ultimate fallback: filter out any character with code 0
    // Also filter out other problematic control characters except whitespace
    text = text.split('').filter((char: string) => {
      const code = char.charCodeAt(0);
      // Keep: printable chars (32-126), tab (9), newline (10), carriage return (13)
      // Remove: null (0) and other control chars
      return code !== 0 && (code >= 32 || code === 9 || code === 10 || code === 13);
    }).join('');
    
    // Verify no null bytes remain
    if (text.includes('\0') || text.split('').some(char => char.charCodeAt(0) === 0)) {
      console.error('CRITICAL: Null bytes still present after all sanitization attempts');
      // Last resort: replace all null bytes with empty string
      text = text.replace(/\0/g, '').replace(/\u0000/g, '').replace(/\x00/g, '');
    }
  }
  
  // Final verification - if null bytes still exist, something is very wrong
  // But we'll return the text anyway since we've done our best to clean it
  const finalNullCheck = text.split('').some(char => char.charCodeAt(0) === 0);
  if (finalNullCheck) {
    console.warn('Warning: Some null bytes may still be present after sanitization');
  }
  
  return {
    text,
    fileType,
  };
}
