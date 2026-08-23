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

  /**
   * Sends user question regarding the document text to backend Q&A endpoint.
   */
  public async askQuestion(
    documentId: string,
    question: string,
    documentText?: string,
    history?: any[]
  ): Promise<{ answer: string; source?: string }> {
    const formattedHistory = history
      ? history.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }))
      : [];

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId, question, documentText, history: formattedHistory }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to generate answer to your question.');
    }

    return {
      answer: result.answer,
      source: result.source
    };
  }
}

export const apiService = new ApiService();
