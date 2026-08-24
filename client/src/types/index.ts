export type SummaryLengthMode = 'short' | 'medium' | 'long';

export interface KeyPoint {
  category: 'Objective' | 'Finding' | 'Requirement' | 'Metric' | 'Conclusion' | 'General' | 'Technical' | 'Action';
  point: string;
}

export interface ImprovementSuggestion {
  category: 'Clarity' | 'Structure' | 'Readability' | 'Actionability' | 'Repetition' | 'Missing Info';
  suggestion: string;
}

export interface DocumentInsights {
  sentiment: 'Neutral' | 'Formal' | 'Technical' | 'Persuasive' | 'Urgent';
  domain: string;
  complexity: 'Low' | 'Medium' | 'High';
}

export interface StructuredSummaries {
  short: string;
  medium: string;
  long: string;
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: 'pdf' | 'image';
  extractedText: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  estimatedReadingTimeMinutes: number;
  extractionMethod: 'PDF Text Extraction' | 'Tesseract OCR Processing' | 'Visual PDF Layout Processing' | 'Scanned PDF OCR' | 'Browser Web Worker OCR' | string;
  processingTimeMs: number;
  title: string;
  summary: StructuredSummaries;
  keyPoints: KeyPoint[];
  improvements: ImprovementSuggestion[];
  insights: DocumentInsights;
}
