import React from 'react';
import { FileText, Sparkles, HelpCircle, Layers, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onReset: () => void;
  onLoadSample: (sampleType: 'proposal' | 'receipt') => void;
  hasActiveDocument: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, onLoadSample, hasActiveDocument }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                DocuMind
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI 2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Document Summary Assistant</p>
          </div>
        </div>

        {/* Action Controls & Demo Loaders */}
        <div className="flex items-center gap-3">
          {!hasActiveDocument ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 px-2 font-medium">Try Sample:</span>
              <button
                onClick={() => onLoadSample('proposal')}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-indigo-600/30 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Sample PDF
              </button>
              <button
                onClick={() => onLoadSample('receipt')}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-indigo-600/30 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Scanned Image
              </button>
            </div>
          ) : (
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 font-medium border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Document
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
