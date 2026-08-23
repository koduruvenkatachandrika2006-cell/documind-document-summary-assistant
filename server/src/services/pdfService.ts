import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: any;
}

export class PdfService {
  /**
   * Extracts clean text and metadata from a PDF buffer using pdfjs-dist legacy build for Node.js.
   * Emits page markers (e.g. --- Page X ---) to support accurate page-level evidence citation.
   */
  public async extractText(pdfBuffer: Buffer): Promise<PdfExtractionResult> {
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
