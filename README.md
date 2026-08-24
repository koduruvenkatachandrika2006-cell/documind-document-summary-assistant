# Document Summary Assistant (DocuMind)

An AI-powered web application that allows users to upload PDF or image documents (`PDF`, `PNG`, `JPG`, `JPEG`, `WebP`), extract text using vector parsing or OCR, and generate intelligent summaries, key points, and actionable improvement suggestions.

🚀 **Live Production Application**: [https://documind-document-summary-assistant.vercel.app](https://documind-document-summary-assistant.vercel.app)

📦 **GitHub Repository**: [https://github.com/koduruvenkatachandrika2006-cell/documind-document-summary-assistant](https://github.com/koduruvenkatachandrika2006-cell/documind-document-summary-assistant)

![Production Live](https://img.shields.io/badge/Production-Live%20Deployment-success?style=for-the-badge&logo=vercel)
![Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Express%20%7C%20Gemini%20AI-indigo)
![Tests](https://img.shields.io/badge/Tests-Vitest%20%7C%2033%2F33%20Passing-emerald)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🌟 Overview

**DocuMind** is an AI-powered Document Summary Assistant designed to rapidly digest multi-page documents, scanned forms, receipts, resumes, invoices, and proposals. The application combines server-side PDF parsing and Tesseract OCR with Google Gemini AI to produce structured, document-grounded summaries across three detail levels (**Short**, **Medium**, and **Long**), along with categorized **Key Points** and practical **Improvement Suggestions**.

---

## 🎯 Content Grounding & Accuracy

DocuMind analyzes each uploaded document independently:

- **Grounded Summaries**: Generated summaries, key points, and improvement suggestions are derived exclusively from extracted text or visual analysis of the currently uploaded document.
- **Upload State Isolation**: Uploaded files and generated analyses are isolated per request. Previous upload state is cleared upon new uploads.
- **No Sample Contamination**: Production analysis paths do not substitute sample data, template content, or generic fallbacks for user uploads.
- **Truthful Error Handling**: When readable text or visual content cannot be reliably extracted, DocuMind explicitly reports the extraction limitation instead of fabricating analysis.
- **Unicode Preservation**: Vector text extraction preserves Unicode formatting including bullet points (`•`), en-dashes (`–`), em-dashes (`—`), smart quotes (`“”`), accents, and currency symbols (`$`, `€`, `£`, `₹`).

---

## 📝 Developer Approach Write-Up (200 Words)

DocuMind addresses the challenge of rapidly digesting unstructured business documents across diverse file formats (`PDF`, `PNG`, `JPG`, `JPEG`, `WebP`). Our architecture decouples file ingestion, text extraction, structured AI analysis, and frontend presentation. We combine `pdf-parse` for vector PDFs and `Tesseract.js` for scanned image OCR.

The AI pipeline uses Google Gemini API with Zod schema validation to guarantee structured JSON output across Short, Medium, and Long summary modes, key point categorization (objectives, findings, metrics), and practical document-specific improvement suggestions. When the Gemini API is unavailable, DocuMind uses a deterministic local fallback for supported text analysis. It never substitutes unrelated sample content and reports insufficient content when reliable analysis is not possible.

The application features a modern dark-mode interface built with React, Vite, and Tailwind CSS. UX highlights include real-time multi-step progress indicators, collapsible raw text inspection, calculated document analytics, markdown export tools, and an Improvement Suggestions section with collapsible controls.

Robust error handling validates MIME types, empty files, and 10MB limits before processing. Secrets are protected server-side with in-memory upload buffers to ensure user privacy. Automated Vitest test suites verify parsing, validation, and AI fallback rules, delivering a secure, production-grade SaaS assessment deliverable.

---

## ✨ Features

- 📄 **PDF Upload & Multi-Page Extraction**: Native PDF text parsing supporting multi-page documents.
- 📷 **Scanned Image & Document OCR**: Optical Character Recognition (`Tesseract.js`) for `PNG`, `JPG`, `JPEG`, and `WebP` images.
- 📥 **Drag-and-Drop Upload**: Dual upload area supporting drag-and-drop and native file picker.
- ⚡ **Structured AI Summarization**: AI-driven summary generation powered by Google Gemini API with Zod schema validation.
- 🎛️ **Selectable Summary Lengths**: Real-time length selection:
  - **Short**: Executive overview (~80–120 words).
  - **Medium**: Balanced summary with headers (~150–250 words).
  - **Long**: Comprehensive breakdown (~300–450 words).
- 📌 **Key Points & Main Ideas**: Categorized extraction of Objectives, Findings, Metrics, Requirements, and Conclusions.
- 💡 **Context-Aware Improvement Suggestions**: Practical recommendations tailored to resumes, proposals, invoices, technical docs, and general files.
- ⌛ **Deterministic Loading States**: Clear progress indicators for file upload, text extraction, OCR scanning, and AI processing.
- 🛡️ **Comprehensive Validation**: Friendly, informative error messages for unsupported formats, empty files, corrupted PDFs, and unreadable images.
- 📱 **Mobile-Responsive Interface**: Modern dark-mode layout optimized for mobile, tablet, and desktop viewports.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Backend**: Node.js, Express, TypeScript, Multer (memory buffer storage).
- **Text Extraction & OCR**: `pdf-parse`, `pdf-lib`, `tesseract.js`.
- **AI Engine & Validation**: `@google/generative-ai` (Google Gemini API), `zod` schema validation.
- **Testing & Build**: Vitest, TypeScript compiler (`tsc`), Vite.

---

## 🔄 Pipeline Architecture

```text
Upload
  ↓
Validate file (Format & 10MB Limit)
  ↓
PDF / Image Detection
  ↓
PDF Text Extraction OR OCR Scanning
  ↓
Validate Extracted Content (Unicode & Quality Checks)
  ↓
Grounded AI Analysis (Gemini API / Local Fallback)
  ↓
Summary + Key Points + Improvement Suggestions
```

---

## ⚠️ Limitations

- **OCR Quality Dependency**: OCR accuracy depends on image resolution, contrast, orientation, and font legibility.
- **Image-Only Content**: Images or photographs without meaningful readable text cannot produce a textual summary; DocuMind reports image metadata and visual characteristics.
- **Extraction Bound**: AI-generated summaries and insights are strictly constrained to information successfully extracted from the uploaded document.
- **File Size Limit**: Maximum supported upload size is 10MB per document.

---

## 🧪 Verification & Test Results

The following test suites have been executed and verified in the automated testing environment (`npm test`):

- **Resume Analysis**: Verified extraction of candidates, experience, skills, and education facts.
- **Invoice Analysis**: Verified vendor, customer, line items, totals, and payment terms extraction.
- **Project Proposal Analysis**: Verified scope, deliverables, timeline, and budget extraction (`DocuMind_Test_03_Project_Proposal.pdf`).
- **Scanned PDF OCR**: Verified image stream OCR extraction for non-vector PDFs.
- **Image / Screenshot Analysis**: Verified ATS screenshot and text-bearing image OCR.
- **Unicode PDF Extraction**: Verified preservation of bullet points (`•`), en-dashes (`–`), smart quotes (`“”`), and currency symbols.
- **Cross-Upload Isolation**: Verified complete purge of previous document state between sequential uploads.
- **Empty / Unreadable Input Handling**: Verified error responses for corrupted or 0-byte files.
- **Production Build**: `npm run build` succeeds cleanly.
- **Type Safety Linting**: `npm run lint` passes with 0 TypeScript errors.

---

## 🚀 Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/koduruvenkatachandrika2006-cell/documind-document-summary-assistant.git
cd documind-document-summary-assistant
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Gemini API Key in `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

> **Note**: Secrets should never be committed to source control. When `GEMINI_API_KEY` is not provided, DocuMind uses a deterministic local fallback for text analysis.

### 3. Run Development Server

```bash
npm run dev
```

This starts the backend Express server on port 5000 and the Vite development server concurrently.

---

## 🧪 Automated Testing & Build Commands

Run automated tests, type checking, and production builds:

```bash
# Run Vitest test suite (33 passing tests)
npm test

# Run TypeScript type safety check
npm run lint

# Run production build (Vite client + Server compilation)
npm run build

# Start compiled production server locally
npm start
```

---

## 🌐 Deployment (Vercel)

DocuMind is configured for serverless deployment on **Vercel** via `vercel.json` and `/api/index.ts`.

### Deployment Steps:

1. Push your repository to GitHub.
2. Import the repository into your Vercel Dashboard.
3. In **Project Settings → Environment Variables**, configure:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `AI_MODEL`: `gemini-1.5-flash` (optional, defaults to `gemini-1.5-flash`).
4. Click **Deploy**. Vercel will build the React frontend and deploy the server routes as Serverless Functions.
