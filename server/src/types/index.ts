export type DocumentType = 'pdf' | 'image';

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
  documentType: DocumentType;
  extractedText: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  estimatedReadingTimeMinutes: number;
  extractionMethod: 'PDF Text Extraction' | 'Tesseract OCR Processing';
  processingTimeMs: number;
  title: string;
  summary: StructuredSummaries;
  keyPoints: KeyPoint[];
  improvements: ImprovementSuggestion[];
  insights: DocumentInsights;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: string;
}
