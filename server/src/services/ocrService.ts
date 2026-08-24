import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cleanExtractedText } from '../utils/textHelpers.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  /**
   * Helper to resolve local langPath or fallback to fast CDN
   */
  private getLangPath(): string {
    const candidatePaths = [
      path.join(process.cwd(), 'server', 'src', 'assets'),
      path.join(process.cwd(), 'server', 'dist', 'assets'),
      path.join(process.cwd(), 'assets'),
      path.join(process.cwd(), 'dist', 'assets')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(path.join(p, 'eng.traineddata.gz')) || fs.existsSync(path.join(p, 'eng.traineddata'))) {
        console.log(`[OcrService] Found local traineddata asset at: ${p}`);
        return p;
      }
    }

    console.warn(`[OcrService Warning] Local traineddata asset not found in candidate paths. Falling back to fast HTTP CDN...`);
    return 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast';
  }

  /**
   * Attempts cloud Vision OCR via Gemini 1.5/2.0 Flash if GEMINI_API_KEY is present.
   */
  private async tryGeminiVisionOcr(imageBuffer: Buffer, mimeType: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OcrService] Attempting Gemini Vision OCR (${modelName})...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType || 'image/png',
              data: imageBuffer.toString('base64')
            }
          },
          'Extract and transcribe all visible text in this document image verbatim. Return only the extracted text without any commentary, markdown tags, or intro text.'
        ]);

        const rawText = result.response.text();
        const cleaned = cleanExtractedText(rawText);
        if (cleaned && cleaned.trim().length > 10) {
          console.log(`[OcrService] Gemini Vision OCR succeeded via ${modelName} (${cleaned.length} chars extracted).`);
          return cleaned;
        }
      } catch (err: any) {
        console.warn(`[OcrService] Gemini Vision OCR model ${modelName} notice:`, err.message || err);
      }
    }
    return null;
  }

  /**
   * Performs Optical Character Recognition on an image buffer (PNG, JPG, JPEG).
   * Uses Gemini Vision API or fast Tesseract WASM with bounded execution limit and zero-fail resilience.
   */
  public async performOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    console.log(`[OcrService] Starting OCR recognition (Buffer size: ${imageBuffer.length} bytes, MIME: ${mimeType})...`);

    // 1. Primary path: Gemini Vision Cloud API (sub-second execution)
    const visionText = await this.tryGeminiVisionOcr(imageBuffer, mimeType);
    if (visionText) {
      return {
        text: visionText,
        confidence: 95
      };
    }

    // 2. Secondary path: Fast local Tesseract OCR with 12s bounded timeout & worker cleanup
    const timeoutMs = 12000;
    let worker: any = null;

    try {
      const tempCacheDir = path.join(os.tmpdir(), 'tesseract-cache');
      const langPath = this.getLangPath();

      const ocrTask = (async () => {
        worker = await createWorker('eng', 1, {
          cachePath: tempCacheDir,
          langPath,
          logger: () => {},
          errorHandler: (err: any) => console.error('[OcrService Worker Error]', err)
        });

        await worker.setParameters({
          tessedit_pageseg_mode: '3', // PSM_AUTO
          tessjs_create_pdf: '0',
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
          tessjs_create_box: '0',
          tessjs_create_unlv: '0',
          tessjs_create_osd: '0'
        });

        const { data } = await worker.recognize(imageBuffer);
        return data;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Scanned document OCR processing bounded time limit reached.")), timeoutMs);
      });

      const data: any = await Promise.race([ocrTask, timeoutPromise]);
      const cleaned = cleanExtractedText(data.text);
      
      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error("No readable text detected in image.");
      }

      console.log(`[OcrService] Tesseract OCR recognition succeeded (${cleaned.length} chars extracted).`);
      return {
        text: cleaned,
        confidence: Math.round(data.confidence || 85)
      };
    } catch (error: any) {
      console.warn(`[OcrService Exception] ${error.message || error}`);
      throw new Error(error.message || 'Unable to extract readable text from this image document. Please upload a clearer image.');
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (_) {}
      }
    }
  }
}

export const ocrService = new OcrService();
