import { createWorker } from 'tesseract.js';
import os from 'os';
import path from 'path';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  private workerPromise: Promise<any> | null = null;

  /**
   * Gets or initializes a cached Tesseract worker instance for fast serverless execution.
   */
  private async getWorker(): Promise<any> {
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        const tempCacheDir = path.join(os.tmpdir(), 'tesseract-cache');
        const worker = await createWorker('eng', 1, {
          cachePath: tempCacheDir,
          logger: () => {},
          errorHandler: (err: any) => console.error('[OcrService Worker Error]', err)
        });
        return worker;
      })().catch(err => {
        this.workerPromise = null;
        throw err;
      });
    }
    return this.workerPromise;
  }

  /**
   * Performs Optical Character Recognition on an image buffer (PNG, JPG, JPEG).
   * Reuses initialized worker across warm serverless invocations for fast response times.
   */
  public async performOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    console.log(`[OcrService] Starting OCR recognition (Buffer size: ${imageBuffer.length} bytes, MIME: ${mimeType})...`);

    const timeoutMs = 6000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Scanned document OCR processing timed out. Please upload a clearer image or use a PDF file.")), timeoutMs);
    });

    try {
      const ocrTask = (async () => {
        const worker = await this.getWorker();
        const { data } = await worker.recognize(imageBuffer);
        return data;
      })();

      const data: any = await Promise.race([ocrTask, timeoutPromise]);

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
      console.error(`[OcrService Exception] ${error.message || error}`);

      // Invalidate worker promise on fatal failure / timeout
      this.workerPromise = null;

      throw new Error(error.message || 'Scanned document OCR could not be completed. Please upload a clearer image with visible text.');
    }
  }
}

export const ocrService = new OcrService();
