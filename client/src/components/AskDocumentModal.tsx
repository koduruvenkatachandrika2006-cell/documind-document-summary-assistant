import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/index.js';
import { apiService } from '../services/apiService.js';
import { X, Send, Bot, User, Sparkles, Loader2, FileText } from 'lucide-react';

interface AskDocumentModalProps {
  documentId: string;
  documentText: string;
  documentTitle: string;
  onClose: () => void;
}

export const AskDocumentModal: React.FC<AskDocumentModalProps> = ({
  documentId,
  documentText,
  documentTitle,
  onClose
}) => {
  const chatKey = `documind_chat_${documentId}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(chatKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I am DocuMind Assistant. Ask me anything about "${documentTitle}" and I will answer strictly based on its document context.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Lock body scrolling when modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Save conversation history to sessionStorage scoped to documentId
  useEffect(() => {
    try {
      sessionStorage.setItem(chatKey, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, chatKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q || !q.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsGenerating(true);

    try {
      const res = await apiService.askQuestion(documentId, q.trim(), documentText, messages);
      
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `Sorry, I couldn't answer that question. ${error.message || 'Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sampleQuestions = [
    'What is the primary goal or conclusion?',
    'What role is the candidate applying for?',
    'What technical skills are mentioned?',
    'What company is mentioned?',
    'Where did you find it?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      
      {/* Viewport-Safe Modal Box */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-32px)] h-[min(680px,calc(100vh-32px))]">
        
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-slate-100 text-base flex items-center gap-2">
                Ask This Document
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                  Grounded Q&A
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{documentTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Independently Scrollable Conversation Area */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] min-w-0 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
              }`}>
                <p>{m.text}</p>

                {/* Source location citation badge */}
                {m.source && m.sender === 'ai' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-medium text-slate-300">Source:</span>
                    <span className="font-mono text-indigo-300 text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 truncate">
                      {m.source}
                    </span>
                  </div>
                )}

                <span className={`text-[10px] mt-1.5 block font-mono ${m.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-500'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-2 text-xs text-indigo-300">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Searching document context...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="shrink-0 px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
          </span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950 text-slate-300 hover:text-indigo-200 border border-slate-700 shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Fixed Input Bar */}
        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about this document..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isGenerating}
              className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isGenerating}
              className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white flex items-center justify-center transition-colors shadow-lg shadow-indigo-600/20 disabled:shadow-none shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
