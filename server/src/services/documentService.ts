import { pdfService } from './pdfService.js';
import { ocrService } from './ocrService.js';
import { aiService } from './aiService.js';
import { ProcessedDocument, DocumentType } from '../types/index.js';
import { calculateWordCount, calculateReadingTime } from '../utils/textHelpers.js';

export const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10); // 10MB default

export class DocumentService {
  private documentStore: Map<string, ProcessedDocument> = new Map();

  public storeDocument(doc: ProcessedDocument): void {
    this.documentStore.set(doc.id, doc);
  }

  public getDocument(id: string): ProcessedDocument | undefined {
    return this.documentStore.get(id);
  }

  /**
   * Validates file upload constraints.
   */
  public validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No file attached. Please select a document to upload.');
    }

    if (file.size === 0) {
      throw new Error('Uploaded file is empty (0 bytes). Please upload a valid document.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${maxMb}MB.`);
    }

    const mime = file.mimetype.toLowerCase();
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';

    const isPdf = mime === 'application/pdf' || ext === 'pdf';
    const isImage = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mime) ||
                    ['png', 'jpg', 'jpeg', 'webp'].includes(ext);

    if (!isPdf && !isImage) {
      throw new Error(`Unsupported file type (${file.originalname}). Please upload a PDF, PNG, JPG, or JPEG file.`);
    }
  }

  /**
   * Extracts text and calculates metadata from document.
   */
  public async extractDocumentText(file: Express.Multer.File) {
    const startTime = Date.now();
    this.validateFile(file);

    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    const mime = file.mimetype.toLowerCase();
    const isPdf = mime === 'application/pdf' || ext === 'pdf';

    let extractedText = '';
    let pageCount = 1;
    let extractionMethod: ProcessedDocument['extractionMethod'] = 'PDF Text Extraction';
    let documentType: DocumentType = isPdf ? 'pdf' : 'image';

    if (isPdf) {
      try {
        const pdfRes = await pdfService.extractText(file.buffer);
        extractedText = pdfRes.text;
        pageCount = pdfRes.pageCount;
        extractionMethod = 'PDF Text Extraction';
      } catch (pdfErr: any) {
        console.warn(`[DocumentService] PDF parsing notice: ${pdfErr.message}. Attempting OCR fallback.`);
        try {
          const ocrRes = await ocrService.performOcr(file.buffer, file.mimetype);
          extractedText = ocrRes.text;
          extractionMethod = 'Tesseract OCR Processing';
        } catch (ocrErr: any) {
          throw new Error(`PDF text extraction failed: ${pdfErr.message}`);
        }
      }
    } else {
      const ocrRes = await ocrService.performOcr(file.buffer, file.mimetype);
      extractedText = ocrRes.text;
      pageCount = 1;
      extractionMethod = 'Tesseract OCR Processing';
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('Could not extract readable text from the uploaded document.');
    }

    const wordCount = calculateWordCount(extractedText);
    const characterCount = extractedText.length;
    const estimatedReadingTimeMinutes = calculateReadingTime(wordCount);

    return {
      extractedText,
      pageCount,
      wordCount,
      characterCount,
      estimatedReadingTimeMinutes,
      extractionMethod,
      documentType
    };
  }

  /**
   * Main entry point for document processing & AI analysis pipeline.
   */
  public async processDocument(file: Express.Multer.File): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const extracted = await this.extractDocumentText(file);

    const aiAnalysis = await aiService.analyzeDocument(extracted.extractedText, file.originalname);
    const processingTimeMs = Date.now() - startTime;

    const processedDoc: ProcessedDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: extracted.documentType,
      extractedText: extracted.extractedText,
      pageCount: extracted.pageCount,
      wordCount: extracted.wordCount,
      characterCount: extracted.characterCount,
      estimatedReadingTimeMinutes: extracted.estimatedReadingTimeMinutes,
      extractionMethod: extracted.extractionMethod,
      processingTimeMs,
      title: aiAnalysis.title,
      summary: aiAnalysis.summary,
      keyPoints: aiAnalysis.keyPoints,
      improvements: aiAnalysis.improvements,
      insights: aiAnalysis.insights
    };

    // Store in memory for direct URL / refresh persistence
    this.storeDocument(processedDoc);

    return processedDoc;
  }
}

export const documentService = new DocumentService();
