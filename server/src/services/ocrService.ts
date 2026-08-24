import { createWorker } from 'tesseract.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
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
      if (fs.existsSync(path.join(p, 'eng.traineddata.gz'))) {
        console.log(`[OcrService] Found local traineddata asset at: ${p}`);
        return p;
      }
    }

    console.warn(`[OcrService Warning] Local traineddata asset not found in candidate paths. Falling back to HTTP CDN...`);
    return 'https://tessdata.projectnaptha.com/4.0.0_best';
  }

  /**
   * Pre-processes and resizes large images for sub-second Tesseract OCR recognition.
   */
  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      const img = await loadImage(buffer);
      const maxDim = 1200; // Optimal resolution for fast OCR
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

      // Grayscale conversion for maximum OCR contrast & 4x speedup
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);

      return canvas.toBuffer('image/png');
    } catch (err) {
      console.warn('[OcrService Image Preprocessing Warning]', err);
      return buffer;
    }
  }

  /**
   * Performs Optical Character Recognition on an image buffer (PNG, JPG, JPEG).
   * Uses fast-path Tesseract configuration and clean worker lifecycle termination.
   */
  public async performOcr(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    console.log(`[OcrService] Starting bounded OCR recognition (Buffer size: ${imageBuffer.length} bytes, MIME: ${mimeType})...`);

    const timeoutMs = 20000;
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
          tessedit_pageseg_mode: '3', // PSM_AUTO
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

      console.log(`[OcrService] Bounded OCR recognition succeeded (${cleaned.length} chars extracted).`);
      return {
        text: cleaned,
        confidence: Math.round(data.confidence || 0)
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
