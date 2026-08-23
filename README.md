# DocuMind — AI-Powered Document Intelligence & Grounded Q&A Assistant

> Turn complex PDFs, scanned documents, and images into accurate executive summaries, key points, improvement recommendations, and interactive grounded Q&A insights.

![DocuMind Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Express%20%7C%20Gemini%20AI-indigo)
![Testing](https://img.shields.io/badge/Tests-Vitest%20%7C%206%2F6%20Passed-emerald)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🔗 Recruiter & Portfolio Links

- **GitHub Repository**: [https://github.com/koduruvenkatachandrika2006-cell/](https://github.com/koduruvenkatachandrika2006-cell/)
- **Live Demo**: `NOT PROVIDED — add live deployment URL before applying`
- **LinkedIn**: `NOT PROVIDED — add LinkedIn profile URL before applying`
- **Resume**: `NOT PROVIDED — add Resume link before applying`
- **Portfolio / Personal Website**: `NOT PROVIDED — add Portfolio URL before applying`

---

## 🌟 What It Does

**DocuMind** is a production-grade document intelligence platform built with React, Express, TypeScript, and Google Gemini AI. It ingests unstructured files (vector PDFs, scanned images, invoices, cover letters, resumes, technical proposals), extracts clean text using a dual extraction engine (`pdf-parse` and `Tesseract.js` OCR), generates document-aware summaries, and powers an evidence-grounded interactive Q&A assistant (**"Ask This Document"**).

---

## 💡 Problem & Solution

### The Problem
Processing long documents, resumes, and scanned invoices is time-consuming and error-prone. Generic AI chat tools frequently hallucinate facts, fail to isolate document contexts, mix up candidate names or company entities, or provide generic non-answers like *"outlined in the document"*.

### The Solution
DocuMind establishes a strict **Evidence-Grounded Architecture**:
1. **Document Isolation**: Every file receives a unique `documentId`. State, retrieval indices, and Q&A histories are strictly isolated per document.
2. **Intent-Specific Evidence Retrieval**: User questions are classified into distinct query intents (`CANDIDATE_NAME`, `COMPANY_ORGANIZATION`, `ROLE_APPLICATION`, `TECHNICAL_SKILLS`, `EVIDENCE_SOURCE`, `GENERAL_PURPOSE`), retrieving only relevant chunks.
3. **Mandatory Answer Validation**: Answers are validated against document evidence before being displayed. Non-answers and hallucinations are automatically discarded.
4. **Transparent Evidence Citation**: Source location badges (e.g. `Page 1 · Application / Objective`) and explicit source location queries ("Where did you find it?") cite exact page numbers and evidence snippets.

---

## ✨ Key Features

- 📄 **Multi-Format Ingestion**: Supports vector PDFs, PNG, JPG, JPEG, and WebP images up to 10MB.
- 🔍 **Dual Extraction Pipeline**: Native PDF text parsing (`pdf-parse`) with automated OCR fallback (`Tesseract.js`) for scanned documents.
- ⚡ **Document-Aware Summarization**: Selectable **Short** (80–120 words), **Medium** (150–250 words), and **Long** (300–450 words) summary modes with structured section headers.
- 🎯 **Key Points & Main Ideas**: Grounded extraction of objectives, findings, metrics, requirements, and conclusions.
- 💡 **Context-Aware Improvements**: Adaptive recommendations tailored to document type (resumes, invoices, technical proposals).
- 📊 **Document Metrics Analytics**: Calculations of word count, page count, character count, estimated reading time, extraction method, and processing latency.
- 💬 **Grounded "Ask This Document" Q&A**: Interactive chat modal with document isolation, evidence validation, chat persistence, and page-level source badges.
- 📜 **Extracted Text Viewer**: Collapsible raw text viewer with line numbers, search filter, and clipboard copy.
- 📥 **Export Capabilities**: One-click clipboard copy and clean Markdown export.
- 🔄 **Refresh & URL Persistence**: Route persistence (`/document/:id`) restores active documents and scoped chat histories seamlessly.

---

## 🏗️ Technical Architecture

```text
[User File Upload] ──► [File Constraints Validation] (MIME & 10MB Size Limit)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
       [Vector PDF Document]       [Scanned Image / PNG]
                │                           │
       [pdf-parse Engine]          [Tesseract OCR Engine]
        (Page Markers)             (Optical Recognition)
                │                           │
                └─────────────┬─────────────┘
                              ▼
                   [Extracted Text Buffer]
                              │
               [Hybrid Chunk Ranking Engine]
     (Semantic + Keyword + Section + Intent Scoring)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
       [Google Gemini AI]         [Rule-Based NLP Engine]
    (Structured Zod Schema)       (Sentence Score Ranking)
                │                           │
                └─────────────┬─────────────┘
                              ▼
                    [DocuMind Dashboard]
               (Executive Summaries | Key Points
              Improvements | Grounded Q&A Modal)
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Backend**: Node.js, Express, TypeScript, Multer.
- **Extraction & OCR**: `pdf-parse`, `tesseract.js`.
- **AI & Validation**: `@google/generative-ai` (Google Gemini API), Zod schema validation.
- **Testing & Build**: Vitest, TypeScript, Vite.

---

## 🤖 AI / OCR & Grounded Q&A Pipeline

### Grounded Q&A Lifecycle
```text
Current Document -> Understand Question -> Retrieve Relevant Evidence -> Generate Grounded Answer -> Validate Answer -> Display
```

- **Query Intent Classifier**: Distinguishes identity queries (`CANDIDATE_NAME`), company entities (`COMPANY_ORGANIZATION`), job targets (`ROLE_APPLICATION`), technical skills (`TECHNICAL_SKILLS`), source location queries (`EVIDENCE_SOURCE`), and general objectives.
- **Evidence Citation**: Questions asking *"Where did you find it?"* state: *"I found this in Page X · Section. The relevant text states: '...'"* without repeating previous answers.
- **Answer Relevance Validation**: Discards non-answers (*"outlined in the document"*) and intent mismatches before returning the final response.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js >= v20.0.0
- npm >= v10.0.0

### Step 1: Clone Repository
```bash
git clone https://github.com/koduruvenkatachandrika2006-cell/documind.git
cd documind
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure `.env`:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_google_gemini_api_key_here
MAX_FILE_SIZE_BYTES=10485760
```
*(Note: If `GEMINI_API_KEY` is not set, DocuMind uses its built-in rule-based NLP heuristic engine so all functionality remains operational).*

### Step 4: Run Development Server
```bash
npm run dev
```
- Frontend application: `http://localhost:3000`
- Backend API server: `http://localhost:5000`

---

## 🧪 Testing & Verification

Run the automated Vitest test suite:
```bash
npm test
```

Execute full production build check:
```bash
npm run build
```

---

## 🔒 Security Practices

1. **Server-Side API Key Isolation**: API keys remain strictly on the Express backend; zero secrets are exposed in client JavaScript bundles.
2. **Ephemeral Memory Processing**: Uploaded files are parsed directly in memory (`multer.memoryStorage()`) and freed immediately after extraction.
3. **Multi-Layer Input Validation**: Files are validated against MIME type, extension, and file size boundaries on both client and server.
4. **Privacy Protection**: Automatic sanitization strips email addresses and phone numbers from summaries and Q&A outputs.

---

## 👤 Author & Contribution

Developed for Software Engineering Technical Assessment.

- **GitHub**: [https://github.com/koduruvenkatachandrika2006-cell/](https://github.com/koduruvenkatachandrika2006-cell/)
- **License**: MIT
