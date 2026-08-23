import { describe, it, expect } from 'vitest';
import { documentService } from '../services/documentService.js';
import { pdfService } from '../services/pdfService.js';
import { aiService } from '../services/aiService.js';
import { generateHeuristicAnalysis, calculateWordCount, cleanExtractedText, classifyDocument, enforceWordCount } from '../utils/textHelpers.js';
import fs from 'fs';
import path from 'path';

describe('Document Processing & Validation Engine Tests', () => {

  it('should calculate accurate word count and clean text', () => {
    const raw = "  Hello   World!\r\n\r\nThis is a   test document.  ";
    const cleaned = cleanExtractedText(raw);
    expect(cleaned).toBe("Hello World!\n\nThis is a test document.");
    expect(calculateWordCount(cleaned)).toBe(7);
  });

  it('should validate allowed file extensions and reject oversized files', () => {
    const invalidFile: any = {
      originalname: 'malicious_script.exe',
      mimetype: 'application/x-msdownload',
      size: 1024
    };

    expect(() => documentService.validateFile(invalidFile)).toThrow('Unsupported file type');

    const oversizedFile: any = {
      originalname: 'large_document.pdf',
      mimetype: 'application/pdf',
      size: 50 * 1024 * 1024 // 50MB
    };

    expect(() => documentService.validateFile(oversizedFile)).toThrow('File is too large');
  });

  it('should classify document categories accurately', () => {
    expect(classifyDocument('Application for data analyst role. Dear Hiring Manager, Sincerely', 'cover_letter.pdf')).toBe('Cover Letter');
    expect(classifyDocument('INVOICE #9842 Total Due $2,905.20 Net 30', 'invoice.pdf')).toBe('Invoice');
    expect(classifyDocument('Software system architecture and database interface implementation', 'tech_spec.pdf')).toBe('Technical Document');
  });

  it('should enforce strict summary word count boundaries for Short, Medium, and Long modes', () => {
    const text = `Overview:
This document is a formal cover letter submitted for a data science and quantitative analytics position at Bain Capability Network. The candidate presents technical qualifications in data science, predictive modeling, machine learning, and statistical analysis.

Core Focus & Project Experience:
The candidate details practical experience conducting exploratory data analysis, constructing data pipelines, and translating technical insights into actionable consulting recommendations.

Notable Details & Value Contribution:
The applicant emphasizes analytical problem-solving rigor, cross-functional collaboration, and strong enthusiasm to contribute directly to Bain Capability Network client engagements.`;

    const shortSummary = enforceWordCount(text, 80, 120);
    const shortWords = calculateWordCount(shortSummary);
    expect(shortWords).toBeGreaterThanOrEqual(80);
    expect(shortWords).toBeLessThanOrEqual(120);

    const mediumSummary = enforceWordCount(text, 150, 250);
    const medWords = calculateWordCount(mediumSummary);
    expect(medWords).toBeGreaterThanOrEqual(150);
    expect(medWords).toBeLessThanOrEqual(250);

    const longSummary = enforceWordCount(text, 300, 450);
    const longWords = calculateWordCount(longSummary);
    expect(longWords).toBeGreaterThanOrEqual(300);
    expect(longWords).toBeLessThanOrEqual(450);
  });

  it('should generate document-specific improvement suggestions starting with polite language', async () => {
    const docText = `Chandrika Cover Letter for Bain Capability Network.
Application for Quantitative Analytics Position.
Dear Hiring Manager, I am writing to apply for the position.
Technical Skills: Machine Learning, Python, Statistical Analysis, Predictive Modeling.
Project Experience: Conducted exploratory data analysis and built machine learning pipelines.`;

    const res = await aiService.analyzeDocument(docText, 'cover_letter.pdf');
    expect(res.improvements).toBeDefined();
    expect(res.improvements.length).toBeGreaterThanOrEqual(2);
    
    // Check polite phrasing ("Consider...", "You could...", "It may help to...")
    const suggestionsText = res.improvements.map(i => i.suggestion).join(' ');
    expect(suggestionsText.toLowerCase()).toMatch(/consider|could|it may help/);
  });

  it('should parse real PDF file buffer successfully', async () => {
    const pdfPath = path.join(process.cwd(), 'sample-data/sample_proposal.pdf');
    if (fs.existsSync(pdfPath)) {
      const buffer = fs.readFileSync(pdfPath);
      const res = await pdfService.extractText(buffer);
      expect(res.text).toContain('DocuMind Enterprise Cloud Architecture Proposal');
      expect(res.pageCount).toBe(1);
    }
  });

});
