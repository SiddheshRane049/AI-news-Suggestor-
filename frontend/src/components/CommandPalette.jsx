import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X, ArrowRight, ExternalLink, MessageSquare } from 'lucide-react';
import { articlesApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

export const CommandPalette = ({ isOpen, onClose, onSelectArticle, onOpenNewsChat }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // open modal handled by parent state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await articlesApi.list({ search: query, page_size: 6 });
        setResults(res.data.items || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl rounded-2xl glass-panel shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Search Input Box */}
          <div className="flex items-center px-4 py-3.5 border-b border-white/10">
            <Search className="w-5 h-5 text-violet-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news, topics, companies, or keywords..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-base focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="ml-2 px-2 py-0.5 text-xs text-slate-400 bg-white/5 rounded border border-white/10">
              ESC
            </kbd>
          </div>

          {/* Quick Actions if query is empty */}
          {!query && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quick AI Actions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNewsChat();
                    }}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/5 hover:border-violet-500/30 text-left transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Ask News AI</p>
                      <p className="text-[11px] text-slate-400">Grounded Q&A on today's stories</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      navigate('/trending');
                    }}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 hover:bg-cyan-600/20 border border-white/5 hover:border-cyan-500/30 text-left transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Explore Trending</p>
                      <p className="text-[11px] text-slate-400">Highest impact developments</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Popular Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['AI & ML', 'Technology', 'Cybersecurity', 'Startups', 'Business & Finance', 'Science'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          onClose();
                          navigate(`/category/${cat}`);
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && (
            <div className="max-h-96 overflow-y-auto p-3 space-y-1">
              {loading && (
                <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span>Searching intelligence database...</span>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No articles matched "{query}". Try a different keyword or category.
                </div>
              )}

              {!loading &&
                results.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => {
                      onClose();
                      onSelectArticle(art);
                    }}
                    className="p-3 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1">
                        <span className="text-violet-400 font-medium">{art.category}</span>
                        <span>•</span>
                        <span>{art.source}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {art.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{art.summary}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
            </div>
          )}

          {/* Footer Note */}
          <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Powered by NVIDIA NIM LLMs</span>
            <span>Press ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
