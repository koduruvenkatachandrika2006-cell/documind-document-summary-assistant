import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { StructuredSummaries, KeyPoint, ImprovementSuggestion, DocumentInsights } from '../types/index.js';
import { generateHeuristicAnalysis, isInsufficientText, enforceWordCount, sanitizePrivacyInfo, classifyDocument, dedupeSentences } from '../utils/textHelpers.js';

// Zod Schema for strict JSON response validation from LLM
const AIAnalysisSchema = z.object({
  title: z.string(),
  summary: z.object({
    short: z.string(),
    medium: z.string(),
    long: z.string()
  }),
  keyPoints: z.array(z.object({
    category: z.enum(['Objective', 'Finding', 'Requirement', 'Metric', 'Conclusion', 'General', 'Technical', 'Action']),
    point: z.string()
  })),
  improvements: z.array(z.object({
    category: z.enum(['Clarity', 'Structure', 'Readability', 'Actionability', 'Repetition', 'Missing Info']),
    suggestion: z.string()
  })),
  insights: z.object({
    sentiment: z.enum(['Neutral', 'Formal', 'Technical', 'Persuasive', 'Urgent']),
    domain: z.string(),
    complexity: z.enum(['Low', 'Medium', 'High'])
  })
});

export type AIAnalysisResponse = z.infer<typeof AIAnalysisSchema>;

export class AIService {
  private aiClient: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      this.aiClient = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Generates structured AI summary, key points, improvements, and insights from text.
   */
  public async analyzeDocument(text: string, fileName: string): Promise<AIAnalysisResponse> {
    if (isInsufficientText(text)) {
      return generateHeuristicAnalysis(text, fileName);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const category = classifyDocument(text, fileName);

    if (this.aiClient || (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here')) {
      try {
        const client = this.aiClient || new GoogleGenerativeAI(apiKey!);
        const model = client.getGenerativeModel({
          model: process.env.AI_MODEL || 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });
        
        const systemPrompt = `You are DocuMind, an expert AI Document Analyzer and Executive Summarizer. You are analyzing the user's uploaded document. Use ONLY the supplied document content. Do not assume it is an invoice. Determine what the document is from its content and generate analysis appropriate to that document type. Never invent facts that are not present.
Analyze the provided document text thoroughly and produce a structured JSON response matching the following strict guidelines:

DOCUMENT CATEGORY: ${category}

DOCUMENT-AWARE SUMMARIZATION RULES:
1. SUMMARIZE CONCEPTUALLY based on document type (${category}). Every sentence must add NEW information. REMOVE REPETITION.
2. Structure summaries using clear section headers: "Overview:", "Core Focus:", "Key Requirements:", "Notable Details:".
   - For COVER LETTERS: Prioritize applicant profile, target role/company, quantitative skills/analytics background, key projects, and stated motivation. Do NOT make phone numbers, email addresses, or personal contact info the focus of the summary.
   - For TECHNICAL DOCUMENTS: Prioritize purpose, architecture, technologies, key functions, and execution scope.
   - For INVOICES: Prioritize vendor, customer, line-item totals, tax, and settlement terms.
3. Key Points: Array of 3-6 concise, highly scannable points directly supported by the text (EXACTLY 1-2 sentences maximum per point). Focus on core objectives, findings, metrics, dates, requirements, and conclusions without long paragraphs.
4. Improvements: Array of 3-5 practical, document-specific recommendations. Use language such as "Consider...", "You could...", "It may help to...", or "Consider clarifying...". Do NOT invent facts or present assumptions as facts. Each suggestion should normally be 1 sentence.
5. Do NOT unnecessarily repeat email addresses or phone numbers in summaries, key points, or improvement suggestions.

WORD COUNT TARGET BOUNDARIES (STRICT REQUIREMENT):
- "short": Executive overview (EXACTLY 80–120 words).
- "medium": Balanced summary with headers (EXACTLY 150–250 words).
- "long": Comprehensive multi-section analysis (EXACTLY 300–450 words).

OUTPUT MUST BE VALID JSON matching this schema:
{
  "title": "Document Title",
  "summary": {
    "short": "Overview:\\n...\\n\\nCore Focus:\\n...",
    "medium": "Overview:\\n...\\n\\nCore Focus:\\n...\\n\\nNotable Details:\\n...",
    "long": "Executive Overview:\\n...\\n\\nDetailed Analysis:\\n...\\n\\nConclusion:\\n..."
  },
  "keyPoints": [ { "category": "Objective|Finding|Requirement|Metric|Conclusion|General|Technical|Action", "point": "Concise 1-2 sentence key takeaway." } ],
  "improvements": [ { "category": "Clarity|Structure|Readability|Actionability|Repetition|Missing Info", "suggestion": "Consider..." } ],
  "insights": { "sentiment": "Neutral|Formal|Technical|Persuasive|Urgent", "domain": "${category}", "complexity": "Low|Medium|High" }
}`;

        const userPrompt = `Document Filename: ${fileName}\n\nDocument Content:\n"""\n${text.substring(0, 25000)}\n"""`;

        const aiTask = model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const timeoutMs = 20000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Gemini API call exceeded serverless limit (${timeoutMs}ms)`)), timeoutMs);
        });

        const response: any = await Promise.race([aiTask, timeoutPromise]);

        const rawText = response.response.text() || '';
        const parsedJson = JSON.parse(rawText);
        
        const validated = AIAnalysisSchema.parse(parsedJson);

        validated.summary.short = enforceWordCount(dedupeSentences(validated.summary.short), 80, 120);
        validated.summary.medium = enforceWordCount(dedupeSentences(validated.summary.medium), 150, 250);
        validated.summary.long = enforceWordCount(dedupeSentences(validated.summary.long), 300, 450);

        validated.keyPoints = validated.keyPoints.slice(0, 6).map(kp => {
          let cleanPoint = sanitizePrivacyInfo(kp.point).trim();
          const sentences = cleanPoint.split(/(?<=[.!?])\s+/);
          if (sentences.length > 2) {
            cleanPoint = sentences.slice(0, 2).join(' ');
          }
          return {
            ...kp,
            point: cleanPoint
          };
        });

        validated.improvements = validated.improvements.map(imp => ({
          ...imp,
          suggestion: sanitizePrivacyInfo(imp.suggestion)
        }));

        return validated;

      } catch (error: any) {
        console.warn(`[AIService] Gemini API call failed (${error.message}). Falling back to heuristic NLP engine.`);
        return generateHeuristicAnalysis(text, fileName);
      }
    }

    return generateHeuristicAnalysis(text, fileName);
  }
}

export const aiService = new AIService();
