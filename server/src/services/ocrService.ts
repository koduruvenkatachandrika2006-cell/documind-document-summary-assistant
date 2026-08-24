import { createWorker } from 'tesseract.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
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

    console.warn(`[OcrService Warning] Local traineddata asset not found in candidate paths. Falling back to HTTP CDN...`);
    return 'https://tessdata.projectnaptha.com/4.0.0_best';
  }

  /**
   * Fast downscaling and binarization for instant Tesseract recognition.
   */
  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      const img = await loadImage(buffer);
      const maxDim = 800; // Optimal resolution for fast single-pass OCR
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Binarization for high contrast & sub-second Tesseract recognition
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        const val = gray > 140 ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      return canvas.toBuffer('image/png');
    } catch (err) {
      console.warn('[OcrService Image Preprocessing Warning]', err);
      return buffer;
    }
  }

  /**
   * Attempts cloud Vision OCR via Gemini 1.5 Flash if API key is present.
   */
  private async tryGeminiVisionOcr(imageBuffer: Buffer, mimeType: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
      console.log('[OcrService] Attempting fast Gemini Vision OCR...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: imageBuffer.toString('base64')
          }
        },
        'Extract and return all visible text in this document image verbatim. Return only the extracted text without any commentary or code blocks.'
      ]);

      const rawText = result.response.text();
      const cleaned = cleanExtractedText(rawText);
      if (cleaned && cleaned.trim().length > 10) {
        console.log(`[OcrService] Gemini Vision OCR succeeded (${cleaned.length} chars extracted).`);
        return cleaned;
      }
    } catch (err: any) {
      console.warn('[OcrService] Gemini Vision OCR unavailable, switching to local fast Tesseract path:', err.message || err);
    }
    return null;
  }

  /**
   * Performs Optical Character Recognition on an image buffer (PNG, JPG, JPEG).
   * Uses Gemini Vision or fast binarized Tesseract with strict worker lifecycle termination.
   */
  public async performOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    console.log(`[OcrService] Starting OCR recognition (Buffer size: ${imageBuffer.length} bytes, MIME: ${mimeType})...`);

    // 1. Try Gemini Vision for sub-second cloud OCR if configured
    const visionText = await this.tryGeminiVisionOcr(imageBuffer, mimeType);
    if (visionText) {
      return {
        text: visionText,
        confidence: 95
      };
    }

    // 2. Fast local Tesseract OCR with downsampling & single-pass PSM
    const timeoutMs = 15000;
    let worker: any = null;

    try {
      const optimizedBuffer = await this.preprocessImage(imageBuffer);
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
          tessedit_pageseg_mode: '6', // PSM_SINGLE_BLOCK — 4x faster single pass
          tessjs_create_pdf: '0',
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
          tessjs_create_box: '0',
          tessjs_create_unlv: '0',
          tessjs_create_osd: '0'
        });

        const { data } = await worker.recognize(optimizedBuffer);
        return data;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Scanned document OCR processing timed out. Please upload a smaller or clearer image.")), timeoutMs);
      });

      const data: any = await Promise.race([ocrTask, timeoutPromise]);

      const cleaned = cleanExtractedText(data.text);
      
      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error("We couldn't detect readable text in this image. Please upload a clearer document with visible text.");
      }

      console.log(`[OcrService] Fast Tesseract OCR recognition succeeded (${cleaned.length} chars extracted).`);
      return {
        text: cleaned,
        confidence: Math.round(data.confidence || 85)
      };
    } catch (error: any) {
      console.error(`[OcrService Exception] ${error.message || error}`);
      throw new Error(error.message || 'Scanned document OCR could not be completed within execution limits. Please upload a clearer image.');
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
