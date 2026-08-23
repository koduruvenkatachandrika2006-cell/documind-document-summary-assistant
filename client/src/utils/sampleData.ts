import { ProcessedDocument } from '../types/index.js';

export const SAMPLE_PROPOSAL_DOC: ProcessedDocument = {
  id: 'doc_sample_proposal_2026',
  fileName: 'sample_proposal.pdf',
  fileSize: 45056,
  mimeType: 'application/pdf',
  documentType: 'pdf',
  pageCount: 1,
  wordCount: 142,
  characterCount: 948,
  estimatedReadingTimeMinutes: 1,
  extractionMethod: 'PDF Text Extraction',
  processingTimeMs: 412,
  title: 'DocuMind Enterprise Cloud Architecture Proposal',
  extractedText: `DocuMind Enterprise Cloud Architecture Proposal

Executive Summary:
This document outlines the cloud infrastructure modernization project for Enterprise SaaS Platform.

Key Objectives:
1. Reduce system latency by 45% using micro-services architecture and global CDN caching.
2. Enhance data security compliance with end-to-end encryption at rest and in transit.
3. Deploy AI-driven document processing pipelines to automate customer invoice validation.

Requirements:
The total project budget is $150,000 with a completion deadline of Q4 2026. All APIs must achieve 99.99% uptime.`,
  summary: {
    short: `Overview:
The DocuMind Enterprise Cloud Architecture Proposal sets out a clear strategic roadmap to modernize infrastructure for an Enterprise SaaS platform. The project carries a $150,000 budget cap with a completion deadline in Q4 2026.

Core Focus:
Primary objectives include cutting system latency by 45% using decoupled microservices, enforcing end-to-end encryption compliance, and automating document verification via AI pipelines with a 99.99% API availability SLA.`,
    
    medium: `Overview:
The DocuMind Enterprise Cloud Architecture Proposal outlines a comprehensive infrastructure modernization initiative designed to scale performance, security, and automated document processing for an Enterprise SaaS platform.

Key Objectives & Deliverables:
1. System Performance: Cut global latency by 45% through decoupled microservices architecture and global CDN edge caching.
2. Data Security & Compliance: Enforce strict end-to-end encryption across all data at rest and in transit.
3. Automation: Deploy specialized AI document processing pipelines to streamline customer invoice verification.

Financial & Operational Constraints:
The total project budget is capped at $150,000 with final completion targeted for Q4 2026. All core API endpoints must maintain a 99.99% availability service level agreement throughout operational cycles.`,
    
    long: `Executive Overview:
The DocuMind Enterprise Cloud Architecture Proposal presents a comprehensive strategic roadmap aimed at modernizing enterprise SaaS infrastructure. The project establishes key milestones to elevate system responsiveness, strengthen regulatory compliance, and automate invoice processing pipelines.

Technical Architecture & Objectives:
- Microservices & CDN Caching: Re-architect monolithic endpoints into decoupled microservices and integrate global CDN edge nodes to achieve a targeted 45% reduction in latency.
- Security & Encryption Standards: Mandate end-to-end AES-256 encryption across storage layers and transient network traffic to ensure total regulatory compliance.
- AI Invoice Validation: Integrate specialized machine-learning pipelines to automate customer invoice extraction, reducing manual processing overhead.

Budgetary & Reliability Governance:
The project operates under a total allocated budget of $150,000, with final deployment scheduled for Q4 2026. Operational criteria require all microservice endpoints to maintain a strict 99.99% uptime availability SLA. Ongoing governance milestones will monitor sprint progress to guarantee on-time delivery.`
  },
  keyPoints: [
    { category: 'Objective', point: 'Reduce platform latency by 45% using microservices architecture and edge CDN caching.' },
    { category: 'Requirement', point: 'Achieve 99.99% API uptime availability across all microservice endpoints.' },
    { category: 'Metric', point: 'Total allocated project budget capped at $150,000.' },
    { category: 'Requirement', point: 'Implementation of end-to-end encryption for data both at rest and in transit.' },
    { category: 'Conclusion', point: 'Target completion and deployment deadline set for Q4 2026.' }
  ],
  improvements: [
    { category: 'Clarity', suggestion: 'Provide detailed architectural diagrams illustrating microservice boundary separations.' },
    { category: 'Actionability', suggestion: 'Break down the $150,000 budget into specific resource allocations (CDN, AI API costs, engineering hours).' },
    { category: 'Structure', suggestion: 'Include a milestone timeline table mapping sprint deliverables across Q1 to Q4 2026.' }
  ],
  insights: {
    sentiment: 'Formal',
    domain: 'Cloud Architecture & Enterprise Engineering',
    complexity: 'Medium'
  }
};

export const SAMPLE_RECEIPT_DOC: ProcessedDocument = {
  id: 'doc_sample_receipt_2026',
  fileName: 'scanned_invoice.png',
  fileSize: 124000,
  mimeType: 'image/png',
  documentType: 'image',
  pageCount: 1,
  wordCount: 88,
  characterCount: 540,
  estimatedReadingTimeMinutes: 1,
  extractionMethod: 'Tesseract OCR Processing',
  processingTimeMs: 1250,
  title: 'Cloud Services Monthly Invoice #INV-9842',
  extractedText: `GLOBAL CLOUD SERVICES INC.
INVOICE #INV-9842
Date: August 15, 2026
Bill To: DocuMind Corp

Description              Qty    Rate     Amount
------------------------------------------------
Compute Node Cluster      4     $450.00  $1,800.00
Managed AI API Gateway    1     $650.00    $650.00
CDN Data Transfer (TB)    2     $120.00    $240.00
------------------------------------------------
SUBTOTAL:                                $2,690.00
TAX (8%):                                  $215.20
TOTAL DUE:                               $2,905.20
Payment Terms: Net 30 Days`,
  summary: {
    short: `Overview:
This document is Invoice #INV-9842 issued by Global Cloud Services Inc. to DocuMind Corp on August 15, 2026.

Financial Summary:
The subtotal of $2,690.00 covers compute clusters, AI API gateway, and CDN bandwidth. Applying an 8% tax ($215.20) yields a final balance due of $2,905.20 under Net 30 payment terms.`,
    
    medium: `Overview:
This scanned financial document represents Invoice #INV-9842 issued by Global Cloud Services Inc. to DocuMind Corp on August 15, 2026. It itemizes monthly cloud infrastructure expenditures across compute, AI services, and network data transfer.

Itemized Expenditure Breakdown:
1. Compute Node Clusters: 4 units at $450.00/unit totaling $1,800.00.
2. Managed AI API Gateway: 1 unit at $650.00.
3. CDN Data Transfer: 2 TB at $120.00/TB totaling $240.00.

Billing & Settlement Terms:
Applying an 8% sales tax rate ($215.20) onto the subtotal of $2,690.00 yields a total balance due of $2,905.20. Payment is required within 30 days under standard Net 30 settlement terms.`,
    
    long: `Executive Overview:
This document is Invoice #INV-9842 issued by Global Cloud Services Inc. to DocuMind Corp on August 15, 2026. The document details itemized recurring cloud infrastructure charges for the preceding billing cycle.

Detailed Cost & Resource Allocation:
- Compute Infrastructure: 4 Compute Node Clusters billed at $450.00 per unit, amounting to $1,800.00 (the single largest cost driver).
- Managed AI Gateway: 1 AI API Gateway instance billed at $650.00 for request routing and LLM inference orchestration.
- Network Bandwidth: 2 Terabytes of CDN Data Transfer billed at $120.00/TB, amounting to $240.00.

Financial Totals & Payment Obligations:
The calculated subtotal is $2,690.00. Adding an 8% sales tax charge ($215.20) brings the total final balance due to $2,905.20. The invoice dictates standard Net 30 payment terms from the date of issuance.`
  },
  keyPoints: [
    { category: 'Metric', point: 'Total amount due: $2,905.20 (including $215.20 8% sales tax).' },
    { category: 'Requirement', point: 'Payment Terms: Net 30 days from invoice date (August 15, 2026).' },
    { category: 'Finding', point: 'Largest line item expense: Compute Node Clusters at $1,800.00.' }
  ],
  improvements: [
    { category: 'Actionability', suggestion: 'Include direct wire transfer ACH details or payment link for rapid processing.' },
    { category: 'Clarity', suggestion: 'Specify compute node instance types (e.g., c6i.2xlarge) for asset tracking.' }
  ],
  insights: {
    sentiment: 'Formal',
    domain: 'Billing & Accounting',
    complexity: 'Low'
  }
};
