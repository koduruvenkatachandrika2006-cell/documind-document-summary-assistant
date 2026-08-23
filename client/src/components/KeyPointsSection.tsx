import React from 'react';
import { KeyPoint } from '../types/index.js';
import { Target, CheckCircle, BarChart3, AlertCircle, Bookmark, FileSpreadsheet } from 'lucide-react';

interface KeyPointsSectionProps {
  keyPoints: KeyPoint[];
}

export const KeyPointsSection: React.FC<KeyPointsSectionProps> = ({ keyPoints }) => {
  const getCategoryBadge = (category: KeyPoint['category']) => {
    switch (category) {
      case 'Objective':
        return { icon: Target, bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
      case 'Finding':
        return { icon: CheckCircle, bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'Requirement':
        return { icon: AlertCircle, bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'Metric':
        return { icon: BarChart3, bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'Conclusion':
        return { icon: Bookmark, bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30' };
      default:
        return { icon: FileSpreadsheet, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="w-full surface-card p-6 sm:p-8 shadow-xl mb-6">
      
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-slate-100">Key Points</h2>
          <p className="text-xs text-slate-400">Concise takeaways and core information extracted from the document</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {keyPoints.map((item, idx) => {
          const { icon: CategoryIcon, bg } = getCategoryBadge(item.category);

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-indigo-400 mt-1 font-mono text-xs font-bold shrink-0">{idx + 1}.</span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {item.point}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${bg}`}>
                  <CategoryIcon className="w-3 h-3" />
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Item #{idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
