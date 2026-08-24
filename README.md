# Document Summary Assistant (DocuMind)

An AI-powered web application that allows users to upload PDF or image documents, extract text using vector parsing or OCR, and generate intelligent summaries, key points, and actionable improvement suggestions.

🚀 **Live Production Application**: [https://documind-document-summary-assistant.vercel.app](https://documind-document-summary-assistant.vercel.app)

![Live Production](https://img.shields.io/badge/Production-Live%20Deployment-success?style=for-the-badge&logo=vercel)
![Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Express%20%7C%20Gemini%20AI-indigo)
![Tests](https://img.shields.io/badge/Tests-Vitest%20%7C%20Passing-emerald)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🌟 Overview

**Document Summary Assistant** is built to solve the problem of rapidly reviewing multi-page documents, scanned forms, and receipts. The application combines server-side PDF parsing and Tesseract OCR with Google Gemini AI to produce structured, document-aware summaries in three detail levels (**Short**, **Medium**, and **Long**), along with categorized **Key Points** and practical **Improvement Suggestions**.

---

## ✨ Features

- 📄 **PDF Upload & Multi-Page Extraction**: Native PDF text parsing supporting multi-page documents.
- 📷 **Scanned Image OCR**: Optical Character Recognition (`Tesseract.js`) for PNG, JPG, JPEG, and WebP images.
- 📥 **Drag-and-Drop Upload**: Dual upload area with drag-and-drop and traditional file picker.
- ⚡ **AI Summarization**: Structured summary generation powered by Google Gemini API.
- 🎛️ **Selectable Summary Lengths**: Real-time length selection:
  - **Short**: Executive overview (~80–120 words).
  - **Medium**: Balanced summary with headers (~150–250 words).
  - **Long**: Comprehensive breakdown (~300–450 words).
- 📌 **Key Points & Main Ideas**: Categorized extraction of Objectives, Findings, Metrics, Requirements, and Conclusions.
- 💡 **Improvement Suggestions**: Practical, document-specific recommendations (*"Consider..."*, *"You could..."*, *"It may help to..."*) tailored to resumes, proposals, invoices, technical docs, and general files.
- ⌛ **Clear Loading States**: Progress indicators for uploading (*"Uploading document..."*), PDF parsing (*"Reading your document..."*), image scanning (*"Scanning document with OCR..."*), and AI processing (*"Understanding your document..."*).
- 🛡️ **Thoughtful Error Handling**: Friendly error messages for unsupported file types, 0-byte files, corrupted PDFs, unreadable images, and API outages.
- 📱 **Mobile-Responsive Interface**: Modern dark-mode layout designed for mobile, tablet, and desktop viewports.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Backend**: Node.js, Express, TypeScript, Multer (memory buffer storage).
- **Text Extraction & OCR**: `pdf-parse`, `pdfjs-dist`, `tesseract.js`.
- **AI Engine & Validation**: `@google/generative-ai` (Google Gemini API), `zod` schema validation.
- **Testing & Build**: Vitest, TypeScript compiler (`tsc`), Vite.

---

## 🔄 How It Works

```text
User Upload (PDF / PNG / JPG)
          │
          ▼
   File Validation
 (MIME Type & 10MB Limit)
          │
     ┌────┴────┐
     ▼         ▼
  Vector     Scanned
   PDF        Image
     │         │
[pdf-parse] [Tesseract OCR]
     │         │
     └────┬────┘
          ▼
    Extracted Text
          │
   AI Summarization
(Gemini API / Fallback)
          │
   ┌──────┼──────┐
   ▼      ▼      ▼
Summary Key    Improvement
(Short/ Points Suggestions
Medium/
 Long)
```

---

## 📁 Project Structure

```text
documind/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable UI components (UploadZone, SummaryCard, KeyPoints, Improvements, etc.)
│   │   ├── services/           # Frontend API client service
│   │   ├── types/              # Shared TypeScript definitions
│   │   └── App.tsx             # Main view component
│   └── vite.config.ts          # Vite build configuration
├── server/                     # Backend Express server application
│   ├── src/
│   │   ├── routes/             # REST endpoints (/api/extract, /api/summarize)
│   │   ├── services/           # Document, PDF parsing, OCR, and AI services
│   │   ├── utils/              # Text cleaning and NLP fallback
│   │   └── __tests__/          # Vitest test suites
│   └── tsconfig.json           # Server TypeScript configuration
├── api/
│   └── index.ts                # Vercel Serverless Function entry point
├── APPROACH.md                 # 200-word developer approach write-up
├── vercel.json                 # Vercel deployment routing configuration
├── .env.example                # Environment variable template
└── package.json                # Project scripts and dependencies
```

---

## 🚀 Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/document-summary-assistant.git
cd document-summary-assistant
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your Gemini API Key in `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

> **Note**: If `GEMINI_API_KEY` is not provided or unconfigured, DocuMind will automatically use its built-in NLP fallback engine to ensure zero runtime downtime.

### 3. Run Development Server

```bash
npm run dev
```

This starts the backend Express server on port 5000 and the Vite development server concurrently.

---

## 🧪 Build and Verification

Run automated tests, type checking, and production builds:

```bash
# Run unit test suites
npm test

# Run TypeScript type safety linting
npm run lint

# Run production build (Vite client + Server compilation)
npm run build

# Start production server locally
npm start
```

---

## 🌐 Deployment (Vercel)

DocuMind is pre-configured for one-click deployment on **Vercel** via `vercel.json` and `/api/index.ts`.

### Steps to Deploy to Vercel:

1. Push your repository to GitHub.
2. Import the repository into your Vercel Dashboard.
3. In Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `AI_MODEL`: `gemini-1.5-flash` (optional, defaults to `gemini-1.5-flash`).
4. Click **Deploy**. Vercel will build the frontend client and host the server routes as Serverless Functions.
