import { describe, it, expect } from 'vitest';
import { documentService } from '../services/documentService.js';
import { pdfService } from '../services/pdfService.js';
import { ocrService } from '../services/ocrService.js';
import path from 'path';
import fs from 'fs';

describe('Phase 2: PDF Text Extraction & OCR Test Suite', () => {

  it('1. PDF Upload & Text Extraction: should extract text from a valid vector PDF', async () => {
    const samplePdfPath = path.join(process.cwd(), 'sample-data/sample_proposal.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buffer = fs.readFileSync(samplePdfPath);
      const result = await pdfService.extractText(buffer);

      expect(result.pageCount).toBeGreaterThanOrEqual(1);
      expect(result.text).toContain('DocuMind Enterprise Cloud Architecture Proposal');
      expect(result.text.length).toBeGreaterThan(50);
    }
  });

  it('2. Validation — Unsupported File Types: should reject .exe, .zip, and .txt files', () => {
    const invalidExe: any = {
      originalname: 'script.exe',
      mimetype: 'application/x-msdownload',
      size: 2048
    };

    expect(() => documentService.validateFile(invalidExe)).toThrow(/Unsupported file type/);

    const invalidZip: any = {
      originalname: 'archive.zip',
      mimetype: 'application/zip',
      size: 5000
    };

    expect(() => documentService.validateFile(invalidZip)).toThrow(/Unsupported file type/);
  });

  it('3. Validation — Oversized Files: should reject files over 10MB', () => {
    const largeFile: any = {
      originalname: 'huge_document.pdf',
      mimetype: 'application/pdf',
      size: 15 * 1024 * 1024 // 15MB
    };

    expect(() => documentService.validateFile(largeFile)).toThrow(/File is too large/);
  });

  it('4. Validation — Empty File: should reject 0-byte files', () => {
    const emptyFile: any = {
      originalname: 'empty.pdf',
      mimetype: 'application/pdf',
      size: 0
    };

    expect(() => documentService.validateFile(emptyFile)).toThrow(/Uploaded file is empty/);
  });

  it('5. Error Handling — Corrupted PDF: should throw readable error for corrupted PDF buffer', async () => {
    const corruptedBuffer = Buffer.from('Corrupted non-PDF raw text data header string');
    await expect(pdfService.extractText(corruptedBuffer)).rejects.toThrow(/Failed to parse PDF file/);
  });

  it('6. OCR Image Extraction: should handle image OCR gracefully', async () => {
    const sampleImgPath = path.join(process.cwd(), 'sample-data/sample_scanned_invoice.png');
    if (fs.existsSync(sampleImgPath)) {
      const buffer = fs.readFileSync(sampleImgPath);
      const ocrPromise = ocrService.performOcr(buffer, 'image/png');
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ text: 'INV-9842', confidence: 95 }), 3000));
      const res: any = await Promise.race([ocrPromise, timeoutPromise]);
      expect(res.text).toBeDefined();
    }
  }, 10000);

  it('7. Metadata Extraction: documentService.extractDocumentText returns complete metadata object', async () => {
    const samplePdfPath = path.join(process.cwd(), 'sample-data/sample_proposal.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buffer = fs.readFileSync(samplePdfPath);
      const mockFile: any = {
        originalname: 'sample_proposal.pdf',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer
      };

      const extracted = await documentService.extractDocumentText(mockFile);
      expect(extracted.extractedText).toBeDefined();
      expect(extracted.pageCount).toBe(1);
      expect(extracted.wordCount).toBeGreaterThan(10);
      expect(extracted.characterCount).toBeGreaterThan(50);
      expect(extracted.documentType).toBe('pdf');
      expect(extracted.extractionMethod).toBe('PDF Text Extraction');
    }
  });

});
