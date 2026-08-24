import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, FileText, Cpu, Sparkles, Layers, CheckSquare } from 'lucide-react';

interface ProcessingStateProps {
  fileName: string;
  isImage: boolean;
  currentStep?: number;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ fileName, isImage, currentStep }) => {
  const [internalStep, setInternalStep] = useState<number>(1);

  useEffect(() => {
    if (typeof currentStep === 'number') return;
    const t1 = setTimeout(() => setInternalStep(2), 500);
    const t2 = setTimeout(() => setInternalStep(3), 1100);
    const t3 = setTimeout(() => setInternalStep(4), 1800);
    const t4 = setTimeout(() => setInternalStep(5), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [currentStep]);

  const step = typeof currentStep === 'number' ? currentStep : internalStep;

  const steps = [
    { id: 1, label: 'Document uploaded', detail: fileName },
    { id: 2, label: 'Extracting text', detail: isImage ? 'Tesseract OCR scan running' : 'Reading PDF text layer' },
    { id: 3, label: 'Analyzing document', detail: 'Processing structure & metrics' },
    { id: 4, label: 'Generating summary', detail: 'Executing AI analysis engine' },
    { id: 5, label: 'Preparing results', detail: 'Formatting key points & insights' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto surface-card p-6 sm:p-8 shadow-xl">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div>
          <h4 className="font-display font-bold text-base text-slate-100">Processing Document</h4>
          <p className="text-xs text-slate-400">Extracting text and generating insights</p>
        </div>
      </div>

      {/* 5 Progress Milestones */}
      <div className="space-y-3.5">
        {steps.map((s) => {
          const isDone = step > s.id;
          const isCurrent = step === s.id;

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                isCurrent
                  ? 'bg-slate-900 border border-indigo-500/40 text-slate-100'
                  : isDone
                  ? 'bg-slate-900/40 text-slate-300'
                  : 'text-slate-600 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{s.label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{s.detail}</p>
                </div>
              </div>

              {isDone && <span className="text-[10px] font-semibold text-emerald-400 shrink-0">Done</span>}
            </div>
          );
        })}
      </div>

      {/* Progress Line */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

    </div>
  );
};
