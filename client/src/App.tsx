import React, { useState, useEffect } from 'react';
import { ProcessedDocument } from './types/index.js';
import { apiService } from './services/apiService.js';
import { SAMPLE_PROPOSAL_DOC, SAMPLE_RECEIPT_DOC } from './utils/sampleData.js';

import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { UploadZone } from './components/UploadZone.js';
import { ProcessingState } from './components/ProcessingState.js';
import { DashboardHeader } from './components/Dashboard.js';
import { SummaryCard } from './components/SummaryCard.js';
import { KeyPointsSection } from './components/KeyPointsSection.js';
import { ImprovementsSection } from './components/ImprovementsSection.js';
import { InsightsDashboard } from './components/InsightsDashboard.js';
import { ExtractedTextViewer } from './components/ExtractedTextViewer.js';
import { ErrorAlert } from './components/ErrorAlert.js';

export function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedDoc, setProcessedDoc] = useState<ProcessedDocument | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Restore document from URL or LocalStorage on refresh
  useEffect(() => {
    const initPersistence = async () => {
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      let docId = searchParams.get('id');

      if (!docId && pathname.startsWith('/document/')) {
        docId = pathname.replace('/document/', '').trim();
      }

      if (docId) {
        setIsProcessing(true);
        const serverDoc = await apiService.fetchDocumentById(docId);
        if (serverDoc) {
          setProcessedDoc(serverDoc);
          localStorage.setItem('documind_cached_doc', JSON.stringify(serverDoc));
        } else {
          const cachedStr = localStorage.getItem('documind_cached_doc');
          if (cachedStr) {
            try {
              const cached = JSON.parse(cachedStr);
              if (cached.id === docId) {
                setProcessedDoc(cached);
                apiService.syncStoreDocument(cached);
              } else {
                setErrorMessage('Document not found or session expired. Please upload a document.');
              }
            } catch (e) {
              setErrorMessage('Document not found. Please upload a new document.');
            }
          } else {
            setErrorMessage('Document not found. Please upload a new document.');
          }
        }
        setIsProcessing(false);
      }
    };

    initPersistence();
  }, []);

  // For the HOME page only, disable browser scroll restoration and ensure initial load starts at the top
  useEffect(() => {
    if (!processedDoc && !isProcessing) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [processedDoc, isProcessing]);

  const setActiveDocument = (doc: ProcessedDocument | null) => {
    setProcessedDoc(doc);
    if (doc) {
      localStorage.setItem('documind_cached_doc', JSON.stringify(doc));
      apiService.syncStoreDocument(doc).catch(err => console.warn('[App] syncStoreDocument background notice:', err));
      if (window.location.pathname !== `/document/${doc.id}`) {
        window.history.pushState({}, '', `/document/${doc.id}`);
      }
    } else {
      localStorage.removeItem('documind_cached_doc');
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setActiveDocument(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await apiService.uploadDocument(file);
      setActiveDocument(result);
    } catch (error: any) {
      console.error('[App] Document upload failed:', error);
      setErrorMessage(error.message || 'Unable to finish processing this scanned document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async (sampleType: 'proposal' | 'receipt') => {
    handleReset();
    setIsProcessing(true);
    setErrorMessage(null);

    const fileName = sampleType === 'proposal' ? 'sample_proposal.pdf' : 'sample_scanned_invoice.png';
    const mimeType = sampleType === 'proposal' ? 'application/pdf' : 'image/png';
    const filePath = `/${fileName}`;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName} sample file.`);
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType });

      setSelectedFile(file);
      const result = await apiService.uploadDocument(file);
      setActiveDocument(result);
    } catch (err: any) {
      console.error(`[App] Sample ${sampleType} processing failed:`, err);
      setErrorMessage(err.message || 'Unable to finish processing this scanned document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySummary = (textToCopy?: string) => {
    if (!processedDoc) return;
    const text = textToCopy || processedDoc.summary.medium;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSummary = (textToDownload?: string) => {
    if (!processedDoc) return;
    const summaryText = textToDownload || processedDoc.summary.medium;
    
    const content = `# DocuMind AI Summary — ${processedDoc.title}
Document: ${processedDoc.fileName} (${processedDoc.pageCount} pages, ${processedDoc.wordCount} words)
Date: ${new Date().toLocaleDateString()}

---

## Executive Summary
${summaryText}

---

## Key Points
${processedDoc.keyPoints.map(kp => `- [${kp.category}] ${kp.point}`).join('\n')}

---

## Improvement Suggestions
${processedDoc.improvements.map(imp => `- [${imp.category}] ${imp.suggestion}`).join('\n')}

---

Generated by DocuMind AI Assistant
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${processedDoc.fileName.replace(/\.[^/.]+$/, '')}_Summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isImageFile = selectedFile ? ['png', 'jpg', 'jpeg', 'webp'].includes(selectedFile.name.split('.').pop()?.toLowerCase() || '') : false;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      
      {/* Navigation Header */}
      <Navbar
        onReset={handleReset}
        onLoadSample={handleLoadSample}
        hasActiveDocument={Boolean(processedDoc)}
      />

      {/* Main View Container — Navbar is sticky top-0 in document flow, pt-6 sm:pt-10 provides clean top spacing */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12">
        
        {/* LANDING / UPLOAD VIEW */}
        {!isProcessing && !processedDoc && !errorMessage && (
          <div className="flex flex-col items-center text-center space-y-8 my-2">
            
            {/* Hero Title & Subtitle */}
            <div className="space-y-3 max-w-2xl pt-2">
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-slate-100 tracking-tight">
                Turn documents into <span className="text-indigo-400">clear insights.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
                Upload a PDF or scanned document and let AI extract text, generate structured summaries, and surface key points.
              </p>
            </div>

            {/* Upload Box Component */}
            <div className="w-full">
              <UploadZone
                onFileSelected={handleFileSelected}
                onLoadSample={handleLoadSample}
              />
            </div>

            {/* Simple "How It Works" Section */}
            <div className="w-full max-w-2xl pt-10 mt-6 border-t border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">How it works</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="surface-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-200">Upload</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select a PDF or image file up to 10MB.</p>
                  </div>
                </div>

                <div className="surface-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-200">Extract</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">PDF text parser or Tesseract OCR extracts content.</p>
                  </div>
                </div>

                <div className="surface-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-200">Summarize</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">AI surfaces key points & improvement suggestions.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PROCESSING STATE */}
        {isProcessing && (
          <div className="py-12">
            <ProcessingState
              fileName={selectedFile ? selectedFile.name : 'Sample Document'}
              isImage={isImageFile}
            />
          </div>
        )}

        {/* ERROR STATE */}
        {errorMessage && !isProcessing && (
          <div className="py-8">
            <ErrorAlert
              message={errorMessage}
              onRetry={handleReset}
            />
          </div>
        )}

        {/* RESULTS VIEW */}
        {processedDoc && !isProcessing && (
          <div className="space-y-6">
            
            {/* 1. Document Information Header */}
            <DashboardHeader
              document={processedDoc}
              onReset={handleReset}
              onCopySummary={() => handleCopySummary()}
              onDownloadSummary={() => handleDownloadSummary()}
              isCopied={isCopied}
            />

            {/* 2. Summary Controls (Short / Medium / Long) */}
            <SummaryCard
              summaries={processedDoc.summary}
              onCopy={(text) => handleCopySummary(text)}
              onDownload={(text) => handleDownloadSummary(text)}
              isCopied={isCopied}
            />

            {/* 3. Key Points */}
            <KeyPointsSection
              keyPoints={processedDoc.keyPoints}
            />

            {/* 4. Improvement Suggestions */}
            <ImprovementsSection
              improvements={processedDoc.improvements}
            />

            {/* 5. Document Insights */}
            <InsightsDashboard
              document={processedDoc}
            />

            {/* 6. Extracted Text Viewer */}
            <ExtractedTextViewer
              text={processedDoc.extractedText}
            />

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
