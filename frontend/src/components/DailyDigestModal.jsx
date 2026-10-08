import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Volume2, VolumeX, Lightbulb, Clock, ArrowUpRight,
  CheckCircle2, RefreshCw, Calendar
} from 'lucide-react';
import { digestApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export const DailyDigestModal = ({ isOpen, onClose, onSelectArticle }) => {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [simplifiedMap, setSimplifiedMap] = useState({});
  const [loadingSimplifiedId, setLoadingSimplifiedId] = useState(null);
  const { error: toastError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDigest();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const res = await digestApi.getDaily();
      setDigest(res.data);
    } catch (err) {
      toastError('Failed to fetch daily briefing');
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = () => {
    if (!digest) return;
    if (!window.speechSynthesis) {
      toastError('TTS not supported');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = `Today's Intelligence Briefing for ${digest.date_str}. ${digest.intro}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const toggleExplainSimply = async (articleId) => {
    if (simplifiedMap[articleId]) {
      setSimplifiedMap((prev) => {
        const copy = { ...prev };
        delete copy[articleId];
        return copy;
      });
      return;
    }

    setLoadingSimplifiedId(articleId);
    try {
      const res = await digestApi.explainSimply(articleId);
      setSimplifiedMap((prev) => ({
        ...prev,
        [articleId]: res.data
      }));
    } catch (err) {
      toastError('Could not simplify story');
    } finally {
      setLoadingSimplifiedId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl glass-panel shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-950/60 to-indigo-950/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>Executive Morning Briefing</span>
                  {digest?.date_str && (
                    <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-normal">
                      <Calendar className="w-3 h-3" /> {digest.date_str}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">
                  AI-synthesized digest of the top 10 most crucial stories across your categories
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {loading && (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-400">Synthesizing personalized morning briefing with NVIDIA NIM...</p>
              </div>
            )}

            {!loading && digest && (
              <>
                {/* AI Intro Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-900/40 via-slate-900/80 to-cyan-950/40 border border-violet-500/30 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>THE MACRO OVERVIEW</span>
                    </div>
                    <button
                      onClick={handleTTS}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isPlayingAudio
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          <span>Mute Briefing</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Listen (Audio)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed italic">
                    "{digest.intro}"
                  </p>
                </div>

                {/* Top 10 Stories List */}
                <div className="space-y-4">
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">
                    Today's Top 10 Curated Developments
                  </h4>

                  <div className="space-y-3">
                    {digest.articles?.map((art, idx) => {
                      const isSimplified = !!simplifiedMap[art.id];
                      const simplifiedData = simplifiedMap[art.id];

                      return (
                        <div
                          key={art.id}
                          className="p-4 rounded-xl glass-card border border-white/5 hover:border-violet-500/30 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-3">
                              <span className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className="font-semibold text-cyan-400">{art.category}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-400">{art.source}</span>
                                </div>
                                <h5
                                  onClick={() => {
                                    onClose();
                                    onSelectArticle(art);
                                  }}
                                  className="font-display text-sm sm:text-base font-bold text-white hover:text-cyan-300 cursor-pointer transition-colors"
                                >
                                  {art.title}
                                </h5>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleExplainSimply(art.id)}
                              disabled={loadingSimplifiedId === art.id}
                              className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                isSimplified
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-white/5 hover:bg-amber-500/10 text-slate-300 border-white/10 hover:border-amber-500/30'
                              }`}
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden sm:inline">
                                {isSimplified ? 'Normal View' : 'Explain Simply'}
                              </span>
                              {loadingSimplifiedId === art.id && (
                                <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                              )}
                            </button>
                          </div>

                          {/* Content or Simplified View */}
                          {isSimplified ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5"
                            >
                              <p className="text-xs sm:text-sm text-amber-100">
                                {simplifiedData.simplified_explanation}
                              </p>
                              {simplifiedData.key_metaphor && (
                                <p className="text-xs text-amber-300 italic">
                                  💡 {simplifiedData.key_metaphor}
                                </p>
                              )}
                            </motion.div>
                          ) : (
                            <p className="text-xs sm:text-sm text-slate-300 pl-9 leading-relaxed">
                              {art.summary || art.title}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">Generated every 24 hours</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
