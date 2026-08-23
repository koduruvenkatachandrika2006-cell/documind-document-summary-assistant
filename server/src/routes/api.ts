import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/documentService.js';
import { aiService } from '../services/aiService.js';
import { sanitizePrivacyInfo } from '../utils/textHelpers.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10) // 10MB limit
  }
});

export const apiRouter = Router();

/**
 * Health check endpoint
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DocuMind API',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

/**
 * Get Document by ID (Refresh & Direct URL persistence)
 */
apiRouter.get('/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = documentService.getDocument(id);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file received. Please attach a PDF or image file.'
      });
    }

    const extracted = await documentService.extractDocumentText(req.file);

    return res.status(200).json({
      success: true,
      text: extracted.extractedText,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file received. Please attach a PDF or image file.'
      });
    }

    const processedDoc = await documentService.processDocument(req.file);

    return res.status(200).json({
      success: true,
      data: processedDoc
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
      error: error.message || 'Failed to process document upload.'
    });
  }
});
