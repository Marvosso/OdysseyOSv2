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
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')  // Windows line endings
    .replace(/\r/g, '\n')     // Old Mac line endings
    .trim();
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
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    // Trim and normalize line endings
    return normalizeText(fullText);
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
    
    // Trim and normalize line endings
    return normalizeText(result.value);
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
    
    // Validate decoded text
    const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
    if (!validation.isValid) {
      throw new Error(`Encoding error: ${validation.errors.join(', ')}`);
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Text decoding warnings:', validation.warnings);
    }
    
    return normalizeText(decoded.text);
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
  
  // Ensure no binary data is passed as text (check for null bytes)
  if (text.includes('\0')) {
    throw new Error('File contains null bytes - possible binary data corruption');
  }
  
  return {
    text,
    fileType,
  };
}
