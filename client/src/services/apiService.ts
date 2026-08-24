import { ProcessedDocument } from '../types/index.js';

export class ApiService {
  private baseUrl = '/api';

  /**
   * Safely parses JSON response, preventing unexpected token errors if Vercel or server returns HTML.
   */
  private async safeJsonResponse(response: Response, defaultErrorMessage: string): Promise<any> {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    let jsonResult: any = null;
    if (contentType.includes('application/json') || (text.trim().startsWith('{') && text.trim().endsWith('}'))) {
      try {
        jsonResult = JSON.parse(text);
      } catch (_) {}
    }

    if (jsonResult) {
      if (!response.ok || jsonResult.success === false) {
        throw new Error(jsonResult.error || jsonResult.message || defaultErrorMessage);
      }
      return jsonResult;
    }

    if (!response.ok) {
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      const userMessage = cleanText && cleanText.length < 150
        ? cleanText
        : `Server Error (${response.status}): ${response.statusText || defaultErrorMessage}`;
      throw new Error(userMessage);
    }

    throw new Error(defaultErrorMessage);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Uploads file to backend for extraction and AI analysis.
   */
  public async uploadDocument(file: File): Promise<ProcessedDocument> {
    const base64Data = await this.fileToBase64(file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        base64Data
      }),
    });

    const result = await this.safeJsonResponse(response, 'Failed to process and analyze the uploaded document.');

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to process and analyze the uploaded document.');
    }

    return result.data;
  }

  /**
   * Extract text and metadata from document file (Section 12 API Design)
   */
  public async extractText(file: File): Promise<{ text: string; metadata: any }> {
    const base64Data = await this.fileToBase64(file);

    const response = await fetch(`${this.baseUrl}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        base64Data
      }),
    });

    const result = await this.safeJsonResponse(response, 'Failed to extract text from document.');
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

    const result = await this.safeJsonResponse(response, 'Failed to generate summary.');
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
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const result = await response.json();
        if (response.ok && result.success) {
          return result.data;
        }
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
