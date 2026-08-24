import { createWorker } from 'tesseract.js';
import os from 'os';
import path from 'path';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  /**
   * Performs Optical Character Recognition on an image buffer (PNG, JPG, JPEG).
   * Configured specifically for Vercel Serverless Functions with writable /tmp caching.
   */
  public async performOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    console.log(`[OcrService] Starting OCR recognition (Buffer size: ${imageBuffer.length} bytes, MIME: ${mimeType})...`);

    let worker: any = null;
    try {
      // Use /tmp directory for Vercel serverless writable filesystem access
      const tempCacheDir = path.join(os.tmpdir(), 'tesseract-cache');

      worker = await createWorker('eng', 1, {
        cachePath: tempCacheDir,
        logger: () => {},
        errorHandler: (err: any) => console.error('[OcrService Worker Error]', err)
      });

      const { data } = await worker.recognize(imageBuffer);
      
      try {
        await worker.terminate();
      } catch (_) {}

      const cleaned = cleanExtractedText(data.text);
      
      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error("We couldn't detect readable text in this image. Please upload a clearer document with visible text.");
      }

      console.log(`[OcrService] OCR recognition succeeded (${cleaned.length} chars extracted).`);
      return {
        text: cleaned,
        confidence: Math.round(data.confidence || 0)
      };
    } catch (error: any) {
      if (worker) {
        try {
          await worker.terminate();
        } catch (_) {}
      }

      console.error(`[OcrService Exception] ${error.message || error}`);

      if (error.message && error.message.includes("couldn't detect readable text")) {
        throw error;
      }

      // Return friendly Vercel-safe error message
      throw new Error('Scanned document OCR could not be completed. Please try another image.');
    }
  }
}

export const ocrService = new OcrService();
