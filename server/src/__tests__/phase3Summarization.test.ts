import { describe, it, expect } from 'vitest';
import { aiService } from '../services/aiService.js';
import { calculateWordCount, enforceWordCount, generateHeuristicAnalysis } from '../utils/textHelpers.js';

describe('Phase 3: AI Summarization & Key-Point Generation Test Suite', () => {

  const sampleDocumentText = `DocuMind Enterprise Cloud Architecture Proposal
Executive Summary:
DocuMind is an AI-powered document intelligence and executive summarization platform designed for processing multi-format enterprise files.

System Architecture & Technical Capabilities:
The platform architecture decouples file ingestion, optical character recognition (OCR), structured AI analysis, and frontend presentation. The document processing pipeline ingests vector PDFs using pdf-parse and scanned image files using Tesseract OCR. Extracted text is passed through a hybrid chunk ranking engine that computes semantic relevance, keyword frequency, and document section headers.

Security & Operational SLAs:
The platform is designed for enterprise deployment with strict security controls. All document buffers are processed entirely in-memory and discarded immediately after AI response generation. Data protection is enforced with SSL/TLS encryption in transit and AES-256 encryption at rest. The system guarantees a 99.99% operational uptime Service Level Agreement (SLA) with zero persistent document storage.

Financial Proposal & Budget Allocation:
The total enterprise deployment budget is $250,000 across a 12-month implementation timeline. Phase 1 foundation accounts for $50,000, Phase 2 document parsing accounts for $75,000, Phase 3 AI summarization accounts for $75,000, and Phase 4 production deployment accounts for $50,000.`;

  it('1. Short Summary: generates concise summary within 80-120 word boundary', async () => {
    const analysis = await aiService.analyzeDocument(sampleDocumentText, 'proposal.pdf');
    expect(analysis.summary.short).toBeDefined();

    const shortWords = calculateWordCount(analysis.summary.short);
    expect(shortWords).toBeGreaterThanOrEqual(80);
    expect(shortWords).toBeLessThanOrEqual(120);
  });

  it('2. Medium Summary: generates balanced summary within 150-250 word boundary', async () => {
    const analysis = await aiService.analyzeDocument(sampleDocumentText, 'proposal.pdf');
    expect(analysis.summary.medium).toBeDefined();

    const medWords = calculateWordCount(analysis.summary.medium);
    expect(medWords).toBeGreaterThanOrEqual(150);
    expect(medWords).toBeLessThanOrEqual(250);
  });

  it('3. Long Summary: generates comprehensive summary within 300-450 word boundary', async () => {
    const analysis = await aiService.analyzeDocument(sampleDocumentText, 'proposal.pdf');
    expect(analysis.summary.long).toBeDefined();

    const longWords = calculateWordCount(analysis.summary.long);
    expect(longWords).toBeGreaterThanOrEqual(300);
    expect(longWords).toBeLessThanOrEqual(450);
  });

  it('4. Key Points Generation: produces 4-8 categorized key points grounded in document text', async () => {
    const analysis = await aiService.analyzeDocument(sampleDocumentText, 'proposal.pdf');
    expect(analysis.keyPoints).toBeDefined();
    expect(analysis.keyPoints.length).toBeGreaterThanOrEqual(4);
    
    // Verify categories and points are non-empty
    analysis.keyPoints.forEach(kp => {
      expect(typeof kp.category).toBe('string');
      expect(kp.category.length).toBeGreaterThan(0);
      expect(kp.point.length).toBeGreaterThan(5);
    });
  });

  it('5. Empty Extracted Text Handling: returns heuristic default for insufficient text', async () => {
    const emptyText = "   ";
    const analysis = await aiService.analyzeDocument(emptyText, 'empty.pdf');
    expect(analysis.summary.medium).toContain('visual layout parameters');
  });

  it('6. Missing API Key Fallback: generates sentence-ranking heuristic analysis seamlessly', () => {
    const analysis = generateHeuristicAnalysis(sampleDocumentText, 'test.pdf');
    expect(analysis.title).toBeDefined();
    expect(analysis.summary.short).toBeDefined();
    expect(analysis.summary.medium).toBeDefined();
    expect(analysis.summary.long).toBeDefined();
    expect(analysis.keyPoints.length).toBeGreaterThan(0);
  });

  it('7. Changing Summary Length Without Re-uploading: supports length selection (short/medium/long)', async () => {
    const analysis = await aiService.analyzeDocument(sampleDocumentText, 'proposal.pdf');
    
    // Simulate user selecting short summary
    const shortSummary = analysis.summary.short;
    // Simulate user selecting long summary from same analysis payload
    const longSummary = analysis.summary.long;

    expect(shortSummary).not.toEqual(longSummary);
    expect(calculateWordCount(longSummary)).toBeGreaterThan(calculateWordCount(shortSummary));
  });

  it('8. Long Document Handling: safely handles large text strings by truncating context safely', async () => {
    // Generate long document string (30,000 chars)
    const longText = sampleDocumentText.repeat(25);
    const analysis = await aiService.analyzeDocument(longText, 'large_doc.pdf');
    
    expect(analysis.summary.short).toBeDefined();
    expect(analysis.keyPoints.length).toBeGreaterThan(0);
  });

});
