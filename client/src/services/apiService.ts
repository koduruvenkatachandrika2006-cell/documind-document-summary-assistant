import { ProcessedDocument } from '../types/index.js';

export class ApiService {
  private baseUrl = '/api';

  /**
   * Uploads file to backend for extraction and AI analysis.
   */
  public async uploadDocument(file: File): Promise<ProcessedDocument> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to process and analyze the uploaded document.');
    }

    return result.data;
  }

  /**
   * Extract text and metadata from document file (Section 12 API Design)
   */
  public async extractText(file: File): Promise<{ text: string; metadata: any }> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${this.baseUrl}/extract`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to extract text from document.');
    }

    return { text: result.text, metadata: result.metadata };
  }

  /**
   * Summarize extracted text at a specified summary length (Section 12 API Design)
   */
  public async summarizeText(text: string, length: 'short' | 'medium' | 'long' = 'medium', fileName?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, length, fileName }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to generate summary.');
    }

    return result;
  }

  /**
   * Fetches stored document by ID for refresh persistence & direct URL routing.
   */
  public async fetchDocumentById(id: string): Promise<ProcessedDocument | null> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        return result.data;
      }
    } catch (e) {
      console.warn(`[ApiService] Failed to fetch document ${id} from server.`);
    }
    return null;
  }

  /**
   * Syncs client document to server in-memory store.
   */
  public async syncStoreDocument(doc: ProcessedDocument): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/documents/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
    } catch (e) {
      console.warn('[ApiService] Failed to sync document store.');
    }
  }
}

export const apiService = new ApiService();
