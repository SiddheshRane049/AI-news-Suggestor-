import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageSquare, Send, Bot, Sparkles, ExternalLink, RefreshCw, Bookmark
} from 'lucide-react';
import { chatApi } from '../api/client';

export const NewsChatModal = ({ isOpen, onClose, onSelectArticle }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI News Intelligence Copilot. Ask me anything about what's happening today across Technology, AI, Startups, Markets, Science, or World news. I synthesize answers directly from our live news database!",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', content: query, sources: [] }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({ role: m.role, content: m.content }));
      const res = await chatApi.chatNews(query, null, historyPayload);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply,
          sources: res.data.sources || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble retrieving and synthesizing the news. Please verify the NVIDIA API key or backend status.',
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl h-[650px] max-h-[90vh] flex flex-col rounded-2xl glass-panel shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-950/40 to-cyan-950/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-600/30 text-cyan-400 border border-violet-500/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <span>Chat with Today's News</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Live Grounded
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Synthesizing real-time articles powered by NVIDIA NIM Llama 3.3
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] space-y-2 p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-900/90 text-slate-200 border border-white/10'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Sources List */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                        Cited Sources:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-black/40 hover:bg-violet-950/40 text-[11px] text-slate-300 hover:text-cyan-300 border border-white/5 transition-all group"
                          >
                            <span className="truncate pr-2">
                              [{src.index || idx + 1}] {src.title}
                            </span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900/90 border border-white/10 p-3.5 rounded-2xl flex items-center space-x-2 text-xs text-cyan-300">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Cross-referencing latest feeds and generating response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-4 py-2 bg-black/30 border-t border-white/5 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-slate-400 shrink-0 text-[11px]">Suggestions:</span>
            {[
              "What's the biggest AI breakthrough today?",
              'Summarize key stock market movements',
              'Any major cybersecurity vulnerabilities reported?',
              'What are recent startup funding rounds?'
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] border border-white/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-white/10 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about today's news..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white font-medium flex items-center space-x-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
