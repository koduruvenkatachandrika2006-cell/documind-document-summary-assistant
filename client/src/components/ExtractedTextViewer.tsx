import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Search, FileCode2 } from 'lucide-react';

interface ExtractedTextViewerProps {
  text: string;
}

export const ExtractedTextViewer: React.FC<ExtractedTextViewerProps> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const lines = text.split('\n');
  const filteredLines = searchTerm.trim()
    ? lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <div className="w-full surface-card overflow-hidden mb-6 border border-slate-800">
      
      {/* Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-slate-100">View Extracted Text</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                {lines.length} lines
              </span>
            </div>
            <p className="text-xs text-slate-400">Inspect raw text parsed from document parser or OCR engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
          <span>{isExpanded ? 'Hide Raw Text' : 'View Extracted Text'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Raw Text Content Drawer */}
      {isExpanded && (
        <div className="p-5 pt-0 border-t border-slate-800/80">
          
          {/* Action Tools: Search Bar & Copy */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter extracted text lines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Extracted Text Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Raw Text</span>
                </>
              )}
            </button>
          </div>

          {/* Text Code Container with Line Numbers */}
          <div className="max-h-96 overflow-y-auto bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800/80 leading-relaxed">
            {filteredLines.length > 0 ? (
              filteredLines.map((line, idx) => (
                <div key={idx} className="flex gap-4 hover:bg-slate-900/60 py-0.5 px-1 rounded">
                  <span className="text-slate-600 select-none w-8 text-right shrink-0 font-mono text-[11px]">{idx + 1}</span>
                  <span className="whitespace-pre-wrap break-words flex-1">{line || ' '}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-6">No matching lines found for "{searchTerm}"</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
