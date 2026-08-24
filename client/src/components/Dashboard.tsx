import React from 'react';
import { ProcessedDocument } from '../types/index.js';
import { FileCheck, Download, Copy, Check, RefreshCw, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  document: ProcessedDocument;
  onReset: () => void;
  onCopySummary: () => void;
  onDownloadSummary: () => void;
  isCopied: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  document,
  onReset,
  onCopySummary,
  onDownloadSummary,
  isCopied
}) => {
  return (
    <div className="w-full surface-card p-6 sm:p-8 shadow-xl mb-6">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Document Title & Information */}
        <div className="space-y-3 max-w-3xl">
          
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              {(document.documentType || 'image').toUpperCase()} Document
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {document.extractionMethod}
            </span>
            <span className="px-2 py-1 rounded-md text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800">
              {document.processingTimeMs}ms latency
            </span>
          </div>

          {/* Document Title */}
          <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-100 tracking-tight">
            {document.title}
          </h1>

          {/* Explicit Document Meta Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-medium">Filename</p>
              <p className="text-xs font-semibold text-slate-200 truncate" title={document.fileName}>{document.fileName}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-medium">Page Count</p>
              <p className="text-xs font-semibold text-slate-200">{document.pageCount} {document.pageCount === 1 ? 'Page' : 'Pages'}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-medium">Word Count</p>
              <p className="text-xs font-semibold text-slate-200">{document.wordCount.toLocaleString()} Words</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-medium">Est. Reading Time</p>
              <p className="text-xs font-semibold text-slate-200">~{document.estimatedReadingTimeMinutes} min read</p>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          
          {/* Copy Summary */}
          <button
            onClick={onCopySummary}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {/* Download Summary */}
          <button
            onClick={onDownloadSummary}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1.5"
            title="Upload another document"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

    </div>
  );
};
