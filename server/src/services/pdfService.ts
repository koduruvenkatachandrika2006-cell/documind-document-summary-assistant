import pdfParse from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: any;
}

export class PdfService {
  /**
   * Extracts clean text and metadata from a PDF buffer.
   * Uses pdf-parse for zero-dependency Vercel Serverless compatibility with pdfjs-dist fallback.
   */
  public async extractText(pdfBuffer: Buffer): Promise<PdfExtractionResult> {
    console.log(`[PdfService] Starting PDF text extraction (Buffer size: ${pdfBuffer.length} bytes)...`);

    // 1. Try pdf-parse (Pure Node.js JS implementation, 100% Vercel Serverless ready)
    try {
      const data = await pdfParse(pdfBuffer);
      const cleaned = cleanExtractedText(data.text);

      if (cleaned && cleaned.trim().length > 0) {
        console.log(`[PdfService] pdf-parse succeeded (${data.numpages || 1} pages, ${cleaned.length} chars).`);
        return {
          text: cleaned,
          pageCount: data.numpages || 1,
          info: data.info || {}
        };
      }
    } catch (parseErr: any) {
      console.warn(`[PdfService] pdf-parse notice: ${parseErr.message}. Attempting pdfjs-dist fallback...`);
    }

    // 2. Fallback to pdfjs-dist if pdf-parse fails or returns empty
    try {
      const data = new Uint8Array(pdfBuffer);
      const loadingTask = pdfjsLib.getDocument({ data, disableFontFace: true });
      const pdfDocument = await loadingTask.promise;

      const pageCount = pdfDocument.numPages;
      let fullText = '';

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
      }

      const cleaned = cleanExtractedText(fullText);

      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('PDF contains no selectable text. It may be a scanned document requiring OCR.');
      }

      console.log(`[PdfService] pdfjs-dist succeeded (${pageCount} pages, ${cleaned.length} chars).`);
      return {
        text: cleaned,
        pageCount,
        info: {}
      };
    } catch (error: any) {
      if (error.message && error.message.includes('scanned document')) {
        throw error;
      }
      throw new Error(`Failed to parse PDF file: ${error.message || 'Corrupted or unreadable PDF file structure'}`);
    }
  }
}

export const pdfService = new PdfService();
