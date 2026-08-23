import { describe, it, expect } from 'vitest';
import { enforceWordCount, calculateWordCount } from '../utils/textHelpers.js';
import { aiService } from '../services/aiService.js';

describe('Word Count Boundary & Sentence Punctuation Verification', () => {

  const longSampleText = `
Executive Overview:
DocuMind Enterprise Cloud Architecture Proposal provides a comprehensive blueprint for transforming unstructured business documentation into evidence-grounded AI intelligence. The architecture decouples multi-format file ingestion, optical character recognition (OCR), structured AI analysis, and web dashboard presentation. Native PDF parsing processes vector documents while Tesseract OCR processes scanned images and multi-page forms. Extracted text flows through a hybrid chunk ranking engine that computes semantic relevance, keyword frequency, and document section headers.

Core Architecture & Technical Specifications:
The backend architecture is built with Node.js, Express, and TypeScript, featuring strict input validation and zero-downtime fallback mechanisms. All upload buffers are processed in-memory and discarded immediately after response generation to protect sensitive customer data. Cryptographic SSL/TLS encryption secures data in transit, while AES-256 encryption protects cached data at rest. The platform guarantees a 99.99% operational uptime Service Level Agreement (SLA) across high-throughput enterprise API environments.

Financial Allocation & Implementation Milestones:
The total project investment is $250,000 across a 12-month implementation lifecycle. Phase 1 foundation accounts for $50,000, Phase 2 document parsing accounts for $75,000, Phase 3 AI summarization accounts for $75,000, and Phase 4 production deployment accounts for $50,000. Project governance relies on bi-weekly sprint reviews, automated integration testing, and strict compliance audits.

Operational Risk Management & Compliance:
System operations adhere to ISO-27001 and SOC-2 Type II compliance standards. Disaster recovery procedures include multi-region failover automation with a Recovery Time Objective (RTO) of under 15 minutes and a Recovery Point Objective (RPO) of zero data loss. Disaster recovery simulations are conducted quarterly to verify system resilience. Stakeholder reporting includes weekly progress dashboards and automated SLA monitoring.
`.repeat(3);

  it('verifies Short summary is strictly <= 120 words and ends at a complete sentence', async () => {
    const analysis = await aiService.analyzeDocument(longSampleText, 'test.pdf');
    const words = calculateWordCount(analysis.summary.short);

    expect(words).toBeGreaterThanOrEqual(80);
    expect(words).toBeLessThanOrEqual(120);
    expect(analysis.summary.short.trim()).toMatch(/[.!?]$/);
  });

  it('verifies Medium summary is strictly <= 250 words and ends at a complete sentence', async () => {
    const analysis = await aiService.analyzeDocument(longSampleText, 'test.pdf');
    const words = calculateWordCount(analysis.summary.medium);

    expect(words).toBeGreaterThanOrEqual(150);
    expect(words).toBeLessThanOrEqual(250);
    expect(analysis.summary.medium.trim()).toMatch(/[.!?]$/);
  });

  it('verifies Long summary is strictly <= 450 words and ends at a complete sentence', async () => {
    const analysis = await aiService.analyzeDocument(longSampleText, 'test.pdf');
    const words = calculateWordCount(analysis.summary.long);

    expect(words).toBeGreaterThanOrEqual(300);
    expect(words).toBeLessThanOrEqual(450);
    expect(analysis.summary.long.trim()).toMatch(/[.!?]$/);
  });

  it('verifies enforceWordCount never exceeds maxWords even for oversized input', () => {
    const hugeText = "Sentence word count test sentence. ".repeat(100); // ~500 words
    
    const shortEnforced = enforceWordCount(hugeText, 80, 120);
    expect(calculateWordCount(shortEnforced)).toBeLessThanOrEqual(120);
    expect(shortEnforced.trim()).toMatch(/[.!?]$/);

    const medEnforced = enforceWordCount(hugeText, 150, 250);
    expect(calculateWordCount(medEnforced)).toBeLessThanOrEqual(250);
    expect(medEnforced.trim()).toMatch(/[.!?]$/);

    const longEnforced = enforceWordCount(hugeText, 300, 450);
    expect(calculateWordCount(longEnforced)).toBeLessThanOrEqual(450);
    expect(longEnforced.trim()).toMatch(/[.!?]$/);
  });

});
