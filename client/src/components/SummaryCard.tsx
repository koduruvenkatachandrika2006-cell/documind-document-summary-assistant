import React, { useState } from 'react';
import { StructuredSummaries, SummaryLengthMode } from '../types/index.js';
import { Sparkles, Copy, Check, Download, AlignLeft, Info } from 'lucide-react';

interface SummaryCardProps {
  summaries: StructuredSummaries;
  onCopy: (text: string) => void;
  onDownload: (text: string) => void;
  isCopied: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summaries, onCopy, onDownload, isCopied }) => {
  const [activeMode, setActiveMode] = useState<SummaryLengthMode>('medium');

  const currentSummary = summaries[activeMode] || summaries.medium || summaries.short || '';

  const modes: { key: SummaryLengthMode; label: string; wordGuide: string }[] = [
    { key: 'short', label: 'Short', wordGuide: '~80-120 words' },
    { key: 'medium', label: 'Medium', wordGuide: '~150-250 words' },
    { key: 'long', label: 'Long', wordGuide: '~300-450 words' },
  ];

  const wordCount = currentSummary.split(/\s+/).filter(Boolean).length;

  /**
   * Helper function to format summary text blocks with headings and structured paragraphs
   */
  const renderFormattedSummary = (text: string) => {
    const blocks = text.split('\n\n');

    return blocks.map((block, bIdx) => {
      const lines = block.split('\n');

      return (
        <div key={bIdx} className="space-y-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            // Header line detection (e.g. "Overview:", "Key Details:", "Executive Overview:")
            if (/^[A-Z][A-Za-z0-9\s&]+:$/.test(trimmed) || trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
              const headerText = trimmed.replace(/^#+\s*/, '');
              return (
                <h4 key={lIdx} className="font-display font-semibold text-indigo-300 text-sm tracking-wide pt-2 pb-0.5 border-b border-slate-800/60">
                  {headerText}
                </h4>
              );
            }

            // Bullet list detection
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2.5 pl-2 text-slate-200 text-sm leading-relaxed">
                  <span className="text-indigo-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{trimmed.substring(2)}</span>
                </div>
              );
            }

            // Standard paragraph
            return (
              <p key={lIdx} className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="w-full surface-card p-6 sm:p-8 shadow-xl mb-6">
      
      {/* Header & Mode Selector Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-100">Summary</h2>
            <p className="text-xs text-slate-400">Select summary mode to adjust detail level</p>
          </div>
        </div>

        {/* Short | Medium | Long Segmented Control */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMode(m.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeMode === m.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

      </div>

      {/* Mode word count indicator */}
      <div className="py-2.5 flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800/40">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          Mode: <strong className="text-slate-200 capitalize">{activeMode}</strong> ({modes.find(m => m.key === activeMode)?.wordGuide})
        </span>
        <span className="font-mono text-[11px] text-slate-400 font-medium">
          {wordCount} words
        </span>
      </div>

      {/* Rendered Formatted Summary Content */}
      <div className="bg-slate-900/60 rounded-xl p-5 sm:p-6 border border-slate-800/80 space-y-4">
        {renderFormattedSummary(currentSummary)}
      </div>

      {/* Card Action Tools */}
      <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
          DocuMind AI Summary Engine
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopy(currentSummary)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => onDownload(currentSummary)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download</span>
          </button>
        </div>
      </div>

    </div>
  );
};
