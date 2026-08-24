import pdfParse from 'pdf-parse';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { ocrService } from './ocrService.js';
import { cleanExtractedText, validateExtractedText } from '../utils/textHelpers.js';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: any;
  extractionMethod?: string;
}

export class PdfService {
  /**
   * Helper to extract raw image stream buffers embedded inside scanned PDFs
   */
  private extractImagesFromPdf(pdfDoc: PDFDocument): Buffer[] {
    const images: Buffer[] = [];
    try {
      const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
      for (const [ref, obj] of indirectObjects) {
        if (obj instanceof PDFRawStream) {
          const subtype = obj.dict.get(PDFName.of('Subtype'));
          if (subtype && subtype.toString() === '/Image') {
            const imageBytes = obj.contents;
            if (imageBytes && imageBytes.length > 500) {
              images.push(Buffer.from(imageBytes));
            }
          }
        }
      }
    } catch (err) {
      console.warn('[PdfService] Image stream extraction notice:', err);
    }
    return images;
  }

  /**
   * Extracts clean text and metadata from a PDF buffer using serverless-safe pdf-parse and pdf-lib.
   * Strictly validates text quality using validateExtractedText to eliminate binary garbage and garbled streams.
   */
  public async extractText(pdfBuffer: Buffer): Promise<PdfExtractionResult> {
    console.log(`[PdfService] Starting PDF text extraction (Buffer size: ${pdfBuffer.length} bytes)...`);

    // 1. Validate PDF structure using pdf-lib (throws error for corrupted non-PDF files)
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
      if (cleaned && validateExtractedText(cleaned)) {
        console.log(`[PdfService] PDF text extraction succeeded on raw buffer (${data.numpages || pageCount} pages, ${cleaned.length} chars).`);
        return {
          text: cleaned,
          pageCount: data.numpages || pageCount,
          info: data.info || {},
          extractionMethod: 'PDF Text Extraction'
        };
      }
    } catch (rawErr: any) {
      console.warn(`[PdfService] pdf-parse raw notice: ${rawErr.message}. Retrying on normalized buffer...`);
    }

    // 3. Try pdf-parse on pdf-lib normalized/re-saved buffer
    try {
      const normalizedBytes = await pdfDoc.save({ useObjectStreams: false });
      const normalizedBuffer = Buffer.from(normalizedBytes);
      const data = await pdfParse(normalizedBuffer);
      const cleaned = cleanExtractedText(data.text);
      if (cleaned && validateExtractedText(cleaned)) {
        console.log(`[PdfService] PDF text extraction succeeded on normalized buffer (${data.numpages || pageCount} pages, ${cleaned.length} chars).`);
        return {
          text: cleaned,
          pageCount: data.numpages || pageCount,
          info: data.info || {},
          extractionMethod: 'PDF Text Extraction'
        };
      }
    } catch (normErr: any) {
      console.warn(`[PdfService] pdf-parse normalized notice: ${normErr.message}`);
    }

    // 4. Scanned PDF handling: Extract embedded image streams and run OCR on them directly
    console.log(`[PdfService] Scanned PDF detected (0 vector text). Extracting embedded image streams for OCR...`);
    const embeddedImages = this.extractImagesFromPdf(pdfDoc);
    
    if (embeddedImages.length > 0) {
      let ocrCombinedText = '';
      for (let i = 0; i < Math.min(embeddedImages.length, 5); i++) {
        try {
          const imgBuf = embeddedImages[i];
          const ocrRes = await ocrService.performOcr(imgBuf, 'image/jpeg');
          if (ocrRes.text && ocrRes.text.trim().length > 5) {
            ocrCombinedText += (ocrCombinedText ? '\n\n' : '') + ocrRes.text;
          }
        } catch (ocrImgErr: any) {
          console.warn(`[PdfService] OCR notice on embedded image ${i+1}:`, ocrImgErr.message || ocrImgErr);
        }
      }

      const cleanedOcr = cleanExtractedText(ocrCombinedText);
      if (cleanedOcr && validateExtractedText(cleanedOcr)) {
        console.log(`[PdfService] Scanned PDF OCR extraction succeeded (${pageCount} pages, ${cleanedOcr.length} chars).`);
        return {
          text: cleanedOcr,
          pageCount,
          info: {},
          extractionMethod: 'Scanned PDF OCR'
        };
      }
    }

    // 5. Truthful Extraction Response: Return document metadata without fake sample data or garbled binary
    console.log(`[PdfService] Scanned image-only PDF with no readable vector text detected (${pageCount} pages).`);
    return {
      text: `Scanned image-only PDF document containing ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}. No readable vector text layer was detected.`,
      pageCount,
      info: {},
      extractionMethod: 'Scanned PDF Processing'
    };
  }
}

export const pdfService = new PdfService();
