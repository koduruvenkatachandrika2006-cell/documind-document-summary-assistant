import React from 'react';
import { ProcessedDocument } from '../types/index.js';
import { BarChart2, BookOpen, Clock, FileCode, Layers, ShieldCheck, Tag, Cpu } from 'lucide-react';

interface InsightsDashboardProps {
  document: ProcessedDocument;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ document }) => {
  const stats = [
    { label: 'Total Pages', value: document.pageCount, icon: Layers, sub: `${(document.documentType || 'image').toUpperCase()} file` },
    { label: 'Word Count', value: document.wordCount.toLocaleString(), icon: BookOpen, sub: `${document.characterCount.toLocaleString()} chars` },
    { label: 'Est. Reading Time', value: `~${document.estimatedReadingTimeMinutes} min`, icon: Clock, sub: 'Based on 200 wpm' },
    { label: 'Document Domain', value: document.insights.domain, icon: Tag, sub: `Complexity: ${document.insights.complexity}` },
    { label: 'Extraction Pipeline', value: document.extractionMethod, icon: Cpu, sub: `${document.processingTimeMs}ms latency` },
    { label: 'Tone & Sentiment', value: document.insights.sentiment, icon: ShieldCheck, sub: 'AI Sentiment Classifier' },
  ];

  return (
    <div className="w-full glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-8">
      
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-sky-600/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100">Document Insights & Metrics</h2>
          <p className="text-xs text-slate-400">Empirical calculations, readability stats, and technical attributes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 mb-3">
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1">{s.label}</p>
                <p className="text-sm sm:text-base font-bold text-slate-100 truncate">{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-1 truncate">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
