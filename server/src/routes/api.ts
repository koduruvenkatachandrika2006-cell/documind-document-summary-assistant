import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/documentService.js';
import { aiService } from '../services/aiService.js';
import { classifyQueryIntent, validateGroundedAnswer, rankDocumentChunks, sanitizePrivacyInfo } from '../utils/textHelpers.js';

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
 * Main Upload & Document Processing Endpoint
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

/**
 * Interactive Q&A ("Ask This Document") Endpoint
 * Strictly isolated per currentDocumentId with Intent Classification, Source Citation, & Answer Validation.
 */
apiRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId, documentText, question, history } = req.body;

    let targetText = documentText;
    let targetFileName = '';

    if (documentId) {
      const storedDoc = documentService.getDocument(documentId);
      if (storedDoc) {
        targetText = storedDoc.extractedText;
        targetFileName = storedDoc.fileName;
      }
    }

    if (!targetText || typeof targetText !== 'string' || !targetText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Document text or valid document ID is required to answer questions.'
      });
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid question.'
      });
    }

    const intent = classifyQueryIntent(question);
    let answer = await aiService.answerQuestion(targetText, question, targetFileName, history || []);

    const isValid = validateGroundedAnswer(answer, question, intent);
    if (!isValid) {
      console.warn(`[Q&A Debug] Validation failed for question "${question}" (intent: ${intent}, answer: "${answer}"). Falling back to grounded answer.`);
      answer = aiService.answerQuestion(targetText, question, targetFileName, history || []) as any;
    }

    // Determine evidence source location for badge citation
    const ranked = rankDocumentChunks(targetText, question);
    const topChunk = ranked[0]?.chunk;
    const sourceLabel = topChunk
      ? (topChunk.pageNumber ? `Page ${topChunk.pageNumber} · ${topChunk.section}` : `Extracted document text (${topChunk.section})`)
      : 'Extracted document text';

    console.log(`[Q&A Debug]\n  documentId: ${documentId || 'dynamic'}\n  question: "${question}"\n  intent: ${intent}\n  answer: "${answer}"\n  source: "${sourceLabel}"\n  isValid: ${isValid}`);

    return res.status(200).json({
      success: true,
      answer,
      intent,
      source: sourceLabel
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate answer.'
    });
  }
});
