import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/documentService.js';
import { aiService } from '../services/aiService.js';

export const apiRouter = Router();

// Configure Multer for in-memory buffer storage (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * Helper to resolve uploaded file from either Multer req.file or serverless-safe JSON Base64 body
 */
function extractFileObject(req: Request): Express.Multer.File | null {
  if (req.file) return req.file;

  if (req.body && req.body.base64Data) {
    const buffer = Buffer.from(req.body.base64Data, 'base64');
    const fileName = req.body.fileName || 'document.pdf';
    return {
      fieldname: 'document',
      originalname: fileName,
      encoding: '7bit',
      mimetype: req.body.mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
      buffer,
      size: buffer.length,
      destination: '',
      filename: fileName,
      path: '',
      stream: null as any
    };
  }

  return null;
}

/**
 * Health check endpoint
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok', service: 'DocuMind API Router', timestamp: new Date().toISOString() });
});

/**
 * Get Document by ID (Refresh persistence & direct routing)
 */
apiRouter.get('/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = documentService.getDocument(id);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: 'Document not found or session expired.'
    });
  }

  return res.status(200).json({
    success: true,
    data: doc
  });
});

/**
 * Store Document (Client cache sync)
 */
apiRouter.post('/documents/store', (req: Request, res: Response) => {
  const doc = req.body;
  if (!doc || !doc.id) {
    return res.status(400).json({ success: false, error: 'Invalid document payload' });
  }

  documentService.storeDocument(doc);
  return res.status(200).json({ success: true });
});

/**
 * Standalone Text Extraction Endpoint (Section 12 API Design)
 */
apiRouter.post('/extract', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const fileObj = extractFileObject(req);

    if (!fileObj) {
      return res.status(400).json({
        success: false,
        error: 'No document file received. Please attach a PDF or image file.'
      });
    }

    const extracted = await documentService.extractDocumentText(fileObj);

    return res.status(200).json({
      success: true,
      text: extracted.extractedText,
      metadata: {
        fileName: fileObj.originalname,
        fileSize: fileObj.size,
        mimeType: fileObj.mimetype,
        pageCount: extracted.pageCount,
        sourceType: extracted.documentType,
        wordCount: extracted.wordCount,
        characterCount: extracted.characterCount,
        estimatedReadingTimeMinutes: extracted.estimatedReadingTimeMinutes,
        extractionMethod: extracted.extractionMethod
      }
    });
  } catch (error: any) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size limit exceeded. Maximum file size allowed is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to extract text from document.'
    });
  }
});

/**
 * Standalone AI Summarization Endpoint (Section 12 API Design)
 */
apiRouter.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { text, length, fileName } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Document text is required to generate a summary.'
      });
    }

    const analysis = await aiService.analyzeDocument(text, fileName || 'Document');

    let targetSummary = analysis.summary.medium;
    if (length === 'short') targetSummary = analysis.summary.short;
    if (length === 'long') targetSummary = analysis.summary.long;

    return res.status(200).json({
      success: true,
      title: analysis.title,
      summary: analysis.summary,
      selectedSummary: targetSummary,
      keyPoints: analysis.keyPoints,
      improvements: analysis.improvements,
      insights: analysis.insights
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI summary.'
    });
  }
});

/**
 * Combined Upload & Document Processing Endpoint
 */
apiRouter.post('/upload', upload.single('document'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[API Upload] POST /api/upload request received.`);

    const fileObj = extractFileObject(req);

    if (!fileObj) {
      console.warn(`[API Upload Failure] No file in payload.`);
      return res.status(400).json({
        success: false,
        error: 'No document file received. Please attach a PDF or image file.'
      });
    }

    console.log(`[API Upload] Received file: '${fileObj.originalname}' | MIME: ${fileObj.mimetype} | Size: ${fileObj.size} bytes.`);

    const processedDoc = await documentService.processDocument(fileObj);

    console.log(`[API Upload Success] Document '${processedDoc.fileName}' (${processedDoc.id}) processed successfully.`);
    return res.status(200).json({
      success: true,
      data: processedDoc
    });
  } catch (error: any) {
    console.error(`[API Upload Failure Stage]: ${error.stage || 'General upload failure'} | Error: ${error.message || error}`);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size limit exceeded. Maximum file size allowed is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to process document upload.'
    });
  }
});
