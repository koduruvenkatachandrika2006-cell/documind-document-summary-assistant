import React from 'react';
import { ImprovementSuggestion } from '../types/index.js';
import { Lightbulb, Sparkles, FileSearch, Layers, Eye, CheckSquare } from 'lucide-react';

interface ImprovementsSectionProps {
  improvements: ImprovementSuggestion[];
}

export const ImprovementsSection: React.FC<ImprovementsSectionProps> = ({ improvements }) => {
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
    <div className="w-full surface-card p-6 sm:p-8 shadow-xl mb-6">
      
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-slate-100">Improvement Suggestions</h2>
          <p className="text-xs text-slate-400">Actionable recommendations to enhance document quality and scope</p>
        </div>
      </div>

      <div className="space-y-3">
        {improvements.map((item, idx) => {
          const Icon = getCategoryIcon(item.category);

          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
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

    </div>
  );
};
