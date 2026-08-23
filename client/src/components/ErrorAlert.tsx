import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  return (
    <div className="w-full max-w-2xl mx-auto glass-card rounded-3xl p-6 border border-red-800/60 bg-red-950/20 text-red-200 shadow-2xl animate-fade-in mb-8">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h4 className="font-display font-semibold text-slate-100 text-base mb-1">
            Unable to Process Document
          </h4>
          <p className="text-xs sm:text-sm text-red-300 leading-relaxed mb-4">
            {message}
          </p>

          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white border border-red-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Uploading Another File
          </button>
        </div>
      </div>
    </div>
  );
};
