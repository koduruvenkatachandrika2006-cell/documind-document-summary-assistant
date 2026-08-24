import pdfParse from 'pdf-parse';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { ocrService } from './ocrService.js';
import { cleanExtractedText } from '../utils/textHelpers.js';

import zlib from 'zlib';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: any;
  extractionMethod?: string;
}

export class PdfService {
  /**
   * Decompresses raw PDF Flate streams to extract string literals when pdf-parse encounters encoding issues
   */
  private extractRawStreamText(pdfBuffer: Buffer): string {
    try {
      let combined = '';
      const str = pdfBuffer.toString('binary');
      const matches = str.match(/stream[\r\n]+([\s\S]*?)endstream/gi);
      if (matches) {
        for (const m of matches) {
          const content = m.replace(/^stream[\r\n]+/, '').replace(/[\r\n]+endstream$/, '');
          const buf = Buffer.from(content, 'binary');
          let decompressed: Buffer | null = null;
          try {
            decompressed = zlib.inflateSync(buf);
          } catch (_) {
            try {
              decompressed = zlib.unzipSync(buf);
            } catch (e) {}
          }
          const textChunk = (decompressed || buf).toString('utf-8');
          const strings = textChunk.match(/\(([^()]{2,120})\)/g);
          if (strings) {
            for (const s of strings) {
              const cleanStr = s.slice(1, -1).replace(/\\[nrtbf()]/g, ' ').trim();
              if (cleanStr.length > 2 && /[a-zA-Z0-9]/.test(cleanStr)) {
                combined += cleanStr + ' ';
              }
            }
          }
        }
      }
      return cleanExtractedText(combined);
    } catch (e) {
      return '';
    }
  }

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
   * Handles vector PDFs, scanned image-only PDFs, and raw PDF streams with zero sample-data leakage.
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
      if (cleaned && cleaned.trim().length > 10) {
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
      const normalizedBytes = await pdfDoc.save();
      const normalizedBuffer = Buffer.from(normalizedBytes);
      const data = await pdfParse(normalizedBuffer);
      const cleaned = cleanExtractedText(data.text);
      if (cleaned && cleaned.trim().length > 10) {
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

    // 4. Try raw Flate stream text extraction
    const rawStreamText = this.extractRawStreamText(pdfBuffer);
    if (rawStreamText && rawStreamText.trim().length > 10) {
      console.log(`[PdfService] PDF raw stream text extraction succeeded (${pageCount} pages, ${rawStreamText.length} chars).`);
      return {
        text: rawStreamText,
        pageCount,
        info: {},
        extractionMethod: 'PDF Stream Text Extraction'
      };
    }

    // 5. Scanned PDF handling: Extract embedded image streams and run OCR on them directly
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
      if (cleanedOcr && cleanedOcr.trim().length > 5) {
        console.log(`[PdfService] Scanned PDF OCR extraction succeeded (${pageCount} pages, ${cleanedOcr.length} chars).`);
        return {
          text: cleanedOcr,
          pageCount,
          info: {},
          extractionMethod: 'Scanned PDF OCR'
        };
      }
    }

    // 6. Truthful Extraction Response: Return document metadata without fake sample data
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
