import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { StructuredSummaries, KeyPoint, ImprovementSuggestion, DocumentInsights } from '../types/index.js';
import { generateHeuristicAnalysis, isInsufficientText, enforceWordCount, sanitizePrivacyInfo, classifyDocument, dedupeSentences, findGroundedAnswer, rankDocumentChunks, filterCleanTechnicalSkills, classifyQueryIntent, validateGroundedAnswer } from '../utils/textHelpers.js';

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
        
        const systemPrompt = `You are DocuMind, an expert AI Document Analyzer and Executive Summarizer.
Analyze the provided document text thoroughly and produce a structured JSON response matching the following strict guidelines:

DOCUMENT CATEGORY: ${category}

DOCUMENT-AWARE SUMMARIZATION RULES:
1. SUMMARIZE CONCEPTUALLY based on document type (${category}). Every sentence must add NEW information. REMOVE REPETITION.
2. Structure summaries using clear section headers: "Overview:", "Core Focus:", "Key Requirements:", "Notable Details:".
   - For COVER LETTERS: Prioritize applicant profile, target role/company, quantitative skills/analytics background, key projects, and stated motivation. Do NOT make phone numbers, email addresses, or personal contact info the focus of the summary.
   - For TECHNICAL DOCUMENTS: Prioritize purpose, architecture, technologies, key functions, and execution scope.
   - For INVOICES: Prioritize vendor, customer, line-item totals, tax, and settlement terms.
3. Key Points: Array of 4-8 genuinely distinct points directly supported by the text. NEVER hallucinate metrics.
4. Improvements: Array of 3-5 document-specific recommendations. Each recommendation must include a specific suggestion AND a brief reason why it would improve the document.
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
  "keyPoints": [ { "category": "Objective|Finding|Requirement|Metric|Conclusion|General|Technical|Action", "point": "..." } ],
  "improvements": [ { "category": "Clarity|Structure|Readability|Actionability|Repetition|Missing Info", "suggestion": "Specific recommendation. Brief Reason: why it improves the document." } ],
  "insights": { "sentiment": "Neutral|Formal|Technical|Persuasive|Urgent", "domain": "${category}", "complexity": "Low|Medium|High" }
}`;

        const userPrompt = `Document Filename: ${fileName}\n\nDocument Content:\n"""\n${text.substring(0, 25000)}\n"""`;

        const response = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);

        const rawText = response.response.text() || '';
        const parsedJson = JSON.parse(rawText);
        
        const validated = AIAnalysisSchema.parse(parsedJson);

        validated.summary.short = enforceWordCount(dedupeSentences(validated.summary.short), 80, 120);
        validated.summary.medium = enforceWordCount(dedupeSentences(validated.summary.medium), 150, 250);
        validated.summary.long = enforceWordCount(dedupeSentences(validated.summary.long), 300, 450);

        validated.keyPoints = validated.keyPoints.map(kp => ({
          ...kp,
          point: sanitizePrivacyInfo(kp.point)
        }));

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

  /**
   * Answers a specific question about the document text ("Ask This Document" feature).
   * Supports intent-aligned evidence citations and source locations.
   */
  public async answerQuestion(documentText: string, question: string, fileName: string = '', history: any[] = []): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const intent = classifyQueryIntent(question);

    if (this.aiClient || (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here')) {
      try {
        const client = this.aiClient || new GoogleGenerativeAI(apiKey!);
        const model = client.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-1.5-flash' });
        
        const rankedChunks = rankDocumentChunks(documentText, question);
        const topContext = rankedChunks.slice(0, 3).map(r => r.chunk.text).join('\n\n') || documentText.substring(0, 15000);

        const prompt = `You are DocuMind's grounded document Q&A assistant.
Your task is to extract and state the direct answer to the user's question using ONLY the supplied document context.

CRITICAL INTENT-ALIGNED RULES:
1. Answer the question directly in 1 concise sentence (or a clean bulleted list for skills/projects).
2. EXTRACT THE EXACT FACT / ENTITY stated in the CURRENT document. Do NOT copy, reproduce, or dump source paragraphs.
3. For "Where did you find it?" or source location queries: State "I found this in Page [X] · [Section] section. The relevant text states: '[short snippet]'". Do NOT repeat the previous answer entity alone.
4. For candidate name questions ("What is the candidate's name?"): Return "The candidate's name is [Name]." If absent, reply "I couldn't identify the candidate's name from the document content."
5. For company questions ("What company is mentioned?"): Return "The company mentioned is [Company Name]." If absent, reply "The document does not clearly mention a company name."
6. For role questions ("What role is the candidate applying for?"): Return "The candidate is applying for the [Role] role." If absent, reply "The target role is not explicitly specified in the document."
7. NEVER assume or infer information from other documents, sample documents, or outside knowledge.
8. If the document does not contain enough information, reply EXACTLY: "I couldn't find that information in the uploaded document."
9. Return ONLY the final clean, direct answer string.

USER INTENT: ${intent}
Document Filename: ${fileName}
DOCUMENT CONTEXT:
"""
${topContext}
"""

USER QUESTION: ${question}`;

        const response = await model.generateContent(prompt);
        let ans = (response.response.text() || '').trim();

        // Clean out any accidental preamble prefixes or quote wrappers
        ans = ans.replace(/^based on the (document|context|text)[:\s]*/i, '').trim();
        ans = ans.replace(/^(the candidate is applying for the position described|the position described)[:\s]*/i, 'The candidate is applying for ').trim();

        if (question.toLowerCase().includes('skill') || question.toLowerCase().includes('technolog')) {
          const rawLines = ans.split('\n');
          const cleanSkills = filterCleanTechnicalSkills(rawLines);
          return `Technical skills mentioned include:\n- ${cleanSkills.join('\n- ')}`;
        }

        const sanitized = sanitizePrivacyInfo(ans);
        if (validateGroundedAnswer(sanitized, question, intent)) {
          return sanitized;
        }
      } catch (error: any) {
        console.warn(`[AIService] Q&A API call failed: ${error.message}`);
      }
    }

    return findGroundedAnswer(documentText, question, fileName, history);
  }
}

export const aiService = new AIService();
