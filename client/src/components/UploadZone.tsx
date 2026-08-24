import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, AlertCircle, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onLoadSample: (sampleType: 'proposal' | 'receipt') => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, onLoadSample, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setValidationError(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (file.size > MAX_SIZE) {
      setValidationError(`This document is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed file size is 10MB.`);
      return false;
    }

    if (file.size === 0) {
      setValidationError('The selected document is empty (0 bytes). Please upload a valid document.');
      return false;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    if (!ext || !validExts.includes(ext)) {
      setValidationError('Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG file.');
      return false;
    }

    return true;
  };

  const handleFileChange = (file: File) => {
    if (validateFile(file)) {
      setStagedFile(file);
    } else {
      setStagedFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    if (stagedFile) {
      onFileSelected(stagedFile);
    }
  };

  const clearStagedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      
      {/* Upload Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`surface-card p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]'
            : stagedFile
            ? 'border-indigo-500/50 bg-slate-900/90'
            : 'hover:border-indigo-500/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center">
          
          {/* Top Icon */}
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <UploadCloud className="w-7 h-7" />
          </div>

          {!stagedFile ? (
            <>
              <h3 className="font-display font-bold text-xl text-slate-100 mb-1">
                Drop your document here
              </h3>
              
              <p className="text-xs text-slate-400 mb-5">
                or <span className="text-indigo-400 font-semibold underline decoration-indigo-500/30">browse files from your computer</span>
              </p>

              {/* Format badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  PDF
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  PNG
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  JPG
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  JPEG
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Maximum file size: 10MB
              </p>
            </>
          ) : (
            /* Selected File Display & Analyze Button */
            <div className="w-full space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/30 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{stagedFile.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{(stagedFile.size / 1024).toFixed(1)} KB &bull; {stagedFile.type || 'Document'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearStagedFile}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={disabled}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Analyze Document</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Quick Sample Selector */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400 mb-2.5 font-medium">Or test immediately with sample data:</p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onLoadSample('proposal');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Sample PDF Proposal
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onLoadSample('receipt');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            Sample Scanned Invoice
          </button>
        </div>
      </div>

    </div>
  );
};
