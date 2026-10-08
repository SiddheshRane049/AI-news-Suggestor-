import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, Sparkles, Volume2, VolumeX, MessageSquare,
  Send, Bot, CheckCircle2, Clock, Flame, Lightbulb, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { chatApi, digestApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export const ArticleModal = ({ article, isOpen, onClose, initialChatOpen = false }) => {
  const [activeTab, setActiveTab] = useState(initialChatOpen ? 'chat' : 'details');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [simplified, setSimplified] = useState(null);
  const [loadingSimplified, setLoadingSimplified] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef(null);
  const { error: toastError } = useToast();

  useEffect(() => {
    if (initialChatOpen) {
      setActiveTab('chat');
    } else {
      setActiveTab('details');
    }
    setSimplified(null);
    setChatMessages([]);
  }, [article, initialChatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!isOpen || !article) return null;

  const handleTTS = () => {
    if (!window.speechSynthesis) {
      toastError('Text-to-speech not supported.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const content = `${article.title}. Summary: ${article.summary}. Key points: ${(article.key_points || []).join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleExplainSimply = async () => {
    if (simplified) {
      setSimplified(null);
      return;
    }
    setLoadingSimplified(true);
    try {
      const res = await digestApi.explainSimply(article.id);
      setSimplified(res.data);
    } catch (err) {
      toastError('Failed to generate simplified explanation');
    } finally {
      setLoadingSimplified(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSendingChat) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    const newHistory = [...chatMessages, { role: 'user', content: userText }];
    setChatMessages(newHistory);
    setIsSendingChat(true);

    try {
      const historyPayload = newHistory.map((m) => ({ role: m.role, content: m.content }));
      const res = await chatApi.chatArticle(article.id, userText, historyPayload);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not retrieve AI response. Check backend API key configuration.' },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl glass-panel shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-violet-600 text-white">
                {article.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {article.source}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Tab selector */}
              <div className="flex bg-slate-900/90 rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === 'details' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === 'chat' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'details' ? (
              <>
                {/* Title */}
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight mb-2">
                    {article.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {article.reading_time} min read
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span className="text-violet-400 font-medium">
                      Impact: {article.importance_score}/10
                    </span>
                  </div>
                </div>

                {/* Audio Reader & Explain Simply buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleTTS}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isPlayingAudio
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <VolumeX className="w-4 h-4 animate-pulse" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <span>Listen to Summary</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExplainSimply}
                    disabled={loadingSimplified}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 transition-all"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>{simplified ? 'Original View' : 'Explain Simply (ELI5)'}</span>
                    {loadingSimplified && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
                  </button>
                </div>

                {/* Simplified Explanation Box if activated */}
                {simplified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span>SIMPLIFIED TAKEAWAY (ELI5)</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {simplified.simplified_explanation}
                    </p>
                    {simplified.key_metaphor && (
                      <div className="text-xs text-amber-200/90 italic pt-1 border-t border-amber-500/20">
                        💡 <strong>Intuitive Analogy:</strong> "{simplified.key_metaphor}"
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Executive Summary */}
                <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/20 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-violet-400 tracking-wider">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI EXECUTIVE SUMMARY</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                    {article.summary || article.title}
                  </p>
                </div>

                {/* Key Takeaways */}
                {article.key_points && article.key_points.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Key Takeaways & Findings
                    </h4>
                    <div className="space-y-2">
                      {article.key_points.map((pt, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-white/5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Topic Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Chat with Article Assistant */
              <div className="flex flex-col h-[400px]">
                <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/20 mb-3 flex items-center space-x-2 text-xs text-cyan-300">
                  <Bot className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Ask anything about this article. Responses are grounded in the article text.</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-10 space-y-2">
                      <Bot className="w-8 h-8 text-violet-400 mx-auto opacity-60" />
                      <p className="text-xs text-slate-400">
                        Suggested questions you can ask:
                      </p>
                      <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        {['What are the main consequences?', 'Who is most impacted by this?', 'Explain the background context'].map(
                          (q, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setInputMessage(q);
                              }}
                              className="text-xs text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                            >
                              "{q}"
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-200 border border-white/10'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isSendingChat && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 p-3 rounded-xl flex items-center space-x-2 text-xs text-slate-400">
                        <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>AI analyzing story...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a question about this article..."
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !inputMessage.trim()}
                    className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>Read Original on {article.source}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
