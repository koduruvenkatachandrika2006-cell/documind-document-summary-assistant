import { createWorker } from 'tesseract.js';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  /**
   * Performs Optical Character Recognition on an image buffer (PNG, JPG, JPEG).
   */
  public async performOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    let worker;
    try {
      // Initialize Tesseract worker for English language recognition
      worker = await createWorker('eng');
      
      const { data } = await worker.recognize(imageBuffer);
      await worker.terminate();

      const cleaned = cleanExtractedText(data.text);
      
      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error("We couldn't detect readable text in this image. Please upload a clearer document with visible text.");
      }

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
      if (error.message && error.message.includes("couldn't detect readable text")) {
        throw error;
      }
      throw new Error(`OCR Processing failed: ${error.message || 'Unable to scan image characters'}`);
    }
  }
}

export const ocrService = new OcrService();
