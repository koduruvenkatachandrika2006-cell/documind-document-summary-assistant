import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: any;
}

export class PdfService {
  /**
   * Extracts clean text and metadata from a PDF buffer using serverless-safe pdf-parse and pdf-lib.
   * Pure JavaScript implementation with ZERO DOMMatrix/Path2D/Canvas browser dependencies.
   */
  public async extractText(pdfBuffer: Buffer): Promise<PdfExtractionResult> {
    console.log(`[PdfService] Starting PDF text extraction (Buffer size: ${pdfBuffer.length} bytes)...`);

    // 1. Validate PDF structure using pdf-lib to ensure it is a valid PDF
    let pdfDoc;
    let pageCount = 1;
    try {
      pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount() || 1;
    } catch (pdfLibErr: any) {
      console.warn(`[PdfService] pdf-lib validation notice: ${pdfLibErr.message}`);
      throw new Error(`Failed to parse PDF file: ${pdfLibErr.message || 'Corrupted or invalid PDF file structure'}`);
    }

    // 2. Try pdf-parse on raw buffer
    try {
      const data = await pdfParse(pdfBuffer);
      const cleaned = cleanExtractedText(data.text);
      if (cleaned && cleaned.trim().length > 0) {
        console.log(`[PdfService] PDF text extraction succeeded on raw buffer (${data.numpages || pageCount} pages, ${cleaned.length} chars).`);
        return {
          text: cleaned,
          pageCount: data.numpages || pageCount,
          info: data.info || {}
        };
      }
    } catch (rawErr: any) {
      console.warn(`[PdfService] pdf-parse raw notice: ${rawErr.message}. Retrying on normalized buffer...`);
    }

    // 3. Try pdf-parse on pdf-lib normalized/re-saved buffer (fixes bad XRef entries)
    try {
      const normalizedBytes = await pdfDoc.save();
      const normalizedBuffer = Buffer.from(normalizedBytes);
      const data = await pdfParse(normalizedBuffer);
      const cleaned = cleanExtractedText(data.text);
      if (cleaned && cleaned.trim().length > 0) {
        console.log(`[PdfService] PDF text extraction succeeded on normalized buffer (${data.numpages || pageCount} pages, ${cleaned.length} chars).`);
        return {
          text: cleaned,
          pageCount: data.numpages || pageCount,
          info: data.info || {}
        };
      }
    } catch (normErr: any) {
      console.warn(`[PdfService] pdf-parse normalized notice: ${normErr.message}`);
    }

    // 4. If valid PDF structure but no text extracted, signal scanned document for OCR fallback
    throw new Error('PDF contains no selectable text. It may be a scanned document requiring OCR.');
  }
}

export const pdfService = new PdfService();
