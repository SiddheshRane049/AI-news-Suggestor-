import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Bookmark, Volume2, VolumeX, MessageSquare, ExternalLink,
  Clock, Sparkles, Flame, CheckCircle2, Share2, HelpCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { interactionsApi } from '../api/client';

export const ArticleCard = ({
  article,
  onSelectArticle,
  onOpenChat,
  onTagClick
}) => {
  const { user, openLogin } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLiked, setIsLiked] = useState(article.is_liked || false);
  const [isSaved, setIsSaved] = useState(article.is_saved || false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    const nextState = !isLiked;
    setIsLiked(nextState);
    try {
      await interactionsApi.toggle(article.id, 'like', nextState);
    } catch (err) {
      setIsLiked(!nextState);
      toastError('Failed to update like status');
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      await interactionsApi.toggle(article.id, 'save', nextState);
      if (nextState) success('Saved to your bookmarks');
    } catch (err) {
      setIsSaved(!nextState);
      toastError('Failed to bookmark');
    }
  };

  const handleTTS = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) {
      toastError('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${article.title}. Summary: ${article.summary || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(article.url);
      success('Link copied to clipboard!');
    }
  };

  const getSentimentStyle = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onClick={() => onSelectArticle(article)}
      className="group relative rounded-2xl glass-card overflow-hidden cursor-pointer flex flex-col justify-between border border-white/10 hover:border-violet-500/40"
    >
      {/* Card Header & Content */}
      <div className="p-5 space-y-3">
        {/* Why this recommendation badge (if personalized) */}
        {article.why_this && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-violet-950/70 border border-violet-500/30 text-[11px] font-medium text-violet-300 w-fit">
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{article.why_this}</span>
          </div>
        )}

        {/* Source, Category & Sentiment Header */}
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-semibold text-violet-400">{article.category}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium truncate">{article.source}</span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getSentimentStyle(article.sentiment)}`}>
              {article.sentiment}
            </span>
            {article.importance_score >= 8.5 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center">
                <Flame className="w-3 h-3 mr-0.5" /> {article.importance_score.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Image (Optional thumbnail) */}
        {article.image_url && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-900">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title */}
        <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
          {article.title}
        </h3>

        {/* AI Summary */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
          {article.summary || article.title}
        </p>

        {/* Key Takeaways quick preview */}
        {article.key_points && article.key_points.length > 0 && (
          <div className="pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowKeyPoints(!showKeyPoints);
              }}
              className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>{showKeyPoints ? 'Hide Key Takeaways' : 'View Key Takeaways'}</span>
            </button>

            {showKeyPoints && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5"
              >
                {article.key_points.slice(0, 3).map((pt, i) => (
                  <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {article.tags.slice(0, 4).map((tag, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick && onTagClick(tag);
                }}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 border border-white/5 hover:border-violet-500/30 transition-all"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer with Meta & Actions */}
      <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
        {/* Read time & date */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-slate-400" />
            {article.reading_time}m read
          </span>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* TTS Audio */}
          <button
            onClick={handleTTS}
            title="Listen to summary"
            className={`p-1.5 rounded-lg transition-colors ${
              isPlayingAudio ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Ask AI about this */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat && onOpenChat(article);
            }}
            title="Ask AI about this article"
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            title={isLiked ? 'Liked' : 'Like'}
            className={`p-1.5 rounded-lg transition-colors ${
              isLiked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-rose-400 hover:bg-white/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={handleSave}
            title={isSaved ? 'Saved' : 'Save for later'}
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved ? 'text-violet-400 bg-violet-500/10' : 'text-slate-400 hover:text-violet-300 hover:bg-white/10'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Share"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
