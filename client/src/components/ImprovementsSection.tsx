import React, { useState } from 'react';
import { ImprovementSuggestion } from '../types/index.js';
import { Lightbulb, Sparkles, FileSearch, Layers, Eye, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface ImprovementsSectionProps {
  improvements: ImprovementSuggestion[];
}

export const ImprovementsSection: React.FC<ImprovementsSectionProps> = ({ improvements }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const getCategoryIcon = (category: ImprovementSuggestion['category']) => {
    switch (category) {
      case 'Clarity':
        return Eye;
      case 'Structure':
        return Layers;
      case 'Readability':
        return Sparkles;
      case 'Actionability':
        return CheckSquare;
      default:
        return FileSearch;
    }
  };

  return (
    <div className="w-full surface-card p-6 sm:p-8 shadow-xl mb-6 transition-all duration-300">
      
      {/* Header with Collapsible Toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none pb-4 border-b border-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-100">Improvement Suggestions</h2>
            <p className="text-xs text-slate-400">"Practical ways to strengthen this document"</p>
          </div>
        </div>

        <button 
          aria-label="Toggle improvement suggestions"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="space-y-3 mt-5">
          {improvements.map((item, idx) => {
            const Icon = getCategoryIcon(item.category);

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-start gap-3.5"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 font-mono font-bold text-xs mt-0.5">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-amber-400" />
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {item.suggestion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
