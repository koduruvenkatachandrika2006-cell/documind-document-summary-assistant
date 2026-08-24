import { describe, it, expect } from 'vitest';
import { classifyDocument, generateHeuristicAnalysis } from '../utils/textHelpers.js';

describe('Dynamic Document Classification & Content-Specific Analysis', () => {
  it('1. ATS Screenshot / Job Prompt: classifies correctly and generates ATS specific analysis without sample invoice data', () => {
    const text = `Based on the tone, language, and core values of leading tech companies, rewrite my resume summary and technical skills to align with industry standards for a Senior Full Stack Engineer role. Key responsibilities include designing scalable microservices and optimizing database query latency.`;
    
    const category = classifyDocument(text, 'ats_prompt_screenshot.png');
    expect(category).toBe('Job Description / ATS');

    const analysis = generateHeuristicAnalysis(text, 'ats_prompt_screenshot.png');
    expect(analysis.title).toContain('Job Description');
    expect(analysis.summary.medium).toContain('ATS');
    expect(analysis.summary.medium).not.toContain('INV-9842');
    expect(analysis.summary.medium).not.toContain('DocuMind Corporation');
    expect(analysis.summary.medium).not.toContain('Compute Node Cluster');
    expect(analysis.insights.domain).toBe('Job Description / ATS');
  });

  it('2. Invoice Upload: classifies as Invoice and extracts invoice relevant content', () => {
    const text = `ACME SUPPLIES INC. INVOICE #INV-4410 Date: 2026-08-20 Bill To: Tech Solutions LLC Subtotal: $1,200.00 Total Due: $1,200.00 Payment Terms: Net 15 Days`;
    
    const category = classifyDocument(text, 'acme_invoice.pdf');
    expect(category).toBe('Invoice');

    const analysis = generateHeuristicAnalysis(text, 'acme_invoice.pdf');
    expect(analysis.title).toContain('INV-4410');
    expect(analysis.summary.medium.toLowerCase()).toContain('invoice');
    expect(analysis.summary.medium).not.toContain('Compute Node Cluster');
    expect(analysis.insights.domain).toBe('Invoice');
  });

  it('3. Contract Document: classifies as Contract and generates legal contract analysis', () => {
    const text = `MASTER SERVICES AGREEMENT. This Agreement is entered into by and between Party A and Party B. Section 1. Term and Termination. Section 2. Confidentiality Covenants and Intellectual Property Rights. Section 3. Governing Law and Arbitration.`;
    
    const category = classifyDocument(text, 'services_agreement.pdf');
    expect(category).toBe('Contract');

    const analysis = generateHeuristicAnalysis(text, 'services_agreement.pdf');
    expect(analysis.title).toContain('Contract');
    expect(analysis.summary.medium.toLowerCase()).toContain('contractual');
    expect(analysis.summary.medium).not.toContain('INV-9842');
    expect(analysis.insights.domain).toBe('Contract');
  });

  it('4. Candidate Resume: classifies as Resume / CV and generates candidate specific analysis', () => {
    const text = `Koduru Venkata Chandrika
Email: candidate@example.com | LinkedIn: linkedin.com/in/chandrika
EDUCATION: Bachelor of Technology in Computer Science & Engineering
WORK EXPERIENCE: Software Engineer Intern. Built automated REST APIs and full-stack React dashboards.`;

    const category = classifyDocument(text, 'chandrika_resume.pdf');
    expect(category).toBe('Resume / CV');

    const analysis = generateHeuristicAnalysis(text, 'chandrika_resume.pdf');
    expect(analysis.title).toContain('Chandrika');
    expect(analysis.summary.medium.toLowerCase()).toContain('candidate');
    expect(analysis.summary.medium).not.toContain('INV-9842');
    expect(analysis.insights.domain).toBe('Resume / CV');
  });

  it('5. Proposal PDF: classifies as Proposal and generates proposal specific analysis', () => {
    const text = `DocuMind Enterprise Cloud Architecture Proposal. Executive Summary: Infrastructure modernization project to cut latency by 45%. Total Budget: $150,000. Target Completion: Q4 2026.`;

    const category = classifyDocument(text, 'cloud_proposal.pdf');
    expect(category).toBe('Proposal');

    const analysis = generateHeuristicAnalysis(text, 'cloud_proposal.pdf');
    expect(analysis.summary.medium).not.toContain('INV-9842');
    expect(analysis.insights.domain).toBe('Proposal');
  });

  it('6. General Document: falls back to General Document when classification is uncertain', () => {
    const text = `Overview of quarterly department objectives and team operational workflows for upcoming fiscal periods. Key milestones focus on improving cross-functional communication and documentation.`;

    const category = classifyDocument(text, 'department_notes.txt');
    expect(category).toBe('General Document');

    const analysis = generateHeuristicAnalysis(text, 'department_notes.txt');
    expect(analysis.summary.medium).not.toContain('INV-9842');
    expect(analysis.insights.domain).toBe('General Document');
  });

  it('7. Real Invoice PDF Grounding (Test 2 Verification): extracts exact invoice numbers, vendor, customer, and amounts', () => {
    const text = `Invoice INV-2048\nVendor: NorthStar Cloud Services\nCustomer: Acme Digital Ltd.\nDate: August 20, 2026\nCloud Hosting — 2 units — $400 each = $800\nSupport Plan — 1 unit — $200\nSubtotal: $1,000\nTax: $100\nTotal: $1,100`;

    const category = classifyDocument(text, 'invoice_INV-2048.pdf');
    expect(category).toBe('Invoice');

    const analysis = generateHeuristicAnalysis(text, 'invoice_INV-2048.pdf');
    expect(analysis.title).toContain('INV-2048');
    expect(analysis.summary.medium).toContain('INV-2048');
    expect(analysis.summary.medium).toContain('NorthStar Cloud Services');
    expect(analysis.summary.medium).toContain('Acme Digital Ltd.');
    expect(analysis.summary.medium).not.toContain('INV-9842');
    expect(analysis.summary.medium).not.toContain('DocuMind Corporation');
    expect(analysis.summary.medium).not.toContain('Compute Node Cluster');
    expect(analysis.insights.domain).toBe('Invoice');
  });
});
