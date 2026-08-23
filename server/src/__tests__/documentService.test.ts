import { describe, it, expect } from 'vitest';
import { documentService } from '../services/documentService.js';
import { pdfService } from '../services/pdfService.js';
import { aiService } from '../services/aiService.js';
import { generateHeuristicAnalysis, calculateWordCount, cleanExtractedText, classifyDocument, enforceWordCount, findGroundedAnswer } from '../utils/textHelpers.js';
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

  it('should retrieve grounded answers for relevant Q&A and return not found for unsupported queries', async () => {
    const docText = `Chandrika Cover Letter for Bain Capability Network.
Application for Quantitative Analytics Position.
Technical Skills: Machine Learning, Python, Statistical Analysis, Predictive Modeling.
Project Experience: Conducted exploratory data analysis and built machine learning pipelines.
Budget and Financial Metrics: Allocated $150,000 project budget with 99.99% API uptime SLA requirement.`;

    // Test 1: Primary goal / conclusion
    const ans1 = await aiService.answerQuestion(docText, "What is the primary goal or conclusion?");
    expect(ans1).not.toContain("couldn't find");

    // Test 2: Key objectives
    const ans2 = await aiService.answerQuestion(docText, "What are the key objectives?");
    expect(ans2).not.toContain("couldn't find");

    // Test 3: Technologies
    const ans3 = await aiService.answerQuestion(docText, "What technologies or technical areas are mentioned?");
    expect(ans3).not.toContain("couldn't find");
    expect(ans3.toLowerCase()).toContain("machine learning");

    // Test 4: Security / Compliance
    const ans4 = await aiService.answerQuestion(docText, "What security or compliance requirements are mentioned?");
    expect(ans4).not.toContain("couldn't find");
    expect(ans4.toLowerCase()).toContain("99.99%");

    // Test 5: Numbers or metrics
    const ans5 = await aiService.answerQuestion(docText, "What are the important numbers or metrics?");
    expect(ans5).not.toContain("couldn't find");
    expect(ans5.toLowerCase()).toContain("150,000");

    // Test 6: Unsupported question (Capital of France)
    const ans6 = await aiService.answerQuestion(docText, "What is the capital of France?");
    expect(ans6).toContain("couldn't find that information");
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
